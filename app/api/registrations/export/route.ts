import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';
import { getOrganizationByEmail } from '@/lib/subscriptions';
import { RegistrationService } from '@/lib/services/RegistrationService';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const registrationService = new RegistrationService();

// GET /api/registrations/export?orgId=xxx&format=csv|pdf - Export registrations
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orgId = searchParams.get('orgId');
    const format = (searchParams.get('format') || 'csv').toLowerCase();

    if (!orgId) {
      return NextResponse.json(
        { success: false, error: 'orgId query parameter is required' },
        { status: 400 }
      );
    }

    if (!['csv', 'pdf'].includes(format)) {
      return NextResponse.json(
        { success: false, error: 'format must be csv or pdf' },
        { status: 400 }
      );
    }

    // Get registrations for the organization
    const registrations = await registrationService.listRegistrations(orgId, {});

    if (format === 'csv') {
      return generateCSV(registrations);
    } else if (format === 'pdf') {
      return await generatePDF(registrations);
    }

    return NextResponse.json(
      { success: false, error: 'Unsupported format' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateCSV(registrations: any[]): NextResponse {
  if (registrations.length === 0) {
    return new NextResponse('No registrations to export', {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="registrations-${Date.now()}.csv"`
      }
    });
  }

  // Parse first registration to get field names
  const firstReg = registrations[0];
  const firstFormData = JSON.parse(firstReg.registrationData);
  
  // Build CSV header
  const standardFields = ['Registration ID', 'QR Code ID', 'Registered At', 'Status', 'Checked In', 'Checked In At'];
  const dynamicFields = Object.keys(firstFormData).map(key => {
    const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
    return label;
  });
  const headers = [...standardFields, ...dynamicFields];

  // Build CSV rows
  const rows = registrations.map(reg => {
    const formData = JSON.parse(reg.registrationData);
    const standardValues = [
      reg.id,
      reg.qrCodeId,
      new Date(reg.registeredAt).toLocaleString(),
      reg.deliveryStatus,
      reg.checkedInAt ? 'Yes' : 'No',
      reg.checkedInAt ? new Date(reg.checkedInAt).toLocaleString() : ''
    ];
    const dynamicValues = Object.keys(firstFormData).map(key => {
      const value = formData[key];
      // Escape CSV values (handle commas, quotes, newlines)
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    return [...standardValues, ...dynamicValues];
  });

  // Combine into CSV
  const csvLines = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ];
  const csv = csvLines.join('\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="registrations-${Date.now()}.csv"`
    }
  });
}

async function generatePDF(registrations: any[]): Promise<NextResponse> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // US Letter size
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = 750;
  const lineHeight = 15;
  const margin = 50;

  // Title
  page.drawText('Registration Export', {
    x: margin,
    y,
    size: 20,
    font: boldFont,
    color: rgb(0, 0, 0),
  });
  y -= 30;

  // Date
  page.drawText(`Exported: ${new Date().toLocaleString()}`, {
    x: margin,
    y,
    size: 10,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });
  y -= 20;

  // Summary
  page.drawText(`Total Registrations: ${registrations.length}`, {
    x: margin,
    y,
    size: 12,
    font: boldFont,
  });
  y -= 30;

  // Table headers
  const headers = ['ID', 'QR Code', 'Registered', 'Status', 'Checked In'];
  const colWidths = [80, 100, 150, 100, 100];
  let x = margin;

  headers.forEach((header, i) => {
    page.drawText(header, {
      x,
      y,
      size: 10,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    x += colWidths[i];
  });
  y -= lineHeight;

  // Draw line
  page.drawLine({
    start: { x: margin, y },
    end: { x: 562, y },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  y -= 10;

  // Registration rows
  for (const reg of registrations.slice(0, 40)) { // Limit to 40 per page
    if (y < 50) {
      // New page
      const newPage = pdfDoc.addPage([612, 792]);
      y = 750;
      // Copy headers to new page
      x = margin;
      headers.forEach((header, i) => {
        newPage.drawText(header, {
          x,
          y,
          size: 10,
          font: boldFont,
          color: rgb(0, 0, 0),
        });
        x += colWidths[i];
      });
      y -= lineHeight;
      newPage.drawLine({
        start: { x: margin, y },
        end: { x: 562, y },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      y -= 10;
    }

    const formData = JSON.parse(reg.registrationData);
    x = margin;
    
    // ID (truncated)
    page.drawText(reg.id.substring(0, 8), {
      x,
      y,
      size: 8,
      font,
    });
    x += colWidths[0];

    // QR Code
    page.drawText(reg.qrCodeId || '-', {
      x,
      y,
      size: 8,
      font,
    });
    x += colWidths[1];

    // Registered date
    page.drawText(new Date(reg.registeredAt).toLocaleDateString(), {
      x,
      y,
      size: 8,
      font,
    });
    x += colWidths[2];

    // Status
    page.drawText(reg.deliveryStatus, {
      x,
      y,
      size: 8,
      font,
    });
    x += colWidths[3];

    // Checked in
    page.drawText(reg.checkedInAt ? 'Yes' : 'No', {
      x,
      y,
      size: 8,
      font,
    });

    y -= lineHeight;
  }

  // If more registrations, add note
  if (registrations.length > 40) {
    y -= 10;
    page.drawText(`... and ${registrations.length - 40} more registrations`, {
      x: margin,
      y,
      size: 10,
      font: boldFont,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="registrations-${Date.now()}.pdf"`
    }
  });
}

