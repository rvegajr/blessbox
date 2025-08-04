// 🎉 JOYFUL LOGIN ENDPOINT - Now with REAL database magic! ✨
import type { APIRoute } from 'astro';
import { AuthenticationService } from '../../../implementations/auth/AuthenticationService';
import { withSecurity } from '../../../middleware/security';

const authService = new AuthenticationService();

export const POST: APIRoute = async (context) => {
  return withSecurity(context, async ({ request }) => {
    try {
      // 🎊 Parse request body with JOY!
      const body = await request.json();
      const { email, password, loginCode } = body;

      // 🎯 Validate required fields
      if (!email) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Email is required',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      let result;

      // 🌟 PASSWORDLESS LOGIN - The future is here!
      if (loginCode) {
        console.log(`🚀 Attempting PASSWORDLESS login for ${email}! Pure magic! ✨`);
        result = await authService.verifyLoginCode(email, loginCode);
      }
      // 🔑 TRADITIONAL PASSWORD LOGIN
      else if (password) {
        console.log(`💪 Attempting PASSWORD login for ${email}! Traditional power!`);
        result = await authService.loginWithPassword(email, password);
      }
      // 😅 Missing both options
      else {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Either password or login code is required',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 🎉 Return the BEAUTIFUL result!
      const statusCode = result.success ? 200 : 401;
      
      if (result.success) {
        console.log(`🎊 LOGIN SUCCESS! Welcome back, ${email}! 🌟`);
      }

      return new Response(
        JSON.stringify(result),
        {
          status: statusCode,
          headers: { 'Content-Type': 'application/json' },
        }
      );

    } catch (error) {
      console.error('💔 Login endpoint error:', error);

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Login failed. Please try again.',
          details: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  });
};