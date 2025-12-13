import { NextRequest, NextResponse } from 'next/server';
import { RegistrationService } from '@/lib/services/RegistrationService';
import { getServerSession } from '@/lib/auth-helper';
import { resolveOrganizationForSession } from '@/lib/subscriptions';

const registrationService = new RegistrationService();

// POST /api/registrations/[id]/check-in - Check in a registration
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = context.params;
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const organization = await resolveOrganizationForSession(session);
    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization selection required' },
        { status: 409 }
      );
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { checkedInBy } = body;

    // Verify the registration belongs to this organization
    const registration = await registrationService.getRegistration(id);
    if (!registration) {
      return NextResponse.json(
        { success: false, error: 'Registration not found' },
        { status: 404 }
      );
    }

    // Get the organization ID from the QR code set
    const db = (await import('@/lib/db')).getDbClient();
    const qrSetResult = await db.execute({
      sql: 'SELECT organization_id FROM qr_code_sets WHERE id = ?',
      args: [registration.qrCodeSetId]
    });

    if (qrSetResult.rows.length === 0 || (qrSetResult.rows[0] as any).organization_id !== organization.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Perform check-in
    const checkedInRegistration = await registrationService.checkInRegistration(
      id,
      checkedInBy || session.user.email
    );

    return NextResponse.json({
      success: true,
      registration: checkedInRegistration,
      message: 'Registration checked in successfully'
    });
  } catch (error) {
    console.error('Check-in error:', error);

    if (error instanceof Error) {
      if (error.message.includes('already checked in')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 409 }
        );
      }
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}








