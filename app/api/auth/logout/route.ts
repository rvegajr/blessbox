/**
 * POST /api/auth/logout
 * 
 * Log out the current user by clearing the session cookie.
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(_request: NextRequest) {
  const response = NextResponse.json({ success: true });

  // Clear session cookie
  response.cookies.set('bb_session', '', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 0,
  });

  // Clear active org cookie
  response.cookies.set('bb_active_org_id', '', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 0,
  });

  return response;
}

