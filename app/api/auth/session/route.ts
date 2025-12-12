import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

/**
 * Explicit session endpoint to make local test-auth deterministic.
 *
 * NextAuth's catch-all route also supports /api/auth/session, but having this explicit
 * route lets us:
 * - Return a stable test session when `bb_test_auth=1` (local/dev only)
 * - Fall back to JWT decoding for real NextAuth sessions
 */
export async function GET() {
  const cookieStore = await cookies();

  // Local/dev auth bypass for tests
  if (process.env.NODE_ENV !== 'production') {
    const testAuth = cookieStore.get('bb_test_auth')?.value;
    if (testAuth === '1') {
      const email = cookieStore.get('bb_test_email')?.value || 'seed-local@example.com';
      const orgId = cookieStore.get('bb_test_org_id')?.value;
      const isAdmin = cookieStore.get('bb_test_admin')?.value === '1';
      return NextResponse.json({
        user: {
          email,
          name: isAdmin ? 'Test Admin' : 'Test User',
          id: 'test-user',
          ...(orgId ? { organizationId: orgId } : {}),
          ...(isAdmin ? { role: 'super_admin' } : {}),
        },
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
  }

  // Fallback: decode NextAuth JWT from cookie
  const sessionToken =
    cookieStore.get('authjs.session-token')?.value ||
    cookieStore.get('__Secure-authjs.session-token')?.value ||
    cookieStore.get('next-auth.session-token')?.value ||
    cookieStore.get('__Secure-next-auth.session-token')?.value;

  if (!sessionToken || !process.env.NEXTAUTH_SECRET) {
    return NextResponse.json(null);
  }

  try {
    const decoded = jwt.verify(sessionToken, process.env.NEXTAUTH_SECRET) as any;
    if (decoded?.email) {
      return NextResponse.json({
        user: {
          email: decoded.email,
          name: decoded.name || 'User',
          id: decoded.id || decoded.sub || '1',
          image: decoded.image || null,
        },
        expires: decoded.exp
          ? new Date(decoded.exp * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
  } catch {
    // Invalid/expired token -> no session
  }

  return NextResponse.json(null);
}

