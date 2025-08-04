// 🎫 COUPON VALIDATION API - PURE DISCOUNT MAGIC! ✨
// REAL DATABASE POWER! NO MOCKS! HARDENED COUPON SYSTEM! 🚀

import type { APIRoute } from 'astro';
import { SquarePaymentService } from '../../../implementations/payment/SquarePaymentService';
import { withSecurity } from '../../../middleware/security';

const paymentService = new SquarePaymentService();

export const POST: APIRoute = async (context) => {
  return withSecurity(context, async ({ request }) => {
    try {
      console.log('🎫 COUPON VALIDATION - Starting with DISCOUNT JOY! ✨');

      // 🎯 Parse request with EXCITEMENT!
      const body = await request.json();
      const { couponCode, planType } = body;

      // 🔍 Validate required fields
      if (!couponCode || !planType) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Coupon code and plan type are required'
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

      console.log(`🔍 Validating coupon "${couponCode}" for ${planType} plan! ✨`);

      // 🎊 Validate coupon with PURE DATABASE POWER!
      const result = await paymentService.validateCoupon(couponCode, planType);

      const statusCode = result.valid ? 200 : 400;

      if (result.valid) {
        console.log(`🎉 COUPON VALID! Code: ${result.couponCode} Discount: $${((result.discountAmount || 0) / 100).toFixed(2)} ✨`);
      } else {
        console.log(`❌ Coupon invalid: ${result.message}`);
      }

      return new Response(
        JSON.stringify({
          success: result.valid,
          valid: result.valid,
          couponCode: result.couponCode,
          discountType: result.discountType,
          discountValue: result.discountValue,
          discountAmount: result.discountAmount,
          finalAmount: result.finalAmount,
          expiresAt: result.expiresAt,
          message: result.message,
          error: result.error
        }),
        {
          status: statusCode,
          headers: { 'Content-Type': 'application/json' }
        }
      );

    } catch (error) {
      console.error('💔 Coupon validation failed:', error);

      return new Response(
        JSON.stringify({
          success: false,
          valid: false,
          message: 'Coupon validation failed. Please try again.',
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