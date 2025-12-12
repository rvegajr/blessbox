import { NextRequest, NextResponse } from 'next/server';

/**
 * Local-only helper to set a deterministic "test auth" cookie.
 * Intended for Playwright and local QA.
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ success: false, error: 'Not available in production' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const email: string = typeof body.email === 'string' && body.email ? body.email : 'seed-local@example.com';
  const orgId: string | undefined = typeof body.organizationId === 'string' ? body.organizationId : undefined;
  const admin = body.admin === true || body.admin === 'true';

  const res = NextResponse.json({ success: true });

  // Not HttpOnly so browser tests can set/clear easily
  res.cookies.set('bb_test_auth', '1', { path: '/', sameSite: 'lax' });
  res.cookies.set('bb_test_email', email, { path: '/', sameSite: 'lax' });
  if (orgId) res.cookies.set('bb_test_org_id', orgId, { path: '/', sameSite: 'lax' });
  if (admin) res.cookies.set('bb_test_admin', '1', { path: '/', sameSite: 'lax' });
  return res;
}

export async function DELETE() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ success: false, error: 'Not available in production' }, { status: 404 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set('bb_test_auth', '', { path: '/', maxAge: 0 });
  res.cookies.set('bb_test_email', '', { path: '/', maxAge: 0 });
  res.cookies.set('bb_test_org_id', '', { path: '/', maxAge: 0 });
  res.cookies.set('bb_test_admin', '', { path: '/', maxAge: 0 });
  return res;
}

