// 🎉 PAYMENT INTENT CREATION API - PURE SQUARE MAGIC! 💰
// REAL MONEY FLOW! NO MOCKS! HARDENED PAYMENT BLISS! ✨

import type { APIRoute } from 'astro';
import { SquarePaymentService } from '../../../implementations/payment/SquarePaymentService';
import { withSecurity } from '../../../middleware/security';

const paymentService = new SquarePaymentService();

export const POST: APIRoute = async (context) => {
  return withSecurity(context, async ({ request }) => {
    try {
      console.log('🚀 PAYMENT INTENT CREATION - Starting with PURE JOY! 💰✨');

      // 🎯 Parse request with EXCITEMENT!
      const body = await request.json();
      const { organizationId, planType, customerEmail, couponCode, billingAddress } = body;

      // 🔍 Validate required fields
      if (!organizationId || !planType || !customerEmail) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Organization ID, plan type, and customer email are required'
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 🎯 Validate plan type
      if (!['standard', 'enterprise'].includes(planType)) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Invalid plan type. Must be "standard" or "enterprise"'
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 💰 Set plan amounts (in cents)
      const planAmounts = {
        standard: 999,    // $9.99
        enterprise: 2999  // $29.99
      };

      const amount = planAmounts[planType as keyof typeof planAmounts];

      // 🎊 Create payment intent with PURE DATABASE POWER!
      const result = await paymentService.createPaymentIntent({
        organizationId,
        planType: planType as 'standard' | 'enterprise',
        amount,
        currency: 'USD',
        customerEmail,
        couponCode,
        billingAddress
      });

      const statusCode = result.success ? 200 : 400;

      if (result.success) {
        console.log(`🎉 PAYMENT INTENT SUCCESS! ID: ${result.paymentIntentId} Amount: $${((result.amount || 0) / 100).toFixed(2)} ✨`);
      } else {
        console.log(`⚠️ Payment intent failed: ${result.message}`);
      }

      return new Response(
        JSON.stringify(result),
        {
          status: statusCode,
          headers: { 'Content-Type': 'application/json' }
        }
      );

    } catch (error) {
      console.error('💔 Payment intent creation failed:', error);

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Payment intent creation failed. Please try again.',
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