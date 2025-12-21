import { NextRequest } from 'next/server';

// DEPRECATED: This endpoint violates ISP - use /api/coupons/validate instead
// Keeping for backward compatibility during migration

const COUPONS: Record<string, { percentOff?: number; amountOffCents?: number }> = {
  SAVE10: { percentOff: 10 },
  WELCOME25: { percentOff: 25 },
  NGO50: { percentOff: 50 },
  FIXED500: { amountOffCents: 500 },
};

export async function POST(req: NextRequest) {
  console.warn('DEPRECATED: /api/payment/validate-coupon is deprecated. Use /api/coupons/validate instead.');
  
  const { code = '' } = await req.json().catch(() => ({}));
  const key = String(code || '').toUpperCase().trim();
  const coupon = COUPONS[key];
  if (!coupon) {
    return new Response(JSON.stringify({ valid: false }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  return new Response(JSON.stringify({ valid: true, coupon }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
