import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';
import { resolveOrganizationForSession } from '@/lib/subscriptions';
import { getUsageDisplay } from '@/lib/services/UsageDisplay';

/**
 * GET /api/usage
 * 
 * Returns usage display data for the current user's organization.
 * Requires authentication.
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
        { success: false, error: 'No organization found. Please complete onboarding.' },
        { status: 404 }
      );
    }

    // Get usage display data
    const usageDisplay = getUsageDisplay();
    const usage = await usageDisplay.getUsageDisplay(organization.id);

    return NextResponse.json({
      success: true,
      data: usage
    });
  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}
