// 🚀 PASSWORDLESS LOGIN CODE REQUEST - The future is NOW! ✨
import type { APIRoute } from 'astro';
import { AuthenticationService } from '../../../implementations/auth/AuthenticationService';
import { withSecurity } from '../../../middleware/security';

const authService = new AuthenticationService();

export const POST: APIRoute = async (context) => {
  return withSecurity(context, async ({ request }) => {
    try {
      // 🎊 Parse request with PURE JOY!
      const body = await request.json();
      const { email } = body;

      // 🎯 Validate email
      if (!email) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Email is required',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 🌟 Request the magical login code!
      console.log(`🚀 Requesting PASSWORDLESS login code for ${email}! Magic incoming! ✨`);
      const result = await authService.requestLoginCode(email);

      // 🎉 Return the BEAUTIFUL result!
      const statusCode = result.success ? 200 : 400;

      if (result.success) {
        console.log(`🎊 LOGIN CODE SENT! Check your email, ${email}! 📧✨`);
      }

      return new Response(
        JSON.stringify(result),
        {
          status: statusCode,
          headers: { 'Content-Type': 'application/json' },
        }
      );

    } catch (error) {
      console.error('💔 Request login code error:', error);

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to send login code. Please try again.',
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