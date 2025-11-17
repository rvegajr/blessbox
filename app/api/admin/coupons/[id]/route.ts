import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';
import { CouponService } from '@/lib/coupons';

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
      coupon,
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

    const couponService = new CouponService();
    const body = await request.json();

    // Update coupon using CouponService
    const updatedCoupon = await couponService.updateCoupon(params.id, body);

    return NextResponse.json({
      success: true,
      coupon: updatedCoupon
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
