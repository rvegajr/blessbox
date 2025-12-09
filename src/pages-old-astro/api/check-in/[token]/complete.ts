// 🎉 CHECK-IN COMPLETION API - THE MOMENT OF TRUTH! ✨
// This is where the magic happens when QR codes get scanned! 🪄

import type { APIRoute } from 'astro';
import { RegistrationCheckInService } from '../../../../implementations/checkin/RegistrationCheckInService';
import { withSecurity } from '../../../../middleware/security';

const checkInService = new RegistrationCheckInService();

export const POST: APIRoute = async (context) => {
  return withSecurity(context, async ({ request, params }) => {
    try {
      console.log('🎊 CHECK-IN COMPLETION - Starting with PURE JOY! ✨');

      // 🎯 Get token from URL params
      const { token } = params;
      
      if (!token) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Check-in token is required'
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 🎊 Parse request body for worker info
      const body = await request.json().catch(() => ({}));
      const { workerInfo } = body;

      console.log(`🎯 Processing check-in for token: ${token}`);
      console.log(`👤 Worker info: ${workerInfo || 'Unknown'}`);

      // 🌟 THE MAGICAL CHECK-IN MOMENT! ✨
      const result = await checkInService.checkIn(token, workerInfo);

      const statusCode = result.success ? 200 : 400;

      if (result.success) {
        console.log(`🎉 CHECK-IN SUCCESS! Registration: ${result.registration?.id} - PURE ECSTASY! ✨`);
        console.log(`⏰ Checked in at: ${result.checkedInAt}`);
        console.log(`👤 Checked in by: ${result.checkedInBy}`);
      } else {
        console.log(`⚠️ Check-in failed: ${result.message}`);
      }

      return new Response(
        JSON.stringify(result),
        {
          status: statusCode,
          headers: { 'Content-Type': 'application/json' }
        }
      );

    } catch (error) {
      console.error('💔 Check-in completion failed:', error);

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Check-in failed due to system error. Please try again.',
          details: error instanceof Error ? error.message : 'Unknown error'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  });
};