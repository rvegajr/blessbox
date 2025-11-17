import type { APIRoute } from 'astro';
import { createDatabaseConnection, getDatabase } from '../../../database/connection';
import { ensureLibsqlSchema } from '../../../database/bootstrap';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { registrations, qrCodeSets } from '../../../database/schema';
import { and, eq, desc } from 'drizzle-orm';

function toCsvRow(values: Array<string | number | undefined | null>): string {
  return values
    .map((v) => {
      const s = v === null || v === undefined ? '' : String(v);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    })
    .join(',');
}

export const GET: APIRoute = async ({ request, url }) => {
  try {
    await createDatabaseConnection();
    
    // Ensure database schema exists
    await ensureLibsqlSchema({});
    
    const db = getDatabase();

    const orgId = url.searchParams.get('orgId');
    const format = (url.searchParams.get('format') || 'csv').toLowerCase();

    if (!orgId) {
      return new Response(
        JSON.stringify({ success: false, error: 'orgId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!['csv', 'pdf'].includes(format)) {
      return new Response(
        JSON.stringify({ success: false, error: 'format must be csv or pdf' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let rows: any[] = [];
    
    try {
      rows = await db
        .select({
          id: registrations.id,
          qrCodeSetId: registrations.qrCodeSetId,
          qrCodeId: registrations.qrCodeId,
          registrationData: registrations.registrationData,
          deliveryStatus: registrations.deliveryStatus,
          deliveredAt: registrations.deliveredAt,
          registeredAt: registrations.registeredAt,
        })
        .from(registrations)
        .innerJoin(qrCodeSets, eq(registrations.qrCodeSetId, qrCodeSets.id))
        .where(and(eq(qrCodeSets.organizationId, orgId)))
        .orderBy(desc(registrations.registeredAt));
    } catch (dbError) {
      console.warn('Database query failed, returning empty results:', dbError);
      // Return empty results if database query fails (e.g., tables don't exist)
      rows = [];
    }

    // Build common fields
    const headers = [
      'id',
      'qrCodeSetId',
      'qrCodeId',
      'firstName',
      'lastName',
      'email',
      'phone',
      'deliveryStatus',
      'deliveredAt',
      'registeredAt',
    ];
    if (format === 'csv') {
      const lines: string[] = [];
      lines.push(headers.join(','));
      for (const row of rows) {
        let parsed: any = {};
        try {
          parsed = typeof row.registrationData === 'string' ? JSON.parse(row.registrationData) : row.registrationData;
        } catch {}
        lines.push(
          toCsvRow([
            row.id,
            row.qrCodeSetId,
            row.qrCodeId,
            parsed.firstName || parsed.fullName || '',
            parsed.lastName || '',
            parsed.email || '',
            parsed.phone || '',
            row.deliveryStatus,
            row.deliveredAt || '',
            row.registeredAt,
          ])
        );
      }
      const csv = lines.join('\n');
      const fileName = `registrations-${orgId}-${Date.now()}.csv`;
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    // PDF export (simple table, one row per line)
    const pdfDoc = await PDFDocument.create();
    let currentPage = pdfDoc.addPage([612, 792]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const margin = 36;
    let y = 756; // top margin

    // Title
    currentPage.drawText('Registrations Export', { x: margin, y, size: 16, font: fontBold });
    y -= 24;
    currentPage.drawText(`Organization: ${orgId}`, { x: margin, y, size: 10, font });
    y -= 20;

    // Header row
    const headerLine = headers.join(' | ');
    currentPage.drawText(headerLine, { x: margin, y, size: 10, font: fontBold });
    y -= 16;

    for (const row of rows) {
      if (y < 60) {
        // new page
        currentPage = pdfDoc.addPage([612, 792]);
        y = 756;
        currentPage.drawText(headers.join(' | '), { x: margin, y, size: 10, font: fontBold });
        y -= 16;
      }
      let parsed: any = {};
      try {
        parsed = typeof row.registrationData === 'string' ? JSON.parse(row.registrationData) : row.registrationData;
      } catch {}

      const values = [
        row.id,
        row.qrCodeSetId,
        row.qrCodeId,
        parsed.firstName || parsed.fullName || '',
        parsed.lastName || '',
        parsed.email || '',
        parsed.phone || '',
        row.deliveryStatus,
        row.deliveredAt || '',
        row.registeredAt,
      ];
      const line = values.map((v) => (v == null ? '' : String(v))).join(' | ');
      currentPage.drawText(line.slice(0, 1100), { x: margin, y, size: 9, font });
      y -= 14;
    }

    const pdfBytes = await pdfDoc.save();
    const fileName = `registrations-${orgId}-${Date.now()}.pdf`;
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Export CSV error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to export registrations' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};


