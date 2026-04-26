// Coupon validation endpoint - ISP compliant
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { CouponService } from '@/lib/coupons';
import { parseBody } from '@/lib/api/validate';

const couponService = new CouponService();

const CouponValidateSchema = z.object({
  code: z.string().min(1).max(50),
});

export async function POST(req: NextRequest) {
  const parsed = await parseBody(req, CouponValidateSchema);
  if ('error' in parsed) return parsed.error;
  try {
    const { code } = parsed.data;

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

