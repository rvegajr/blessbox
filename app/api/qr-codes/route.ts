import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';
import { QRCodeService } from '@/lib/services/QRCodeService';
import { getOrganizationByEmail } from '@/lib/subscriptions';
import { parseODataQuery } from '@/lib/utils/odataParser';

const qrCodeService = new QRCodeService();

// GET /api/qr-codes?organizationId=xxx&$filter=...&$orderby=... - List QR codes
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

    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId') || organization.id;

    // Verify user has access to this organization
    if (organizationId !== organization.id && (session.user as any).role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Parse OData query parameters
    const odataQuery = parseODataQuery(searchParams);

    // Get QR codes
    let qrCodes = await qrCodeService.listQRCodes(organizationId);

    // Apply OData filtering
    if (odataQuery.filter) {
      for (const condition of odataQuery.filter) {
        if (condition.field === 'isActive' && condition.operator === 'eq') {
          qrCodes = qrCodes.filter(qr => qr.isActive === (condition.value === 'true' || condition.value === true));
        } else if (condition.field === 'qrCodeSetId' && condition.operator === 'eq') {
          qrCodes = qrCodes.filter(qr => qr.qrCodeSetId === condition.value);
        } else if (condition.field === 'label' && condition.operator === 'contains') {
          qrCodes = qrCodes.filter(qr => 
            qr.label.toLowerCase().includes((condition.value as string).toLowerCase())
          );
        }
      }
    }

    // Apply OData ordering
    if (odataQuery.orderBy && odataQuery.orderBy.length > 0) {
      const orderBy = odataQuery.orderBy[0];
      qrCodes.sort((a, b) => {
        let aValue: any = a[orderBy.field as keyof typeof a];
        let bValue: any = b[orderBy.field as keyof typeof b];

        if (orderBy.direction === 'desc') {
          return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
        } else {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        }
      });
    }

    // Apply OData pagination
    let result = qrCodes;
    if (odataQuery.top) {
      result = result.slice(0, odataQuery.top);
    }
    if (odataQuery.skip) {
      result = result.slice(odataQuery.skip);
    }

    // Build response
    const response: any = {
      success: true,
      data: result,
      count: result.length,
    };

    if (odataQuery.count) {
      response.totalCount = qrCodes.length;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('List QR codes error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

