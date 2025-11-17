import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';
import { QRCodeService } from '@/lib/services/QRCodeService';
import { getOrganizationByEmail } from '@/lib/subscriptions';

const qrCodeService = new QRCodeService();

// GET /api/qr-code-sets - List QR code sets for the authenticated organization
export async function GET(request: NextRequest) {
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

    const qrCodeSets = await qrCodeService.getQRCodeSets(organization.id);

    return NextResponse.json({
      success: true,
      data: qrCodeSets,
    });
  } catch (error) {
    console.error('List QR code sets error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

