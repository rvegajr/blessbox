import { NextRequest, NextResponse } from 'next/server';
import { requireDiagnosticsSecret } from '@/lib/security/diagnosticsAuth';
import { getEnv } from '@/lib/utils/env';

/**
 * Debug endpoint to check auth URL configuration.
 * Diagnostics-secret gated in ALL environments (returns 404 in prod when secret absent).
 */
export async function GET(request: NextRequest) {
  const authFailure = requireDiagnosticsSecret(request);
  if (authFailure) return authFailure;

  const nextAuthUrl = getEnv('NEXTAUTH_URL', 'NOT SET');
  const publicAppUrl = getEnv('PUBLIC_APP_URL', 'NOT SET');
  const nextPublicAppUrl = getEnv('NEXT_PUBLIC_APP_URL', 'NOT SET');

  const baseUrl =
    publicAppUrl !== 'NOT SET'
      ? publicAppUrl
      : nextAuthUrl !== 'NOT SET'
        ? nextAuthUrl
        : 'https://www.blessbox.org';

  return NextResponse.json({
    nextAuthUrl,
    publicAppUrl,
    nextPublicAppUrl,
    magicLinkBaseUrl: baseUrl,
    nodeEnv: process.env.NODE_ENV || 'development',
    trustHost: true,
  });
}
