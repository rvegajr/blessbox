import { NextResponse } from 'next/server';
import { withSuperAdmin } from '@/lib/api/withAuth';
import { CouponService } from '@/lib/coupons';
import { createCouponSchema } from '@/lib/validation/coupon.schema';
import { ZodError } from 'zod';

/**
 * GET /api/admin/coupons
 * Get all coupons with OData support
 */
export const GET = withSuperAdmin(async (request) => {
  try {
    const couponService = new CouponService();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('$search') || '';
    const filter = searchParams.get('$filter') || '';
    const orderby = searchParams.get('$orderby') || 'createdAt desc';
    const top = parseInt(searchParams.get('$top') || '10', 10);
    const skip = parseInt(searchParams.get('$skip') || '0', 10);
    const includeCount = (searchParams.get('$count') || '').toLowerCase() === 'true';

    // Pull all coupons then apply light filtering/sorting/pagination in-memory (fast for admin use).
    const couponsData = await couponService.listCoupons();

    // Map CouponService -> UI shape
    let mapped = couponsData.map((c: any) => {
      const maxUses = c.maxUses ?? null;
      const currentUses = c.currentUses ?? 0;
      const usagePercentage =
        maxUses && maxUses > 0 ? Math.round((currentUses / maxUses) * 1000) / 10 : null; // 1 decimal
      return {
        id: c.id,
        code: c.code,
        description: c.description || '',
        discountType: c.discountType,
        discountValue: c.discountValue,
        minAmount: c.minAmount ?? null,
        maxDiscount: c.maxDiscount ?? null,
        isActive: !!c.active,
        expiresAt: c.expiresAt || null,
        createdAt: c.createdAt,
        redemptionCount: currentUses,
        usagePercentage,
      };
    });

    // $search
    if (search) {
      const q = search.toLowerCase();
      mapped = mapped.filter((c) => c.code.toLowerCase().includes(q));
    }

    // $filter (supports "isActive eq true/false")
    const m = filter.match(/isActive\s+eq\s+(true|false)/i);
    if (m) {
      const val = m[1].toLowerCase() === 'true';
      mapped = mapped.filter((c) => c.isActive === val);
    }

    // $orderby (supports code/createdAt)
    const [fieldRaw, dirRaw] = orderby.split(/\s+/);
    const field = fieldRaw || 'createdAt';
    const dir = (dirRaw || 'desc').toLowerCase();
    mapped.sort((a: any, b: any) => {
      const av = a[field];
      const bv = b[field];
      if (av === bv) return 0;
      const cmp = av > bv ? 1 : -1;
      return dir === 'asc' ? cmp : -cmp;
    });

    const totalCount = mapped.length;
    const paged = mapped.slice(skip, skip + (Number.isFinite(top) ? top : 10));

    return NextResponse.json({
      success: true,
      data: paged,
      count: includeCount ? totalCount : paged.length,
      totalCount,
    });
    
  } catch (error) {
    console.error('Admin coupons API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coupons' },
      { status: 500 }
    );
  }
});

/**
 * POST /api/admin/coupons
 * Create a new coupon with Zod validation
 */
export const POST = withSuperAdmin(async (request, { session }) => {
  try {
    const couponService = new CouponService();
    const body = await request.json();

    // Validate with Zod schema
    const validatedData = createCouponSchema.parse(body);

    // Create coupon using CouponService
    const newCoupon = await couponService.createCoupon({
      code: validatedData.code,
      description: validatedData.description,
      discountType: validatedData.discountType,
      discountValue: validatedData.discountValue,
      currency: 'USD',
      minAmount: validatedData.minAmount,
      maxDiscount: validatedData.maxDiscount,
      maxUses: validatedData.maxRedemptions,
      expiresAt: validatedData.expiresAt || undefined,
      applicablePlans: validatedData.applicablePlans || undefined,
      createdBy: session.user.email
    });

    // Optionally mark inactive
    if (validatedData.isActive === false) {
      await couponService.updateCoupon(newCoupon.id, { active: false });
    }

    return NextResponse.json({
      success: true,
      coupon: {
        id: newCoupon.id,
        code: newCoupon.code,
        description: newCoupon.description || '',
        discountType: newCoupon.discountType,
        discountValue: newCoupon.discountValue,
        minAmount: newCoupon.minAmount ?? null,
        maxDiscount: newCoupon.maxDiscount ?? null,
        isActive: !!newCoupon.active,
        expiresAt: newCoupon.expiresAt || null,
        createdAt: newCoupon.createdAt,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Create coupon error:', error);

    // Surface Zod validation errors
    if (error instanceof ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.errors.map(e => ({
          path: e.path,
          message: e.message
        }))
      }, { status: 400 });
    }

    // Surface database constraint errors (e.g., duplicate code)
    if (error instanceof Error) {
      if (error.message.includes('UNIQUE constraint failed') || 
          error.message.includes('already exists')) {
        return NextResponse.json({
          error: 'Coupon code already exists',
          code: 'DUPLICATE_CODE'
        }, { status: 409 });
      }

      if (error.message.includes('CHECK constraint failed')) {
        return NextResponse.json({
          error: 'Invalid coupon data: ' + error.message,
          code: 'VALIDATION_ERROR'
        }, { status: 400 });
      }

      // Surface other known errors
      return NextResponse.json({
        error: error.message,
        code: 'SERVER_ERROR'
      }, { status: 500 });
    }

    // Generic fallback
    return NextResponse.json({
      error: 'Failed to create coupon',
      code: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
});
