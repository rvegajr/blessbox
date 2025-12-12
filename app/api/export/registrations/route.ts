import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';
import { getOrganizationByEmail } from '@/lib/subscriptions';
import { RegistrationService } from '@/lib/services/RegistrationService';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const registrationService = new RegistrationService();

// POST /api/export/registrations - Export registrations as CSV or PDF
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const organization = await getOrganizationByEmail(session.user.email);
    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { format = 'csv', filters } = body;

    // Get registrations with filters
    const registrations = await registrationService.listRegistrations(
      organization.id,
      filters
    );

    if (format === 'csv') {
      // Generate CSV
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
    } else if (format === 'pdf') {
      // Generate a simple PDF report using pdf-lib
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const margin = 40;
      const lineHeight = 14;
      const titleSize = 16;
      const textSize = 10;

      const buildRows = () => {
        if (registrations.length === 0) return { headers: [], rows: [] as string[][] };
        const firstReg = registrations[0];
        const firstFormData = JSON.parse(firstReg.registrationData);
        const standardFields = ['Registration ID', 'QR Code ID', 'Registered At', 'Status', 'Checked In', 'Checked In At'];
        const dynamicFields = Object.keys(firstFormData).map((key) =>
          key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
        );
        const headers = [...standardFields, ...dynamicFields];
        const rows = registrations.map((reg) => {
          const formData = JSON.parse(reg.registrationData);
          const standardValues = [
            reg.id,
            reg.qrCodeId,
            new Date(reg.registeredAt).toLocaleString(),
            reg.deliveryStatus,
            reg.checkedInAt ? 'Yes' : 'No',
            reg.checkedInAt ? new Date(reg.checkedInAt).toLocaleString() : '',
          ];
          const dynamicValues = Object.keys(firstFormData).map((key) => {
            const v = formData[key];
            return v === null || v === undefined ? '' : String(v);
          });
          return [...standardValues, ...dynamicValues];
        });
        return { headers, rows };
      };

      const { headers, rows } = buildRows();
      const fileLabel = `registrations-${new Date().toISOString().split('T')[0]}`;

      // Render pages as line-wrapped text (readable + includes all data)
      let page = pdfDoc.addPage();
      let { width, height } = page.getSize();
      let y = height - margin;

      const newPage = () => {
        page = pdfDoc.addPage();
        ({ width, height } = page.getSize());
        y = height - margin;
      };

      const drawLine = (text: string, bold = false) => {
        if (y < margin + lineHeight) newPage();
        page.drawText(text, {
          x: margin,
          y,
          size: bold ? textSize : textSize,
          font: bold ? fontBold : font,
          color: rgb(0.1, 0.1, 0.1),
          maxWidth: width - margin * 2,
        });
        y -= lineHeight;
      };

      // Title
      page.drawText('BlessBox Registrations Export', {
        x: margin,
        y,
        size: titleSize,
        font: fontBold,
        color: rgb(0.05, 0.05, 0.05),
      });
      y -= titleSize + 8;
      drawLine(`Organization: ${organization.id}`);
      drawLine(`Generated: ${new Date().toLocaleString()}`);
      y -= 6;

      if (rows.length === 0) {
        drawLine('No registrations to export.');
      } else {
        drawLine('Headers:', true);
        drawLine(headers.join(' | '));
        y -= 6;

        rows.forEach((row, idx) => {
          drawLine(`Registration ${idx + 1}`, true);
          for (let i = 0; i < headers.length; i++) {
            drawLine(`${headers[i]}: ${row[i] ?? ''}`);
          }
          y -= 6;
        });
      }

      const pdfBytes = await pdfDoc.save();
      return new NextResponse(Buffer.from(pdfBytes), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileLabel}.pdf"`,
        },
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported format. Use "csv" or "pdf"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}








