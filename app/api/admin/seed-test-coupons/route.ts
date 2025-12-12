import { NextRequest, NextResponse } from 'next/server';
import { CouponService } from '@/lib/coupons';
import { getDbClient } from '@/lib/db';
import { ensureDbReady } from '@/lib/db-ready';

/**
 * POST /api/admin/seed-test-coupons
 *
 * Production-safe seeding for QA guide coupon codes.
 * - In production: requires header `x-seed-secret` matching env `SEED_TEST_COUPONS_SECRET`
 * - In non-production: allowed without secret (useful for local/dev recovery)
 */
export async function POST(req: NextRequest) {
  const isProd = process.env.NODE_ENV === 'production';
  const secret = process.env.SEED_TEST_COUPONS_SECRET || '';
  const provided = req.headers.get('x-seed-secret') || '';

  if (isProd) {
    if (!secret || !provided || provided !== secret) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
  }

  try {
    await ensureDbReady();
    const couponService = new CouponService();
    await couponService.ensureSchema();

    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const ensure = async (spec: {
      code: string;
      discountType: 'percentage' | 'fixed';
      discountValue: number;
      maxUses?: number | null;
      expiresAt?: string | null;
      applicablePlans?: string[] | null;
    }) => {
      try {
        await couponService.createCoupon({
          code: spec.code,
          discountType: spec.discountType,
          discountValue: spec.discountValue,
          currency: 'USD',
          maxUses: spec.maxUses ?? null,
          expiresAt: spec.expiresAt ?? null,
          applicablePlans: spec.applicablePlans ?? null,
          createdBy: 'seed-test-coupons',
        } as any);
        return { code: spec.code, created: true };
      } catch {
        return { code: spec.code, created: false };
      }
    };

    const results = await Promise.all([
      ensure({ code: 'FREE100', discountType: 'percentage', discountValue: 100, applicablePlans: ['standard', 'enterprise'] }),
      ensure({ code: 'WELCOME50', discountType: 'percentage', discountValue: 50, applicablePlans: ['standard', 'enterprise'] }),
      ensure({ code: 'SAVE20', discountType: 'fixed', discountValue: 2000, applicablePlans: ['standard', 'enterprise'] }),
      ensure({ code: 'FIRST10', discountType: 'fixed', discountValue: 1000, applicablePlans: ['standard', 'enterprise'] }),
      ensure({ code: 'EXPIRED', discountType: 'percentage', discountValue: 10, expiresAt: past, applicablePlans: ['standard', 'enterprise'] }),
      ensure({ code: 'MAXEDOUT', discountType: 'percentage', discountValue: 10, maxUses: 1, applicablePlans: ['standard', 'enterprise'] }),
    ]);

    // Force MAXEDOUT to be exhausted (best-effort)
    const db = getDbClient();
    await db
      .execute({
        sql: `UPDATE coupons SET current_uses = max_uses WHERE code = ? AND max_uses IS NOT NULL`,
        args: ['MAXEDOUT'],
      })
      .catch(() => {});

    return NextResponse.json({
      success: true,
      results,
      note: isProd ? 'Seeded with production secret gate' : 'Seeded in non-production mode',
    });
  } catch (error) {
    console.error('seed-test-coupons error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

