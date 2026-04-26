import { NextRequest } from 'next/server';
import { z } from 'zod';
import { CouponService } from '@/lib/coupons';
import { parseBody } from '@/lib/api/validate';

const couponService = new CouponService();

const CouponApplySchema = z.object({
  code: z.string().min(1).max(50),
  planType: z.string().min(1).max(50),
  amountCents: z.number().int().nonnegative(),
});

// POST /api/coupons/apply - Compute discounted amount (in cents) for a plan + coupon
export async function POST(req: NextRequest) {
  const parsed = await parseBody(req, CouponApplySchema);
  if ('error' in parsed) return parsed.error;
  try {
    const code = parsed.data.code.trim();
    const planType = parsed.data.planType.trim().toLowerCase();
    const amountCents = parsed.data.amountCents;

    const discountedAmountCents = await couponService.applyCoupon(code, amountCents, planType);
    const discountAppliedCents = Math.max(0, amountCents - discountedAmountCents);

    return new Response(
      JSON.stringify({
        success: true,
        valid: true,
        code: code.toUpperCase(),
        amountCents,
        discountedAmountCents,
        discountAppliedCents,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ success: false, valid: false, error: message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

