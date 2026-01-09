import { NextRequest, NextResponse } from 'next/server';
import { RegistrationService } from '@/lib/services/RegistrationService';
import { getServerSession } from '@/lib/auth-helper';
import { resolveOrganizationForSession } from '@/lib/subscriptions';

const registrationService = new RegistrationService();

// POST /api/registrations/[id]/undo-check-in - Undo a check-in
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = context.params;
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { token } = body;

    const registration = await registrationService.getRegistration(id);
    if (!registration) {
      return NextResponse.json({ success: false, error: 'Registration not found' }, { status: 404 });
    }

    // Authentication: Either session-based OR token-based
    const session = await getServerSession();
    const isTokenAuth = token && registration.checkInToken && token === registration.checkInToken;
    const isSessionAuth = session && session.user?.email;

    if (!isTokenAuth && !isSessionAuth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // For session-based auth, verify organization ownership
    if (isSessionAuth && !isTokenAuth) {
      const organization = await resolveOrganizationForSession(session);
      if (!organization) {
        return NextResponse.json({ success: false, error: 'Organization selection required' }, { status: 409 });
      }

      // Verify org owns the QR code set
      const db = (await import('@/lib/db')).getDbClient();
      const qrSetResult = await db.execute({
        sql: 'SELECT organization_id FROM qr_code_sets WHERE id = ?',
        args: [registration.qrCodeSetId],
      });

      if (qrSetResult.rows.length === 0 || (qrSetResult.rows[0] as any).organization_id !== organization.id) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
      }
    }

    const updated = await registrationService.undoCheckInRegistration(id);
    return NextResponse.json({ success: true, registration: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = /not checked in/i.test(message) ? 409 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

