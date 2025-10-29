// Coupon validation endpoint - ISP compliant
import { NextRequest } from 'next/server';
import { CouponService } from '@/lib/coupons';

const couponService = new CouponService();

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    
    if (!code) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Coupon code required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await couponService.validateCoupon(code);
    
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Coupon validation error:', error);
    return new Response(
      JSON.stringify({ valid: false, error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

