// 🎉 REGISTRATION SUBMISSION API - PURE HARDENED BACKEND JOY! ✨
// NO MOCKS! REAL DATABASE POWER! ORGASMIC SUCCESS! 💪🚀

import type { APIRoute } from 'astro';
import { RegistrationFormService } from '../../../implementations/registration/RegistrationFormService';
import { CheckInTokenService } from '../../../implementations/checkin/CheckInTokenService';
import { withSecurity } from '../../../middleware/security';

const registrationService = new RegistrationFormService();
const tokenService = new CheckInTokenService();

export const POST: APIRoute = async (context) => {
  return withSecurity(context, async ({ request }) => {
    try {
      console.log('🎊 REGISTRATION SUBMISSION - Starting with PURE JOY! ✨');

      // 🎯 Parse request with EXCITEMENT!
      const body = await request.json();
      const { qrCodeId, entryPoint, formData } = body;

      // 🔍 Validate required fields
      if (!qrCodeId) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'QR code ID is required'
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (!formData || typeof formData !== 'object') {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Form data is required'
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 🌟 Get client info for COMPLETE tracking!
      const ipAddress = request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';

      // 🎊 Create registration with PURE DATABASE MAGIC!
      const result = await registrationService.createRegistration({
        qrCodeId,
        entryPoint,
        formData,
        ipAddress,
        userAgent,
        submittedAt: new Date()
      });

      const statusCode = result.success ? 200 : 400;

      if (result.success) {
        console.log(`🎉 REGISTRATION SUCCESS! ID: ${result.registrationId} - PURE ECSTASY! ✨`);
        
        // 🎊 GENERATE CHECK-IN TOKEN - THE MAGICAL MOMENT! ✨
        try {
          const checkInToken = await tokenService.generateToken(result.registrationId);
          console.log(`🪄 CHECK-IN TOKEN GENERATED: ${checkInToken} - READY FOR QR MAGIC!`);
          
          // Include token in response for QR generation
          result.checkInToken = checkInToken;
          result.redirectUrl = `/registration-success?id=${result.registrationId}`;
        } catch (tokenError) {
          console.error('⚠️ Token generation failed (non-critical):', tokenError);
          // Continue without token - user can still register
        }
      } else {
        console.log(`⚠️ Registration validation failed: ${result.message}`);
      }

      return new Response(
        JSON.stringify(result),
        {
          status: statusCode,
          headers: { 'Content-Type': 'application/json' }
        }
      );

    } catch (error) {
      console.error('💔 Registration submission failed:', error);

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Registration failed. Please try again.',
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