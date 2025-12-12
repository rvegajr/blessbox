import { NextRequest } from 'next/server';
import { CouponService } from '@/lib/coupons';

const couponService = new CouponService();

// POST /api/coupons/apply - Compute discounted amount (in cents) for a plan + coupon
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const code = String(body.code || '').trim();
    const planType = String(body.planType || '').trim().toLowerCase();
    const amountCents = Number(body.amountCents);

    if (!code) {
      return new Response(JSON.stringify({ success: false, valid: false, error: 'Coupon code required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!Number.isFinite(amountCents)) {
      return new Response(JSON.stringify({ success: false, valid: false, error: 'amountCents required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!planType) {
      return new Response(JSON.stringify({ success: false, valid: false, error: 'planType required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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

