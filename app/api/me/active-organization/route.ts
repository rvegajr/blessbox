import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getServerSession } from '@/lib/auth-helper';
import { ensureDbReady } from '@/lib/db-ready';
import { getDbClient } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  const userId = session?.user?.id;
  const email = session?.user?.email || null;
  if (!userId || !email) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const organizationId = typeof body.organizationId === 'string' ? body.organizationId.trim() : '';
  if (!organizationId) {
    return NextResponse.json({ success: false, error: 'organizationId is required' }, { status: 400 });
  }

  await ensureDbReady();
  const db = getDbClient();

  const membership = await db.execute({
    sql: `SELECT id FROM memberships WHERE user_id = ? AND organization_id = ? LIMIT 1`,
    args: [userId, organizationId],
  });
  if (!membership.rows || membership.rows.length === 0) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const cookieStore = await cookies();

  // Local/dev test-auth bypass support
  if (process.env.NODE_ENV !== 'production') {
    const testAuth = cookieStore.get('bb_test_auth')?.value;
    if (testAuth === '1') {
      const res = NextResponse.json({ success: true, organizationId });
      res.cookies.set('bb_test_org_id', organizationId, { path: '/', sameSite: 'lax' });
      return res;
    }
  }

  if (!process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ success: false, error: 'NEXTAUTH_SECRET not configured' }, { status: 500 });
  }

  const sessionToken =
    cookieStore.get('authjs.session-token')?.value ||
    cookieStore.get('__Secure-authjs.session-token')?.value ||
    cookieStore.get('next-auth.session-token')?.value ||
    cookieStore.get('__Secure-next-auth.session-token')?.value;

  if (!sessionToken) {
    return NextResponse.json({ success: false, error: 'No session token' }, { status: 401 });
  }

  let decoded: any;
  try {
    decoded = jwt.verify(sessionToken, process.env.NEXTAUTH_SECRET) as any;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid session token' }, { status: 401 });
  }

  // Keep the same expiry if present; otherwise default to 1 hour.
  const nowSec = Math.floor(Date.now() / 1000);
  const exp = typeof decoded?.exp === 'number' && decoded.exp > nowSec ? decoded.exp : nowSec + 3600;

  const tokenPayload: any = {
    ...decoded,
    email,
    id: decoded?.id || decoded?.sub || userId,
    sub: decoded?.sub || decoded?.id || userId,
    organizationId,
    iat: decoded?.iat || nowSec,
    exp,
  };

  const newToken = jwt.sign(tokenPayload, process.env.NEXTAUTH_SECRET);
  const isProd = process.env.NODE_ENV === 'production';
  const cookieName = isProd ? '__Secure-authjs.session-token' : 'authjs.session-token';

  const res = NextResponse.json({ success: true, organizationId });
  res.cookies.set(cookieName, newToken, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    maxAge: exp - nowSec,
  });
  return res;
}

