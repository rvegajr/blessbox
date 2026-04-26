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
import { z } from 'zod';
import { AuthService } from '@/lib/services/AuthService';
import { normalizeEmail } from '@/lib/utils/normalize-email';
import { parseBody } from '@/lib/api/validate';
import { rateLimit, rateLimitResponse } from '@/lib/security/rateLimit';

export const runtime = 'nodejs';

const authService = new AuthService();

const VerifyCodeSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
  organizationId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  // Per-IP rate limit: 10/min — guards OTP brute force
  const ipLimit = rateLimit(request, { key: 'auth/verify-code:ip', limit: 10, windowMs: 60_000 });
  if (!ipLimit.allowed) return rateLimitResponse(ipLimit.retryAfterSec);

  const parsed = await parseBody(request, VerifyCodeSchema);
  if ('error' in parsed) return parsed.error;
  try {
    const { email, code, organizationId } = parsed.data;

    // Normalize email (zod already validated format)
    const normalized = normalizeEmail(email) || email;

    // Verify code and create session
    const result = await authService.verifyCodeAndCreateSession(normalized, code, {
      organizationId,
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

