import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { ensureDbReady } from '@/lib/db-ready';
import { getDbClient } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { getEnv } from '@/lib/utils/env';
import { rateLimit, rateLimitResponse } from '@/lib/security/rateLimit';
import { decideTestLogin } from '@/lib/auth/testLoginPolicy';

export const runtime = 'nodejs';

/**
 * POST /api/test/login
 *
 * Production-safe passwordless test login endpoint.
 * - In production: requires header `x-test-login-secret` matching env `PROD_TEST_LOGIN_SECRET`
 * - In non-production: allowed without secret (useful for local/dev)
 * - Issues a short-lived `authjs.session-token` cookie (no passwords anywhere)
 *
 * Body:
 *   - email: string (required)
 *   - organizationId?: string (optional)
 *   - admin?: boolean (optional, defaults to false)
 *   - expiresIn?: number (optional, seconds, defaults to 3600 = 1 hour)
 *
 * Returns:
 *   - success: boolean
 *   - email: string
 *   - expiresAt: string (ISO date)
 */
export async function POST(req: NextRequest) {
  // Brute-force / abuse guard — this endpoint can mint a session.
  const ipLimit = rateLimit(req, { key: 'test/login:ip', limit: 5, windowMs: 60_000 });
  if (!ipLimit.allowed) return rateLimitResponse(ipLimit.retryAfterSec);

  const isProd = process.env.NODE_ENV === 'production';
  const secret = getEnv('PROD_TEST_LOGIN_SECRET');
  // NOTE: Some production CDNs/WAFs may strip headers containing the word "secret".
  // Prefer token-style header names, but keep backward compatibility.
  const provided = (req.headers.get('x-qa-login-token') || req.headers.get('x-test-login-secret') || '').trim();

  if (isProd) {
    if (!secret || !provided || provided !== secret) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not found',
        },
        { status: 404 }
      );
    }
  }

  // Match what AuthService.getJwtSecret() reads (NEXTAUTH_SECRET || JWT_SECRET).
  // The session is verified via lib/services/AuthService.validateToken() using
  // jose.jwtVerify(token, secret), so we must sign with the same secret + alg.
  const jwtSecret = getEnv('NEXTAUTH_SECRET') || getEnv('JWT_SECRET');
  if (!jwtSecret) {
    return NextResponse.json({ success: false, error: 'NEXTAUTH_SECRET or JWT_SECRET not configured' }, { status: 500 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const email: string = typeof body.email === 'string' && body.email ? body.email.trim() : '';
    let organizationId: string | undefined = typeof body.organizationId === 'string' ? body.organizationId.trim() : undefined;
    const admin = body.admin === true || body.admin === 'true';
    const expiresInSeconds = typeof body.expiresIn === 'number' && body.expiresIn > 0 ? body.expiresIn : 3600; // Default 1 hour

    if (!email) {
      return NextResponse.json({ success: false, error: 'email is required' }, { status: 400 });
    }

    // Production policy: never mint superadmin/admin, restrict to an allow-list,
    // and cap the session TTL. Pure decision in lib/auth/testLoginPolicy.
    const allowList = (getEnv('QA_TEST_LOGIN_ALLOWED_EMAILS') || '')
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);
    const decision = decideTestLogin({ isProd, email, admin, allowList, requestedTtlSeconds: expiresInSeconds });
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    console.warn('[AUDIT][test-login]', JSON.stringify({ email: email.toLowerCase(), admin, isProd, allowed: decision.allowed, role: decision.role, ip: clientIp }));
    if (!decision.allowed) {
      return NextResponse.json({ success: false, error: decision.error || 'Not permitted' }, { status: 403 });
    }
    const effectiveTtlSeconds = decision.ttlSeconds;

    await ensureDbReady();
    const db = getDbClient();
    const normalizedEmail = email.toLowerCase();
    const now = new Date().toISOString();

    // Ensure a stable user identity for this email (multi-org support)
    const newUserId = uuidv4();
    await db.execute({
      sql: `
        INSERT INTO users (id, email, created_at, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET updated_at = excluded.updated_at
      `,
      args: [newUserId, normalizedEmail, now, now],
    });
    const userRow = await db.execute({ sql: `SELECT id FROM users WHERE email = ? LIMIT 1`, args: [normalizedEmail] });
    const userId = String((userRow.rows?.[0] as any)?.id || newUserId);

    // If an orgId was supplied, ensure membership exists for this user.
    if (organizationId) {
      await db.execute({
        sql: `
          INSERT INTO memberships (id, user_id, organization_id, role, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id, organization_id) DO UPDATE SET updated_at = excluded.updated_at
        `,
        args: [uuidv4(), userId, organizationId, decision.role === 'superadmin' ? 'super_admin' : 'admin', now, now],
      });
    } else {
      // If not supplied, auto-pick only when the user has exactly one org.
      const memberships = await db.execute({
        sql: `SELECT organization_id FROM memberships WHERE user_id = ? ORDER BY created_at DESC`,
        args: [userId],
      });
      if (memberships.rows?.length === 1) {
        organizationId = String((memberships.rows[0] as any).organization_id);
      }
    }

    // Role + TTL come from the policy decision (never superadmin in production).
    const role = decision.role;
    const expiresAt = new Date(Date.now() + effectiveTtlSeconds * 1000);

    // Sign with jose to match how AuthService.validateToken() verifies (jose.jwtVerify).
    // Payload shape mirrors AuthService.createSession (sub, email, name,
    // organizationId, role).
    const sessionToken = await new SignJWT({
      sub: userId,
      email,
      name: admin ? 'Test Admin' : 'Test User',
      role,
      ...(organizationId ? { organizationId } : {}),
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiresAt)
      .sign(new TextEncoder().encode(jwtSecret));

    // Cookie name MUST match SESSION_COOKIE_NAME in lib/services/AuthService.ts
    // (`bb_session`), not the NextAuth-style name we used previously.
    const cookieName = 'bb_session';
    const cookieOptions: any = {
      path: '/',
      httpOnly: true,
      sameSite: 'lax' as const,
      maxAge: effectiveTtlSeconds,
    };
    if (isProd) {
      cookieOptions.secure = true;
    }

    const res = NextResponse.json({
      success: true,
      email,
      expiresAt: expiresAt.toISOString(),
      role,
      ...(organizationId ? { organizationId } : {}),
    });

    res.cookies.set(cookieName, sessionToken, cookieOptions);

    // Also set the active-organization cookie so client-side hooks like
    // useRequireActiveOrganization don't bounce the page back to org selection.
    // This mirrors what the real login flow does once the user picks an org.
    if (organizationId) {
      res.cookies.set('bb_active_org_id', organizationId, {
        path: '/',
        httpOnly: false, // client reads this to know the active org
        sameSite: 'lax' as const,
        maxAge: effectiveTtlSeconds,
        ...(isProd ? { secure: true } : {}),
      });
    }

    return res;
  } catch (error) {
    console.error('test-login error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
