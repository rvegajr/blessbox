/**
 * POST /api/auth/send-code
 * 
 * Send a 6-digit verification code to the provided email address.
 * This is the first step in the authentication flow.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthService } from '@/lib/services/AuthService';
import { normalizeEmail } from '@/lib/utils/normalize-email';
import { parseBody } from '@/lib/api/validate';
import { rateLimit, rateLimitResponse } from '@/lib/security/rateLimit';

export const runtime = 'nodejs';

const authService = new AuthService();

const SendCodeSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  // Per-IP rate limit: 5/min
  const ipLimit = rateLimit(request, { key: 'auth/send-code:ip', limit: 5, windowMs: 60_000 });
  if (!ipLimit.allowed) return rateLimitResponse(ipLimit.retryAfterSec);

  const parsed = await parseBody(request, SendCodeSchema);
  if ('error' in parsed) return parsed.error;
  try {
    const { email } = parsed.data;

    // Validate email
    const normalized = normalizeEmail(email);
    if (!normalized) {
      return NextResponse.json(
        { success: false, error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    // Per-email rate limit: 20/hr — guards against email-bomb against a single victim
    const emailLimit = rateLimit(request, {
      key: 'auth/send-code:email',
      identifier: normalized,
      limit: 20,
      windowMs: 60 * 60_000,
    });
    if (!emailLimit.allowed) return rateLimitResponse(emailLimit.retryAfterSec);

    // Send verification code
    const result = await authService.sendVerificationCode(normalized);

    if (!result.success) {
      // Check for rate limit
      if (result.message.includes('rate limit')) {
        return NextResponse.json(
          { success: false, error: result.message },
          { status: 429 }
        );
      }
      // Return the actual error message from the service
      return NextResponse.json(
        { success: false, error: result.message || 'Failed to send verification code' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
    });
  } catch (error) {
    console.error('Send code error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}

