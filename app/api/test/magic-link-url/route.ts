import { NextRequest, NextResponse } from 'next/server';

/**
 * Test endpoint to verify magic link URL generation logic
 * Simulates what happens in sendVerificationRequest callback
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { originalUrl, email } = body;

    if (!originalUrl) {
      return NextResponse.json(
        { error: 'originalUrl is required' },
        { status: 400 }
      );
    }

    // Replicate the logic from authOptions.ts sendVerificationRequest
    const baseUrl = process.env.PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://www.blessbox.org';
    
    let correctedUrl: string;
    try {
      const urlObj = new URL(originalUrl);
      const baseUrlObj = new URL(baseUrl);
      // Replace origin but preserve path and query params
      correctedUrl = `${baseUrlObj.origin}${urlObj.pathname}${urlObj.search}${urlObj.hash}`;
    } catch (error) {
      // If URL parsing fails, return original
      correctedUrl = originalUrl;
    }

    return NextResponse.json({
      originalUrl,
      correctedUrl,
      baseUrl,
      nextAuthUrl: process.env.NEXTAUTH_URL || 'NOT SET',
      publicAppUrl: process.env.PUBLIC_APP_URL || 'NOT SET',
      email: email || 'not provided',
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

