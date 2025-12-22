import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';
import { QRCodeService } from '@/lib/services/QRCodeService';
import { resolveOrganizationForSession } from '@/lib/subscriptions';

const qrCodeService = new QRCodeService();

// GET /api/qr-codes/[id]?qrCodeSetId=xxx - Get QR code details
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

    const activeOrg = await resolveOrganizationForSession(session);
    if (!activeOrg) {
      return NextResponse.json(
        { success: false, error: 'Organization selection required' },
        { status: 409 }
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

    if (qrCodeSet.organizationId !== activeOrg.id && (session.user as any).role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const qrCode = await qrCodeService.getQRCode(id, qrCodeSetId);

    if (!qrCode) {
      return NextResponse.json(
        { success: false, error: 'QR code not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: qrCode });
  } catch (error) {
    console.error('Get QR code error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/qr-codes/[id]?qrCodeSetId=xxx - Update QR code
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const activeOrg = await resolveOrganizationForSession(session);
    if (!activeOrg) {
      return NextResponse.json(
        { success: false, error: 'Organization selection required' },
        { status: 409 }
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

    const updates = await request.json();
    // Only allow safe updates from the dashboard/API.
    // URL-critical fields (label/slug/url/dataUrl) are intentionally immutable here.
    const safeUpdates = {
      ...(typeof updates?.description === 'string' ? { description: updates.description } : {}),
      ...(typeof updates?.label === 'string' ? { label: updates.label } : {}), // backward compat: treated as description in service
      ...(typeof updates?.isActive === 'boolean' ? { isActive: updates.isActive } : {}),
    };

    // Verify user has access to this QR code set
    const qrCodeSet = await qrCodeService.getQRCodeSet(qrCodeSetId);
    if (!qrCodeSet) {
      return NextResponse.json(
        { success: false, error: 'QR code set not found' },
        { status: 404 }
      );
    }

    if (qrCodeSet.organizationId !== activeOrg.id && (session.user as any).role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const updatedQRCode = await qrCodeService.updateQRCode(id, qrCodeSetId, safeUpdates);

    return NextResponse.json({ success: true, data: updatedQRCode });
  } catch (error) {
    console.error('Update QR code error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/qr-codes/[id]?qrCodeSetId=xxx - Delete (deactivate) QR code
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const activeOrg = await resolveOrganizationForSession(session);
    if (!activeOrg) {
      return NextResponse.json(
        { success: false, error: 'Organization selection required' },
        { status: 409 }
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

    if (qrCodeSet.organizationId !== activeOrg.id && (session.user as any).role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    await qrCodeService.deleteQRCode(id, qrCodeSetId);

    return NextResponse.json({ success: true, message: 'QR code deleted successfully' });
  } catch (error) {
    console.error('Delete QR code error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    );
  }
}

