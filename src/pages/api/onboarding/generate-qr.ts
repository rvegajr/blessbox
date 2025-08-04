import type { APIRoute } from 'astro';
import QRCode from 'qrcode';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    const body = await request.json();
    const { qrCodes, organizationData } = body;

    if (!qrCodes || !Array.isArray(qrCodes)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'QR codes array is required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate QR codes
    const generatedQRCodes = await Promise.all(
      qrCodes.map(async (qrData: any) => {
        try {
          // Create user-friendly registration URL
          const baseUrl = 'https://blessbox.app'; // In production, use actual domain
          
          // Create URL-friendly slugs
          const orgSlug = (organizationData?.organizationName || 'event')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
          
          const labelSlug = (qrData.label || 'main')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
          
          const registrationUrl = `${baseUrl}/register/${orgSlug}/${labelSlug}`;

          // Generate QR code as data URL (base64)
          const qrCodeDataUrl = await QRCode.toDataURL(registrationUrl, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            quality: 0.92,
            margin: 1,
            color: {
              dark: '#0d9488', // Teal color to match BlessBox branding
              light: '#ffffff'
            },
            width: 256 // 256x256 pixels
          });

          return {
            id: `qr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            label: qrData.label || 'Main QR Code',
            url: registrationUrl,
            dataUrl: qrCodeDataUrl,
            generatedAt: new Date().toISOString(),
          };
        } catch (error) {
          console.error(`Failed to generate QR code for ${qrData.label}:`, error);
          throw error;
        }
      })
    );

    console.log(`✅ Generated ${generatedQRCodes.length} QR codes for ${organizationData?.organizationName || 'organization'}`);

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'QR codes generated successfully',
        qrCodes: generatedQRCodes,
        totalGenerated: generatedQRCodes.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('QR code generation error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to generate QR codes',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};