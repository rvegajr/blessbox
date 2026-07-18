import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { ensureDbReady } from '@/lib/db-ready';
import { getDbClient } from '@/lib/db';
import { getEnv } from '@/lib/utils/env';
import { rateLimit, rateLimitResponse } from '@/lib/security/rateLimit';

export const runtime = 'nodejs';

/**
 * POST /api/test/verification-code
 *
 * Secret-gated helper for QA automation to fetch the latest onboarding
 * verification code, so QA does not need to read real inboxes.
 *
 * SECURITY: this returns a login OTP, so a leak of the gating secret is an
 * account-takeover primitive. Hardening (prod-readiness P3):
 *  - Uses its OWN dedicated secret PROD_TEST_VERIFICATION_SECRET (falls back to
 *    PROD_TEST_SEED_SECRET only for backward-compat) so it is not tied to the
 *    widely-reused seed secret.
 *  - Constant-time secret comparison; NO debug/oracle in the 403 response.
 *  - In production, the requested email MUST be on the QA allow-list
 *    (QA_TEST_LOGIN_ALLOWED_EMAILS) — you cannot read an arbitrary user's code.
 *  - Rate-limited per IP.
 *
 * Body: { email: string }
 */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function POST(req: NextRequest) {
  // Rate limit — this endpoint hands back an OTP.
  const ipLimit = rateLimit(req, { key: 'test/verification-code:ip', limit: 10, windowMs: 60_000 });
  if (!ipLimit.allowed) return rateLimitResponse(ipLimit.retryAfterSec);

  const isProd = process.env.NODE_ENV === 'production';
  // Prefer a dedicated secret; fall back to the seed secret only for compat.
  const secret = getEnv('PROD_TEST_VERIFICATION_SECRET') || getEnv('PROD_TEST_SEED_SECRET');
  const provided = (req.headers.get('x-qa-verification-token') || req.headers.get('x-qa-seed-token') || req.headers.get('x-test-seed-secret') || '').trim();

  if (isProd) {
    if (!secret || !provided || !safeEqual(provided, secret)) {
      // No debug object — do not reveal whether the secret is configured/matched.
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
  }

  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    if (!email) {
      return NextResponse.json({ success: false, error: 'email is required' }, { status: 400 });
    }

    // In production, restrict to explicitly allow-listed QA accounts so a leaked
    // secret cannot be used to read any user's login code.
    if (isProd) {
      const allowList = (getEnv('QA_TEST_LOGIN_ALLOWED_EMAILS') || '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      if (!allowList.includes(email.toLowerCase())) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
    }

    await ensureDbReady();
    const db = getDbClient();

    const result = await db.execute({
      sql: `
        SELECT code, created_at, expires_at, verified
        FROM verification_codes
        WHERE email = ?
        ORDER BY created_at DESC
        LIMIT 1
      `,
      args: [email],
    });

    const row = (result.rows?.[0] || null) as any;
    if (!row?.code) {
      return NextResponse.json({ success: false, error: 'No code found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      email,
      code: String(row.code),
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      verified: !!row.verified,
    });
  } catch (error) {
    console.error('verification-code error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
