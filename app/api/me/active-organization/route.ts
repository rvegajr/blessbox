import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
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

  const res = NextResponse.json({ success: true, organizationId });
  const isProd = process.env.NODE_ENV === 'production';
  res.cookies.set('bb_active_org_id', organizationId, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}

