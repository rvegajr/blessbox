import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';
import { resolveOrganizationForSession } from '@/lib/subscriptions';
import { RegistrationService } from '@/lib/services/RegistrationService';

const registrationService = new RegistrationService();

/**
 * Authorize a request for a specific registration id.
 *
 * Returns either:
 *   - { error: NextResponse } when the request must be rejected
 *   - { orgId: string } when the caller's active organization owns the registration
 *
 * NOTE: We deliberately return 404 (not 403) for cross-organization access so
 * the endpoint does not leak whether a registration id exists in another tenant.
 */
async function authorizeForRegistration(
  id: string
): Promise<{ error: NextResponse } | { orgId: string; superAdmin: boolean }> {
  const session = await getServerSession();
  if (!session || !session.user?.email) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      ),
    };
  }

  const activeOrg = await resolveOrganizationForSession(session);
  if (!activeOrg) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Organization selection required' },
        { status: 409 }
      ),
    };
  }

  const ownerOrgId = await registrationService.getRegistrationOrganizationId(id);
  const superAdmin = (session.user as any).role === 'super_admin';

  // Existence + ownership check collapsed into a single 404 to avoid an oracle.
  if (!ownerOrgId || (ownerOrgId !== activeOrg.id && !superAdmin)) {
    return {
      error: NextResponse.json(
        { success: false, error: 'Registration not found' },
        { status: 404 }
      ),
    };
  }

  return { orgId: activeOrg.id, superAdmin };
}

// GET /api/registrations/[id] - Get registration details
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Registration ID is required' },
        { status: 400 }
      );
    }

    const authz = await authorizeForRegistration(id);
    if ('error' in authz) return authz.error;

    const registration = await registrationService.getRegistration(id);
    if (!registration) {
      return NextResponse.json(
        { success: false, error: 'Registration not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, registration });
  } catch (error) {
    console.error('Get registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/registrations/[id] - Update registration
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Registration ID is required' },
        { status: 400 }
      );
    }

    const authz = await authorizeForRegistration(id);
    if ('error' in authz) return authz.error;

    const updates = await request.json();

    if (
      updates.deliveryStatus &&
      !['pending', 'delivered', 'cancelled'].includes(updates.deliveryStatus)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid delivery status. Must be pending, delivered, or cancelled',
        },
        { status: 400 }
      );
    }

    const registration = await registrationService.updateRegistration(id, updates);
    return NextResponse.json({
      success: true,
      registration,
      message: 'Registration updated successfully',
    });
  } catch (error) {
    console.error('Update registration error:', error);
    if (error instanceof Error && error.message.includes('Registration not found')) {
      return NextResponse.json(
        { success: false, error: 'Registration not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/registrations/[id] - Delete registration
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Registration ID is required' },
        { status: 400 }
      );
    }

    const authz = await authorizeForRegistration(id);
    if ('error' in authz) return authz.error;

    await registrationService.deleteRegistration(id);
    return NextResponse.json({
      success: true,
      message: 'Registration deleted successfully',
    });
  } catch (error) {
    console.error('Delete registration error:', error);
    if (error instanceof Error && error.message.includes('Registration not found')) {
      return NextResponse.json(
        { success: false, error: 'Registration not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
