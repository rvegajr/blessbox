import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';
import { CouponService } from '@/lib/coupons';
import { isSuperAdminEmail } from '@/lib/auth';

/**
 * GET /api/admin/coupons/analytics
 * Get coupon analytics and statistics
 */
export async function GET(request: NextRequest) {
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
}
