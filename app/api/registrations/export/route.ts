import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';
import { resolveOrganizationForSession } from '@/lib/subscriptions';
import { RegistrationService } from '@/lib/services/RegistrationService';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { getDbClient } from '@/lib/db';
import { parseRegistrationData, type FormField } from '@/lib/utils/registration-field-parser';

const registrationService = new RegistrationService();

// UTF-8 BOM so Excel on Windows renders non-ASCII correctly.
const UTF8_BOM = '﻿';

/**
 * Escape a CSV cell, including defending against spreadsheet formula injection.
 * Cells beginning with `=`, `+`, `-`, `@`, tab, or carriage return are prefixed
 * with a single quote so Excel/Sheets/Numbers do not evaluate them.
 */
function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return '';
  let s = String(value);
  if (s.length > 0 && /^[=+\-@\t\r]/.test(s)) {
    s = `'${s}`;
  }
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// GET /api/registrations/export?format=csv|pdf - Export registrations for the
// caller's active organization. The previous `orgId` query param is now ignored
// (it allowed unauthenticated bulk PII export — see qa-report Blocker 5).
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const organization = await resolveOrganizationForSession(session);
    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization selection required' },
        { status: 409 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const format = (searchParams.get('format') || 'csv').toLowerCase();
    const timezone = searchParams.get('timezone') || 'America/Los_Angeles';

    if (!['csv', 'pdf'].includes(format)) {
      return NextResponse.json(
        { success: false, error: 'format must be csv or pdf' },
        { status: 400 }
      );
    }

    // Org is always derived from the session — never trust client-supplied orgId.
    const registrations = await registrationService.listRegistrations(organization.id, {});

    // Fetch form field definitions for this org so exports use custom labels, not field IDs.
    let formFields: FormField[] | undefined;
    try {
      const db = getDbClient();
      const qrSetResult = await db.execute({
        sql: `SELECT form_fields FROM qr_code_sets WHERE organization_id = ? AND is_active = 1 LIMIT 1`,
        args: [organization.id],
      });
      if (qrSetResult.rows.length > 0) {
        const raw = (qrSetResult.rows[0] as any).form_fields;
        formFields = raw ? JSON.parse(raw) : undefined;
      }
    } catch {
      // Fall through — export will still work with ID-based names as fallback
    }

    if (format === 'csv') {
      return generateCSV(registrations, timezone, formFields);
    }
    return await generatePDF(registrations, timezone);
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateCSV(registrations: any[], timezone: string, formFields?: FormField[]): NextResponse {
  if (registrations.length === 0) {
    return new NextResponse(UTF8_BOM + 'No registrations to export', {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="registrations-${Date.now()}.csv"`,
      },
    });
  }

  const standardFields = [
    'Registration ID',
    'QR Code ID',
    'Registered At',
    'Status',
    'Checked In',
    'Checked In At',
  ];

  // Build dynamic column headers from form field definitions (custom labels) when available.
  // Fall back to camelCase-split field ID names if no form config is present.
  let dynamicHeaders: string[];
  let getRowDynamicValues: (formData: Record<string, any>) => any[];

  if (formFields && formFields.length > 0) {
    dynamicHeaders = formFields.map((f) => f.label);
    getRowDynamicValues = (formData) => formFields.map((f) => formData[f.id] ?? '');
  } else {
    // Derive column order from the first registration's keys
    const firstFormData = JSON.parse(registrations[0].registrationData);
    const dynamicFieldKeys = Object.keys(firstFormData);
    dynamicHeaders = dynamicFieldKeys.map(
      (key) => key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
    );
    getRowDynamicValues = (formData) => dynamicFieldKeys.map((key) => formData[key]);
  }

  const headers = [...standardFields, ...dynamicHeaders];

  const rows = registrations.map((reg) => {
    const formData = JSON.parse(reg.registrationData);
    const standardValues = [
      reg.id,
      reg.qrCodeId,
      new Date(reg.registeredAt).toLocaleString('en-US', { timeZone: timezone }),
      reg.deliveryStatus,
      reg.checkedInAt ? 'Yes' : 'No',
      reg.checkedInAt
        ? new Date(reg.checkedInAt).toLocaleString('en-US', { timeZone: timezone })
        : '',
    ];
    const dynamicValues = getRowDynamicValues(formData);
    return [...standardValues, ...dynamicValues].map(csvEscape);
  });

  const csv =
    UTF8_BOM +
    [headers.map(csvEscape).join(','), ...rows.map((row) => row.join(','))].join('\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="registrations-${Date.now()}.csv"`,
    },
  });
}

async function generatePDF(registrations: any[], timezone: string): Promise<NextResponse> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = 750;
  const lineHeight = 15;
  const margin = 50;

  page.drawText('Registration Export', {
    x: margin, y, size: 20, font: boldFont, color: rgb(0, 0, 0),
  });
  y -= 30;

  page.drawText(`Exported: ${new Date().toLocaleString('en-US', { timeZone: timezone })} (${timezone})`, {
    x: margin, y, size: 10, font, color: rgb(0.5, 0.5, 0.5),
  });
  y -= 20;

  page.drawText(`Total Registrations: ${registrations.length}`, {
    x: margin, y, size: 12, font: boldFont,
  });
  y -= 30;

  const headers = ['ID', 'QR Code', 'Registered', 'Status', 'Checked In'];
  const colWidths = [80, 100, 150, 100, 100];
  let x = margin;
  headers.forEach((header, i) => {
    page.drawText(header, { x, y, size: 10, font: boldFont, color: rgb(0, 0, 0) });
    x += colWidths[i];
  });
  y -= lineHeight;
  page.drawLine({
    start: { x: margin, y }, end: { x: 562, y }, thickness: 1, color: rgb(0, 0, 0),
  });
  y -= 10;

  for (const reg of registrations.slice(0, 40)) {
    if (y < 50) {
      const newPage = pdfDoc.addPage([612, 792]);
      y = 750;
      x = margin;
      headers.forEach((header, i) => {
        newPage.drawText(header, { x, y, size: 10, font: boldFont, color: rgb(0, 0, 0) });
        x += colWidths[i];
      });
      y -= lineHeight;
      newPage.drawLine({
        start: { x: margin, y }, end: { x: 562, y }, thickness: 1, color: rgb(0, 0, 0),
      });
      y -= 10;
    }

    x = margin;
    page.drawText(reg.id.substring(0, 8), { x, y, size: 8, font });
    x += colWidths[0];
    page.drawText(reg.qrCodeId || '-', { x, y, size: 8, font });
    x += colWidths[1];
    page.drawText(
      new Date(reg.registeredAt).toLocaleString('en-US', { timeZone: timezone, dateStyle: 'short', timeStyle: 'short' }),
      { x, y, size: 8, font }
    );
    x += colWidths[2];
    page.drawText(reg.deliveryStatus, { x, y, size: 8, font });
    x += colWidths[3];
    page.drawText(reg.checkedInAt ? 'Yes' : 'No', { x, y, size: 8, font });
    y -= lineHeight;
  }

  if (registrations.length > 40) {
    y -= 10;
    page.drawText(`... and ${registrations.length - 40} more registrations`, {
      x: margin, y, size: 10, font: boldFont, color: rgb(0.5, 0.5, 0.5),
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new NextResponse(pdfBytes as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="registrations-${Date.now()}.pdf"`,
    },
  });
}
