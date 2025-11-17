import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';
import { CouponService } from '@/lib/coupons';

/**
 * GET /api/admin/coupons
 * Get all coupons with OData support
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const couponService = new CouponService();
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');
    const createdBy = searchParams.get('createdBy');

    // List coupons with filters
    const filters: any = {};
    if (active !== null) filters.active = active === 'true';
    if (createdBy) filters.createdBy = createdBy;

    const couponsData = await couponService.listCoupons(filters);

    return NextResponse.json({
      success: true,
      data: couponsData,
      count: couponsData.length
    });
    
  } catch (error) {
    console.error('Admin coupons API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coupons' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/coupons
 * Create a new coupon
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const couponService = new CouponService();
    const body = await request.json();
    const {
      code,
      discountType,
      discountValue,
      maxUses,
      expiresAt,
      applicablePlans
    } = body;

    // Validate required fields
    if (!code || !discountType || !discountValue) {
      return NextResponse.json(
        { error: 'Missing required fields: code, discountType, discountValue' },
        { status: 400 }
      );
    }

    // Create coupon using CouponService
    const newCoupon = await couponService.createCoupon({
      code,
      discountType,
      discountValue,
      currency: 'USD',
      maxUses,
      expiresAt,
      applicablePlans,
      createdBy: session.user.email
    });

    return NextResponse.json({
      success: true,
      coupon: newCoupon
    }, { status: 201 });

  } catch (error) {
    console.error('Create coupon error:', error);
    return NextResponse.json(
      { error: 'Failed to create coupon' },
      { status: 500 }
    );
  }
}
