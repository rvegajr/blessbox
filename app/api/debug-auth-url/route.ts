import { NextResponse } from 'next/server';

/**
 * Debug endpoint to check auth URL configuration
 * Shows what URLs are configured for magic links
 */
export async function GET() {
  const nextAuthUrl = process.env.NEXTAUTH_URL || 'NOT SET';
  const publicAppUrl = process.env.PUBLIC_APP_URL || 'NOT SET';
  const nextPublicAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'NOT SET';
  
  // Determine what URL would be used for magic links
  const baseUrl = publicAppUrl !== 'NOT SET' ? publicAppUrl : (nextAuthUrl !== 'NOT SET' ? nextAuthUrl : 'https://www.blessbox.org');
  
  return NextResponse.json({
    nextAuthUrl,
    publicAppUrl,
    nextPublicAppUrl,
    magicLinkBaseUrl: baseUrl,
    nodeEnv: process.env.NODE_ENV || 'development',
    trustHost: true, // From authOptions
  });
}

