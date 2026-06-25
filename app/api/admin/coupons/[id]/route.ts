import { NextResponse } from 'next/server';
import { withSuperAdmin } from '@/lib/api/withAuth';
import { CouponService } from '@/lib/coupons';

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/coupons/[id]
 * Get a specific coupon with detailed statistics
 */
export const GET = withSuperAdmin(async (request, _auth, context) => {
  const params = await (context as Ctx).params;
  try {
    const couponService = new CouponService();
    const couponId = params.id;

    // Get coupon details
    const coupon = await couponService.getCoupon(couponId);
    
    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    // Get analytics for this coupon
    const analytics = await couponService.getCouponAnalytics(couponId);

    return NextResponse.json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: '',
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        isActive: !!coupon.active,
        expiresAt: coupon.expiresAt || null,
        createdAt: coupon.createdAt,
        maxRedemptions: coupon.maxUses ?? null,
      },
      analytics
    });

  } catch (error) {
    console.error('Get coupon details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coupon details' },
      { status: 500 }
    );
  }
});

/**
 * PUT /api/admin/coupons/[id]
 * Update a specific coupon
 */
export const PUT = withSuperAdmin(async (request, _auth, context) => {
  const params = await (context as Ctx).params;
  try {
    const couponService = new CouponService();
    const body = await request.json();

    // Update coupon using CouponService
    const updatePayload: any = { ...body };
    if (body.maxRedemptions !== undefined && body.maxUses === undefined) {
      updatePayload.maxUses = body.maxRedemptions;
    }
    if (body.isActive !== undefined && body.active === undefined) {
      updatePayload.active = !!body.isActive;
    }
    const updatedCoupon = await couponService.updateCoupon(params.id, updatePayload);

    return NextResponse.json({
      success: true,
      coupon: {
        id: updatedCoupon.id,
        code: updatedCoupon.code,
        description: '',
        discountType: updatedCoupon.discountType,
        discountValue: updatedCoupon.discountValue,
        isActive: !!updatedCoupon.active,
        expiresAt: updatedCoupon.expiresAt || null,
        createdAt: updatedCoupon.createdAt,
        maxRedemptions: updatedCoupon.maxUses ?? null,
      }
    });

  } catch (error) {
    console.error('Update coupon error:', error);
    return NextResponse.json(
      { error: 'Failed to update coupon' },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/admin/coupons/[id]
 * Delete a specific coupon
 */
export const DELETE = withSuperAdmin(async (request, _auth, context) => {
  const params = await (context as Ctx).params;
  try {
    const couponService = new CouponService();

    // Deactivate coupon (safer than deletion)
    await couponService.deactivateCoupon(params.id);

    return NextResponse.json({
      success: true,
      message: 'Coupon deactivated successfully'
    });

  } catch (error) {
    console.error('Delete coupon error:', error);
    return NextResponse.json(
      { error: 'Failed to delete coupon' },
      { status: 500 }
    );
  }
});
