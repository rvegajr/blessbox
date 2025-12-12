import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';
import { CouponService } from '@/lib/coupons';
import { isSuperAdminEmail } from '@/lib/auth';

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
    if (!isSuperAdminEmail(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
        description: '', // not stored in CouponService schema
        discountType: c.discountType,
        discountValue: c.discountValue,
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
    if (!isSuperAdminEmail(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const couponService = new CouponService();
    const body = await request.json();
    const {
      code,
      discountType,
      discountValue,
      maxUses,
      maxRedemptions,
      expiresAt,
      applicablePlans,
      isActive,
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
      maxUses: maxRedemptions ?? maxUses,
      expiresAt,
      applicablePlans,
      createdBy: session.user.email
    });

    // Optionally mark inactive
    if (isActive === false) {
      await couponService.updateCoupon(newCoupon.id, { active: false } as any);
    }

    return NextResponse.json({
      success: true,
      coupon: {
        id: newCoupon.id,
        code: newCoupon.code,
        description: '',
        discountType: newCoupon.discountType,
        discountValue: newCoupon.discountValue,
        isActive: !!newCoupon.active,
        expiresAt: newCoupon.expiresAt || null,
        createdAt: newCoupon.createdAt,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Create coupon error:', error);
    return NextResponse.json(
      { error: 'Failed to create coupon' },
      { status: 500 }
    );
  }
}
