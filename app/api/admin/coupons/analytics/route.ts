import { NextResponse } from 'next/server';
import { withSuperAdmin } from '@/lib/api/withAuth';
import { CouponService } from '@/lib/coupons';

/**
 * GET /api/admin/coupons/analytics
 * Get coupon analytics and statistics
 */
export const GET = withSuperAdmin(async (request) => {
  try {
    const couponService = new CouponService();
    const { searchParams } = new URL(request.url);
    const couponId = searchParams.get('couponId');

    // Get analytics using CouponService
    const analytics = await couponService.getCouponAnalytics(couponId || undefined);

    return NextResponse.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('Coupon analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coupon analytics' },
      { status: 500 }
    );
  }
});
