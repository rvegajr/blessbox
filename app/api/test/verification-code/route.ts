import { NextRequest, NextResponse } from 'next/server';
import { ensureDbReady } from '@/lib/db-ready';
import { getDbClient } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * POST /api/test/verification-code
 *
 * Secret-gated helper for QA automation to fetch the latest onboarding verification code.
 * This avoids needing to read real inboxes to test /api/onboarding/send-verification + /api/onboarding/verify-code.
 *
 * - In production: requires header `x-test-seed-secret` matching env `PROD_TEST_SEED_SECRET`
 * - In non-production: allowed without secret
 *
 * Body:
 *  { email: string }
 */
export async function POST(req: NextRequest) {
  const isProd = process.env.NODE_ENV === 'production';
  const secret = (process.env.PROD_TEST_SEED_SECRET || '').trim();
  // NOTE: Some production CDNs/WAFs may strip headers containing the word "secret".
  // Prefer token-style header names, but keep backward compatibility.
  const provided = (req.headers.get('x-qa-seed-token') || req.headers.get('x-test-seed-secret') || '').trim();

  if (isProd) {
    if (!secret || !provided || provided !== secret) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          debug: { hasSecret: !!secret, hasProvided: !!provided, matches: !!secret && !!provided && provided === secret },
        },
        { status: 403 }
      );
    }
  }

  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    if (!email) {
      return NextResponse.json({ success: false, error: 'email is required' }, { status: 400 });
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

