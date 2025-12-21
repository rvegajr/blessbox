import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';
import { CouponService } from '@/lib/coupons';
import { isSuperAdminEmail } from '@/lib/auth';

/**
 * GET /api/admin/coupons/[id]
 * Get a specific coupon with detailed statistics
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    // Check authentication and admin role
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isSuperAdminEmail(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
}

/**
 * PUT /api/admin/coupons/[id]
 * Update a specific coupon
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    // Check authentication and admin role
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isSuperAdminEmail(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
}

/**
 * DELETE /api/admin/coupons/[id]
 * Delete a specific coupon
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  try {
    // Check authentication and admin role
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isSuperAdminEmail(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
}
