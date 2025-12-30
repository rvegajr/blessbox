/**
 * POST /api/auth/verify-code
 * 
 * Verify the 6-digit code and create a session.
 * This is the second step in the authentication flow.
 * 
 * Request body:
 *   - email: string (required)
 *   - code: string (required, 6 digits)
 *   - organizationId: string (optional, for onboarding flow)
 * 
 * Response:
 *   - success: boolean
 *   - user: { id, email, name, organizationId }
 *   - error: string (if failed)
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/AuthService';
import { normalizeEmail } from '@/lib/utils/normalize-email';

export const runtime = 'nodejs';

const authService = new AuthService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, organizationId } = body;

    // Validate email
    const normalized = normalizeEmail(email);
    if (!normalized) {
      return NextResponse.json(
        { success: false, error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    // Validate code format
    if (!code || typeof code !== 'string' || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { success: false, error: 'Valid 6-digit code is required' },
        { status: 400 }
      );
    }

    // Verify code and create session
    const result = await authService.verifyCodeAndCreateSession(normalized, code, {
      organizationId: typeof organizationId === 'string' ? organizationId : undefined,
    });

    if (!result.success || !result.session) {
      return NextResponse.json(
        { success: false, error: result.error || 'Verification failed' },
        { status: 400 }
      );
    }

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      user: result.session.user,
      expires: result.session.expires,
    });

    // Set session cookie
    const isProd = process.env.NODE_ENV === 'production';
    const maxAge = Math.floor(
      (new Date(result.session.expires).getTime() - Date.now()) / 1000
    );
    
    response.cookies.set('bb_session', result.session.token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      maxAge,
    });

    // Set active organization cookie if provided
    if (organizationId) {
      response.cookies.set('bb_active_org_id', organizationId, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: isProd,
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }

    return response;
  } catch (error) {
    console.error('Verify code error:', error);
    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}

