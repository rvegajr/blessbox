import type { APIRoute } from 'astro';

// Simple email validation
const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

import { verifyAndRemoveCode } from '../../../utils/simple-verification-storage';

// Simple JWT-like token generation
const generateVerificationToken = (email: string): string => {
  const payload = {
    email,
    verified: true,
    timestamp: Date.now(),
  };
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
    if (!validateEmail(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Please enter a valid email address',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate code format
    if (!/^\d{6}$/.test(code)) {
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

    // Verify the code (this also removes it if valid)
    const isValid = verifyAndRemoveCode(email, code);
    
    if (!isValid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid or expired verification code. Please request a new code.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Code is valid! Generate token
    const token = generateVerificationToken(email);

    console.log(`✅ Email verified successfully for ${email}`);

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