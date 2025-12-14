import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';
import { resolveOrganizationForSession } from '@/lib/subscriptions';
import { getPlanUpgrade } from '@/lib/services/PlanUpgrade';
import type { PlanType } from '@/lib/subscriptions';

const VALID_PLANS: PlanType[] = ['free', 'standard', 'enterprise'];

/**
 * GET /api/subscription/upgrade?plan=standard
 * 
 * Preview an upgrade to the specified plan.
 * Returns pricing, limit changes, and summary.
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get target plan from query params
    const searchParams = request.nextUrl.searchParams;
    const targetPlan = searchParams.get('plan') as PlanType | null;

    if (!targetPlan || !VALID_PLANS.includes(targetPlan)) {
      return NextResponse.json(
        { success: false, error: 'Valid plan parameter required (standard or enterprise)' },
        { status: 400 }
      );
    }

    // Resolve organization from session
    const organization = await resolveOrganizationForSession(session);
    
    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'No organization found' },
        { status: 404 }
      );
    }

    // Get upgrade preview
    const planUpgrade = getPlanUpgrade();
    const preview = await planUpgrade.previewUpgrade(organization.id, targetPlan);

    return NextResponse.json({
      success: true,
      data: preview
    });
  } catch (error) {
    console.error('Upgrade preview error:', error);
    
    // Return user-friendly error for validation failures
    if (error instanceof Error && (error.message.includes('already on') || error.message.includes('Cannot downgrade'))) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to preview upgrade' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/subscription/upgrade
 * 
 * Execute an upgrade to the specified plan.
 * Body: { plan: 'standard' | 'enterprise' }
 * 
 * Note: In production, this would be called AFTER payment is confirmed.
 * For now, it directly upgrades (suitable for FREE100 coupon testing).
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const targetPlan = body.plan as PlanType | undefined;

    if (!targetPlan || !VALID_PLANS.includes(targetPlan)) {
      return NextResponse.json(
        { success: false, error: 'Valid plan required (standard or enterprise)' },
        { status: 400 }
      );
    }

    // Can't "upgrade" to free
    if (targetPlan === 'free') {
      return NextResponse.json(
        { success: false, error: 'Cannot upgrade to free plan. Use cancellation instead.' },
        { status: 400 }
      );
    }

    // Resolve organization from session
    const organization = await resolveOrganizationForSession(session);
    
    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'No organization found' },
        { status: 404 }
      );
    }

    // Execute upgrade
    const planUpgrade = getPlanUpgrade();
    const result = await planUpgrade.executeUpgrade(organization.id, targetPlan);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        message: result.message,
        newPlanType: result.newPlanType,
        newLimit: result.newLimit
      }
    });
  } catch (error) {
    console.error('Upgrade execution error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to execute upgrade' },
      { status: 500 }
    );
  }
}
