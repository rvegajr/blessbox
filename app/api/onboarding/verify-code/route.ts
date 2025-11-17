import { NextRequest, NextResponse } from 'next/server';
import { VerificationService } from '@/lib/services/VerificationService';

const verificationService = new VerificationService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    // Validate inputs
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, verified: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, verified: false, error: 'Verification code is required' },
        { status: 400 }
      );
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { success: false, verified: false, error: 'Invalid code format. Code must be 6 digits.' },
        { status: 400 }
      );
    }

    // Use VerificationService to verify code
    const result = await verificationService.verifyCode(email, code);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          verified: false,
          error: result.message,
          remainingAttempts: result.remainingAttempts
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: result.verified || false,
      message: result.message,
    });
  } catch (error) {
    console.error('Verify code error:', error);
    return NextResponse.json(
      { 
        success: false, 
        verified: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
