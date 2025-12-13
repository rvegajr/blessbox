import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { isSuperAdminEmail } from '@/lib/auth';
import { ensureDbReady } from '@/lib/db-ready';
import { getDbClient } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

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
  const isProd = process.env.NODE_ENV === 'production';
  const secret = (process.env.PROD_TEST_LOGIN_SECRET || '').trim();
  const provided = (req.headers.get('x-test-login-secret') || '').trim();

  if (isProd) {
    if (!secret || !provided || provided !== secret) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
  }

  if (!process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ success: false, error: 'NEXTAUTH_SECRET not configured' }, { status: 500 });
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
        args: [uuidv4(), userId, organizationId, admin ? 'super_admin' : 'admin', now, now],
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

    // Determine role based on email
    const role = admin || isSuperAdminEmail(email) ? 'superadmin' : 'user';
    // Create JWT token matching NextAuth format
    const tokenPayload: any = {
      email,
      name: admin ? 'Test Admin' : 'Test User',
      id: userId,
      sub: userId, // NextAuth uses 'sub' as the subject
      role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
    };

    // Add organizationId if provided (non-standard field, but used by our app)
    if (organizationId) {
      tokenPayload.organizationId = organizationId;
    }

    const sessionToken = jwt.sign(tokenPayload, process.env.NEXTAUTH_SECRET);

    // Determine cookie name (NextAuth v5 uses authjs.session-token)
    const cookieName = isProd ? '__Secure-authjs.session-token' : 'authjs.session-token';
    const cookieOptions: any = {
      path: '/',
      httpOnly: true,
      sameSite: 'lax' as const,
      maxAge: expiresInSeconds,
    };

    if (isProd) {
      cookieOptions.secure = true; // HTTPS only in production
    }

    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    const res = NextResponse.json({
      success: true,
      email,
      expiresAt,
      role,
      ...(organizationId ? { organizationId } : {}),
    });

    res.cookies.set(cookieName, sessionToken, cookieOptions);

    return res;
  } catch (error) {
    console.error('test-login error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
