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
 * DISABLED as a self-service mutation path.
 *
 * Subscription tier changes MUST go through `/api/payment/process`, which is
 * the only path that:
 *   - charges the server-authoritative price for the plan
 *   - re-validates coupons server-side
 *   - records a Square payment before mutating the tier
 *
 * Allowing this endpoint to mutate the plan without a verified payment
 * would let any logged-in user self-grant Enterprise for free. We refuse
 * here and direct the caller to the payment endpoint.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Payment required',
        message:
          'Plan upgrades must be completed via /api/payment/process with a verified payment token.',
      },
      { status: 402 }
    );
  } catch (error) {
    console.error('Upgrade execution error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to execute upgrade' },
      { status: 500 }
    );
  }
}
