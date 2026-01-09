/**
 * POST /api/auth/send-code
 * 
 * Send a 6-digit verification code to the provided email address.
 * This is the first step in the authentication flow.
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/AuthService';
import { normalizeEmail } from '@/lib/utils/normalize-email';

export const runtime = 'nodejs';

const authService = new AuthService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email
    const normalized = normalizeEmail(email);
    if (!normalized) {
      return NextResponse.json(
        { success: false, error: 'Valid email address is required' },
        { status: 400 }
      );
    }

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

