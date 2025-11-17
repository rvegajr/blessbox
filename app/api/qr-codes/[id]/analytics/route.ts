import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';
import { QRCodeService } from '@/lib/services/QRCodeService';
import { getOrganizationByEmail } from '@/lib/subscriptions';

const qrCodeService = new QRCodeService();

// GET /api/qr-codes/[id]/analytics?qrCodeSetId=xxx - Get QR code analytics
export async function GET(
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

    const organization = await getOrganizationByEmail(session.user.email);
    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const qrCodeSetId = searchParams.get('qrCodeSetId');

    if (!qrCodeSetId) {
      return NextResponse.json(
        { success: false, error: 'qrCodeSetId query parameter is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this QR code set
    const qrCodeSet = await qrCodeService.getQRCodeSet(qrCodeSetId);
    if (!qrCodeSet) {
      return NextResponse.json(
        { success: false, error: 'QR code set not found' },
        { status: 404 }
      );
    }

    if (qrCodeSet.organizationId !== organization.id && (session.user as any).role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const analytics = await qrCodeService.getQRCodeAnalytics(id, qrCodeSetId);

    return NextResponse.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Get QR code analytics error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    );
  }
}

