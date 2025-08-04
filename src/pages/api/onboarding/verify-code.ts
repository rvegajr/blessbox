import type { APIRoute } from 'astro';
import { validationService } from '../../../implementations/services/ValidationService.js';
import { verifyCode } from '../../../utils/verification-storage.js';
import { isValidVerificationCode } from '../../../utils/email.js';

// Simple JWT-like token generation (we'll upgrade this later)
const generateVerificationToken = (email: string): string => {
  const payload = {
    email,
    verified: true,
    timestamp: Date.now(),
  };
  // In production, use proper JWT with secret key
  return Buffer.from(JSON.stringify(payload)).toString('base64');
};

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    const body = await request.json();
    const { email, code } = body;

    // Validate required fields
    if (!email || !code) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email and verification code are required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate email format
    if (!validationService.validateEmail(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: validationService.getErrorMessage('email', 'format'),
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate code format
    if (!isValidVerificationCode(code)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid code format. Please enter a 6-digit code.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify the code
    const verificationResult = verifyCode(email, code);

    if (!verificationResult.success) {
      const status = verificationResult.error?.includes('expired') ? 410 : 400;
      return new Response(
        JSON.stringify({
          success: false,
          error: verificationResult.error,
        }),
        {
          status,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate verification token
    const token = generateVerificationToken(email);

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email verified successfully',
        token,
        email,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Verify code error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};