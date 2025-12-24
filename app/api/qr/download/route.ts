import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] || '';
  const bin = Buffer.from(base64, 'base64');
  return new Uint8Array(bin);
}

/**
 * Legacy endpoint used by existing e2e specs.
 * Creates a ZIP with QR code images (PNG) and optionally a PDF.
 *
 * Body:
 *  { qrCodes: [{ label, dataUrl }], format: 'png' | 'pdf' | 'both' }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const qrCodes = Array.isArray(body?.qrCodes) ? body.qrCodes : [];
    const format = (body?.format || 'png') as 'png' | 'pdf' | 'both';

    if (qrCodes.length === 0) {
      return NextResponse.json({ success: false, error: 'qrCodes array is required' }, { status: 400 });
    }

    const zip = new JSZip();

    // Add PNG images
    if (format === 'png' || format === 'both') {
      for (const q of qrCodes) {
        if (!q?.label || !q?.dataUrl) continue;
        const bytes = dataUrlToBytes(q.dataUrl);
        zip.file(`qr/${q.label}.png`, bytes);
      }
    }

    // Add a simple PDF (optional)
    if (format === 'pdf' || format === 'both') {
      const pdf = await PDFDocument.create();

      for (const q of qrCodes) {
        if (!q?.label || !q?.dataUrl) continue;
        const page = pdf.addPage([612, 792]); // letter
        const pngBytes = dataUrlToBytes(q.dataUrl);
        const png = await pdf.embedPng(pngBytes);
        const { width, height } = png.scale(1);
        const max = 300;
        const scale = Math.min(max / width, max / height);
        const w = width * scale;
        const h = height * scale;
        page.drawImage(png, { x: 156, y: 420, width: w, height: h });
        page.drawText(q.label, { x: 72, y: 380, size: 16 });
      }

      const pdfBytes = await pdf.save();
      zip.file('qr/qr-codes.pdf', pdfBytes);
    }

    const zipBytes = await zip.generateAsync({ type: 'nodebuffer' });

    return new NextResponse(zipBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="qr-codes.zip"',
      },
    });
  } catch (error) {
    console.error('QR download error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

