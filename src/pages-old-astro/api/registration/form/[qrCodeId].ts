// 🚀 REGISTRATION FORM RETRIEVAL - DYNAMIC QR CODE MAGIC! ✨
// PURE DATABASE POWER! NO MOCKS! HARDENED BACKEND BLISS! 💪

import type { APIRoute } from 'astro';
import { RegistrationFormService } from '../../../../implementations/registration/RegistrationFormService';
import { withSecurity } from '../../../../middleware/security';

const registrationService = new RegistrationFormService();

export const GET: APIRoute = async (context) => {
  return withSecurity(context, async ({ params, url }) => {
    try {
      console.log('🎯 GETTING REGISTRATION FORM - Pure database magic incoming! ✨');

      // 🎊 Extract QR code ID from URL with JOY!
      const qrCodeId = params.qrCodeId as string;
      
      if (!qrCodeId) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'QR code ID is required'
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 🌟 Get entry point from query params
      const entryPoint = url.searchParams.get('entryPoint') || undefined;

      console.log(`🔍 Looking for QR code: ${qrCodeId}${entryPoint ? ` at entry: ${entryPoint}` : ''}`);

      // 🎉 Retrieve form with PURE DATABASE POWER!
      const registrationForm = await registrationService.getRegistrationByQRCode(qrCodeId, entryPoint);

      if (!registrationForm) {
        console.log(`❌ QR code not found: ${qrCodeId}`);
        return new Response(
          JSON.stringify({
            success: false,
            message: 'QR code not found. Please scan a valid QR code! 🔍'
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      console.log(`🎊 REGISTRATION FORM FOUND! Organization: ${registrationForm.organizationName} - PURE SUCCESS! ✨`);

      return new Response(
        JSON.stringify({
          success: true,
          form: registrationForm,
          message: 'Registration form loaded successfully! 🎉'
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );

    } catch (error) {
      console.error('💔 Get registration form failed:', error);

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to load registration form. Please try again.',
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