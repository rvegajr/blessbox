import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';
import { resolveOrganizationForSession } from '@/lib/subscriptions';
import { getSubscriptionCancel } from '@/lib/services/SubscriptionCancel';
import { CANCEL_REASONS, type CancelReason } from '@/lib/interfaces/ISubscriptionCancel';

/**
 * GET /api/subscription/cancel
 * 
 * Preview subscription cancellation.
 * Returns access end date, data impact warnings.
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

    // Resolve organization from session
    const organization = await resolveOrganizationForSession(session);
    
    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'No organization found' },
        { status: 404 }
      );
    }

    // Check if cancellation is possible
    const subscriptionCancel = getSubscriptionCancel();
    const canCancel = await subscriptionCancel.canCancel(organization.id);
    
    if (!canCancel) {
      return NextResponse.json(
        { success: false, error: 'No active paid subscription to cancel' },
        { status: 400 }
      );
    }

    // Get cancellation preview
    const preview = await subscriptionCancel.previewCancel(organization.id);

    return NextResponse.json({
      success: true,
      data: preview
    });
  } catch (error) {
    console.error('Cancel preview error:', error);
    
    if (error instanceof Error && error.message.includes('Cannot cancel')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to preview cancellation' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/subscription/cancel
 * 
 * Execute subscription cancellation.
 * Body: { reason?: string }
 * 
 * Marks subscription as 'canceling' - access continues until period end.
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

    // Parse optional reason from body
    let reason: CancelReason | undefined;
    try {
      const body = await request.json();
      if (body.reason && CANCEL_REASONS.includes(body.reason)) {
        reason = body.reason as CancelReason;
      }
    } catch {
      // No body or invalid JSON is fine
    }

    // Resolve organization from session
    const organization = await resolveOrganizationForSession(session);
    
    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'No organization found' },
        { status: 404 }
      );
    }

    // Execute cancellation
    const subscriptionCancel = getSubscriptionCancel();
    const result = await subscriptionCancel.executeCancel(organization.id, reason);

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
        accessUntil: result.accessUntil
      }
    });
  } catch (error) {
    console.error('Cancel execution error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
