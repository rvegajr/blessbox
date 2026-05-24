import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';
import { resolveOrganizationForSession } from '@/lib/subscriptions';
import { RegistrationService } from '@/lib/services/RegistrationService';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { getDbClient } from '@/lib/db';
import { parseRegistrationData, type FormField } from '@/lib/utils/registration-field-parser';
import { buildCsv } from '@/lib/services/RegistrationsCsvBuilder';

const registrationService = new RegistrationService();

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
    const deliveryStatus = searchParams.get('deliveryStatus') || undefined;
    const registrations = await registrationService.listRegistrations(organization.id, {
      ...(deliveryStatus ? { deliveryStatus } : {}),
    });

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
  const csv = buildCsv({ registrations, formFields, timezone });

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

  // Issue #24: previous widths [80,100,150,100,100] caused QR Code (full UUID,
  // ~36 chars at 8pt ≈ 145px) to overflow into the Registered column. Solution:
  //   - widen QR Code so it fits the truncated label
  //   - shorten ID column (we only print 8 chars)
  //   - keep Registered wide enough for "MM/DD/YYYY HH:MM AM"
  // Truncating qrCodeId at 8 chars + "…" keeps the row a single line.
  const headers = ['ID', 'QR Code', 'Registered', 'Status', 'Checked In'];
  const colWidths = [60, 90, 170, 95, 90]; // sums to 505 — fits with margins of 36
  const truncate = (value: string, max: number): string =>
    value.length <= max ? value : `${value.substring(0, max)}…`;
  const drawRow = (
    target: typeof page,
    rowY: number,
    cells: [string, string, string, string, string]
  ) => {
    let cx = margin;
    cells.forEach((cell, i) => {
      target.drawText(cell, { x: cx, y: rowY, size: 8, font });
      cx += colWidths[i];
    });
  };

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

    drawRow(page, y, [
      truncate(reg.id, 8),
      truncate(reg.qrCodeId || '-', 8),
      new Date(reg.registeredAt).toLocaleString('en-US', { timeZone: timezone, dateStyle: 'short', timeStyle: 'short' }),
      reg.deliveryStatus,
      reg.checkedInAt ? 'Yes' : 'No',
    ]);
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
