import type { APIRoute } from 'astro';

// Simple email validation
const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Simple verification code generation
const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

import { storeVerificationCode } from '../../../utils/simple-verification-storage';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    const body = await request.json();
    const { email, organizationName } = body;

    // Validate required fields
    if (!email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email is required',
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

    // Generate verification code
    const code = generateVerificationCode();

    // Store verification code
    storeVerificationCode(email, code);

    // Log the code for testing
    console.log(`🔐 Verification code for ${email}: ${code}`);

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Verification code generated successfully',
        // Include code in response for testing (remove in production)
        testCode: code,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Send verification error:', error);
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