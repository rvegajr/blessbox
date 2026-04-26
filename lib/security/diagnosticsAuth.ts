import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/utils/env';

/**
 * Shared diagnostics-secret gate for all debug/test/system endpoints.
 *
 * Behavior:
 *  - Requires `Authorization: Bearer <DIAGNOSTICS_SECRET>` (CRON_SECRET also accepted as fallback).
 *  - On failure in production: returns 404 to hide endpoint existence from anonymous probes.
 *  - On failure in non-production: returns 401 with a JSON body so devs see the actual reason.
 *  - If no secret is configured at all, ALWAYS rejects (never silently allow).
 *
 * Returns a Response on failure, or `null` on success (caller continues).
 */
export function requireDiagnosticsSecret(req: NextRequest | Request): Response | null {
  const isProd = process.env.NODE_ENV === 'production';
  const secret = getEnv('DIAGNOSTICS_SECRET') || getEnv('CRON_SECRET');

  const authHeader = (req.headers.get('authorization') || '').trim();
  const token = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : '';

  const ok = !!secret && token.length > 0 && token === secret;
  if (ok) return null;

  if (isProd) {
    // Hide existence in production.
    return new NextResponse('Not Found', { status: 404 });
  }
  return NextResponse.json(
    { success: false, error: 'Unauthorized: diagnostics secret required' },
    { status: 401 }
  );
}

/**
 * Returns true if the diagnostics secret is present and valid on the request.
 * Useful when a route wants to short-circuit rather than return.
 */
export function hasValidDiagnosticsSecret(req: NextRequest | Request): boolean {
  return requireDiagnosticsSecret(req) === null;
}
