import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { VerificationService } from '@/lib/services/VerificationService';
import { normalizeEmail } from '@/lib/utils/normalize-email';
import { internalErrorResponse } from '@/lib/api/errorResponse';
import { parseBody } from '@/lib/api/validate';
import { rateLimit, rateLimitResponse } from '@/lib/security/rateLimit';

const verificationService = new VerificationService();

const SendVerificationSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  // Per-IP rate limit: 5/min
  const ipLimit = rateLimit(request, { key: 'onboarding/send-verification:ip', limit: 5, windowMs: 60_000 });
  if (!ipLimit.allowed) return rateLimitResponse(ipLimit.retryAfterSec);

  const parsed = await parseBody(request, SendVerificationSchema);
  if ('error' in parsed) return parsed.error;
  try {
    const { email } = parsed.data;

    // Use VerificationService to send code
    const result = await verificationService.sendVerificationCode(normalizeEmail(email));

    if (!result.success) {
      // Check if it's a rate limit error
      if (result.message.includes('rate limit')) {
        return NextResponse.json(
          { success: false, error: result.message },
          { status: 429 }
        );
      }

      // Other errors (like invalid email)
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      // In development, include the code for testing
      ...(process.env.NODE_ENV === 'development' && result.code ? { code: result.code } : {}),
    });
  } catch (error) {
    return internalErrorResponse(error, 'Send verification');
  }
}
