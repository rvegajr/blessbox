import { NextRequest, NextResponse } from 'next/server';
import { VerificationService } from '@/lib/services/VerificationService';

const verificationService = new VerificationService();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Use VerificationService to send code
    const result = await verificationService.sendVerificationCode(email);

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
    console.error('Send verification error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
