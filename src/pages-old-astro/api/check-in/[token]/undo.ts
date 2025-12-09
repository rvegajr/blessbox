// ↩️ CHECK-IN UNDO API - FOR WHEN MISTAKES HAPPEN! 🔄
// Organization workers can undo check-ins if they made a mistake! 🤝

import type { APIRoute } from 'astro';
import { RegistrationCheckInService } from '../../../../implementations/checkin/RegistrationCheckInService';
import { withSecurity } from '../../../../middleware/security';

const checkInService = new RegistrationCheckInService();

export const POST: APIRoute = async (context) => {
  return withSecurity(context, async ({ request, params }) => {
    try {
      console.log('↩️ CHECK-IN UNDO - Starting with CAREFUL PRECISION! 🎯');

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

      console.log(`🔄 Processing undo for token: ${token}`);

      // 🌟 THE CAREFUL UNDO OPERATION! ↩️
      const success = await checkInService.undoCheckIn(token);

      if (success) {
        console.log(`✅ UNDO SUCCESS! Token: ${token} - Ready for re-check-in! 🎊`);
        
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Check-in has been successfully undone. The person can now be checked in again.'
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      } else {
        console.log(`⚠️ Undo failed for token: ${token}`);
        
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Unable to undo check-in. The token may be invalid or the person was never checked in.'
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

    } catch (error) {
      console.error('💔 Check-in undo failed:', error);

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Undo failed due to system error. Please try again.',
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