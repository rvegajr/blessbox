// 📊 CHECK-IN STATUS API - REAL-TIME STATUS CHECKING! ⚡
// Get the current status of any check-in token! 🔍

import type { APIRoute } from 'astro';
import { RegistrationCheckInService } from '../../../../implementations/checkin/RegistrationCheckInService';
import { withSecurity } from '../../../../middleware/security';

const checkInService = new RegistrationCheckInService();

export const GET: APIRoute = async (context) => {
  return withSecurity(context, async ({ params }) => {
    try {
      console.log('📊 CHECK-IN STATUS CHECK - Real-time monitoring! ⚡');

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

      console.log(`🔍 Checking status for token: ${token}`);

      // 🌟 GET THE CURRENT STATUS! 📊
      const status = await checkInService.getCheckInStatus(token);

      console.log(`📈 Status retrieved: ${status.isCheckedIn ? 'CHECKED IN' : 'NOT CHECKED IN'}`);
      
      if (status.isCheckedIn) {
        console.log(`⏰ Checked in at: ${status.checkedInAt}`);
        console.log(`👤 Checked in by: ${status.checkedInBy}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          status,
          message: status.isCheckedIn 
            ? 'Registration is checked in' 
            : 'Registration is ready for check-in'
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );

    } catch (error) {
      console.error('💔 Status check failed:', error);

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Status check failed due to system error.',
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