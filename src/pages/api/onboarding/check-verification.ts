import type { APIRoute } from 'astro';
import { validationService } from '../../../implementations/services/ValidationService.js';
import { hasVerificationCode } from '../../../utils/verification-storage.js';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    const body = await request.json();
    const { email } = body;

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

    // Check if there's a pending verification code
    const hasPending = hasVerificationCode(email);

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        pending: hasPending,
        email,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Check verification error:', error);
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