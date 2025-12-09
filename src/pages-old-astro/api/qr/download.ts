import type { APIRoute } from 'astro';
import JSZip from 'jszip';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// Helper to convert data URL to Uint8Array
function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] || '';
  const binaryString = Buffer.from(base64, 'base64');
  return new Uint8Array(binaryString);
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { qrCodes, format } = body as {
      qrCodes: Array<{ label: string; dataUrl: string }>;
      format?: 'png' | 'pdf' | 'both';
    };

    if (!Array.isArray(qrCodes) || qrCodes.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'qrCodes array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const choice: 'png' | 'pdf' | 'both' = (format as any) || 'both';
    const zip = new JSZip();
    const pngFolder = choice !== 'pdf' ? zip.folder('png')! : null;
    const pdfFolder = choice !== 'png' ? zip.folder('pdf')! : null;

    // Add PNG files
    if (pngFolder) {
      for (const item of qrCodes) {
        const bytes = dataUrlToUint8Array(item.dataUrl);
        const safe = (item.label || 'qr').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase();
        pngFolder.file(`${safe}.png`, bytes);
      }
    }

    // Add PDFs (one QR per page with a title)
    if (pdfFolder) {
      for (const item of qrCodes) {
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([612, 792]); // Letter portrait
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const pngBytes = dataUrlToUint8Array(item.dataUrl);
        const pngImage = await pdfDoc.embedPng(pngBytes);
        const { width, height } = pngImage.scale(1);

        // Center image
        const imgW = Math.min(300, width);
        const scale = imgW / width;
        const imgH = height * scale;
        const x = (612 - imgW) / 2;
        const y = (792 - imgH) / 2;

        page.drawImage(pngImage, { x, y, width: imgW, height: imgH });
        page.drawText(item.label || 'QR Code', {
          x: 72,
          y: 720,
          size: 18,
          font,
          color: rgb(0.1, 0.4, 0.4),
        });

        const pdfBytes = await pdfDoc.save();
        const safe = (item.label || 'qr').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase();
        pdfFolder.file(`${safe}.pdf`, pdfBytes);
      }
    }

    const archive = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    const fileName = `qr-codes-${Date.now()}.zip`;

    return new Response(archive, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('QR ZIP download error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to bundle QR codes' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};



