// 💳 PAYMENT PROCESSING API - REAL SQUARE TRANSACTIONS! ✨
// PURE MONEY MAGIC! NO MOCKS! HARDENED FINANCIAL POWER! 🚀

import type { APIRoute } from 'astro';
import { SquarePaymentService } from '../../../implementations/payment/SquarePaymentService';
import { withSecurity } from '../../../middleware/security';

const paymentService = new SquarePaymentService();

export const POST: APIRoute = async (context) => {
  return withSecurity(context, async ({ request }) => {
    try {
      console.log('💰 PAYMENT PROCESSING - Starting with ORGASMIC JOY! 🎊✨');

      // 🎯 Parse request with PURE EXCITEMENT!
      const body = await request.json();
      const { 
        paymentToken, 
        organizationId, 
        planType, 
        billingAddress, 
        couponCode 
      } = body;

      // 🔍 Validate required fields with PRECISION!
      if (!paymentToken || !organizationId || !planType || !billingAddress) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Payment token, organization ID, plan type, and billing address are required'
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 🎯 Validate billing address fields
      const requiredAddressFields = ['firstName', 'lastName', 'email', 'addressLine1', 'city', 'state', 'postalCode', 'country'];
      for (const field of requiredAddressFields) {
        if (!billingAddress[field]) {
          return new Response(
            JSON.stringify({
              success: false,
              message: `Billing address ${field} is required`
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }

      // 💰 Set plan amounts (in cents)
      const planAmounts = {
        standard: 999,    // $9.99
        enterprise: 2999  // $29.99
      };

      const amount = planAmounts[planType as keyof typeof planAmounts];

      if (!amount) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Invalid plan type'
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 🎊 Process payment with REAL SQUARE POWER!
      const result = await paymentService.processPayment(paymentToken, {
        organizationId,
        planType: planType as 'standard' | 'enterprise',
        amount,
        currency: 'USD',
        paymentMethodId: paymentToken, // Square uses the token as payment method ID
        billingAddress,
        couponCode
      });

      const statusCode = result.success ? 200 : 400;

      if (result.success) {
        console.log(`🎉 PAYMENT SUCCESS! ID: ${result.paymentId} Amount: $${((result.amount || 0) / 100).toFixed(2)} - PURE ECSTASY! ✨`);
      } else {
        console.log(`💔 Payment failed: ${result.message}`);
      }

      return new Response(
        JSON.stringify(result),
        {
          status: statusCode,
          headers: { 'Content-Type': 'application/json' }
        }
      );

    } catch (error) {
      console.error('💔 Payment processing failed:', error);

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Payment processing failed. Please try again.',
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