import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';
import { getOrganizationByEmail } from '@/lib/subscriptions';
import { RegistrationService } from '@/lib/services/RegistrationService';
import { QRCodeService } from '@/lib/services/QRCodeService';
import { getDbClient } from '@/lib/db';

const registrationService = new RegistrationService();
const qrCodeService = new QRCodeService();

// GET /api/dashboard/analytics - Get analytics data (trends, breakdowns)
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

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const db = getDbClient();
    const now = new Date();
    const defaultStartDate = startDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const defaultEndDate = endDate || now.toISOString();

    // Registration trends (daily counts)
    const trendResult = await db.execute({
      sql: `
        SELECT 
          DATE(r.registered_at) as date,
          COUNT(*) as count
        FROM registrations r
        JOIN qr_code_sets qcs ON r.qr_code_set_id = qcs.id
        WHERE qcs.organization_id = ? 
          AND r.registered_at >= ? 
          AND r.registered_at <= ?
        GROUP BY DATE(r.registered_at)
        ORDER BY date ASC
      `,
      args: [organization.id, defaultStartDate, defaultEndDate]
    });

    const trends = trendResult.rows.map((row: any) => ({
      date: row.date,
      count: row.count
    }));

    // Status breakdown
    const statusResult = await db.execute({
      sql: `
        SELECT 
          r.delivery_status,
          COUNT(*) as count
        FROM registrations r
        JOIN qr_code_sets qcs ON r.qr_code_set_id = qcs.id
        WHERE qcs.organization_id = ?
        GROUP BY r.delivery_status
      `,
      args: [organization.id]
    });

    const statusBreakdown: Record<string, number> = {};
    statusResult.rows.forEach((row: any) => {
      statusBreakdown[row.delivery_status] = row.count;
    });

    // QR code performance (top performing QR codes)
    const qrCodes = await qrCodeService.listQRCodes(organization.id);
    const qrPerformance = qrCodes
      .map(qr => ({
        id: qr.id,
        label: qr.label,
        scans: qr.scanCount || 0,
        registrations: qr.registrationCount || 0,
        conversionRate: qr.scanCount > 0 
          ? ((qr.registrationCount || 0) / qr.scanCount * 100).toFixed(1)
          : '0.0'
      }))
      .sort((a, b) => b.registrations - a.registrations)
      .slice(0, 10);

    // Check-in rate
    const checkInStatsResult = await db.execute({
      sql: `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN checked_in_at IS NOT NULL THEN 1 ELSE 0 END) as checked_in
        FROM registrations r
        JOIN qr_code_sets qcs ON r.qr_code_set_id = qcs.id
        WHERE qcs.organization_id = ?
      `,
      args: [organization.id]
    });

    const checkInStats = checkInStatsResult.rows[0] as any;
    const checkInRate = checkInStats.total > 0
      ? ((checkInStats.checked_in / checkInStats.total) * 100).toFixed(1)
      : '0.0';

    return NextResponse.json({
      success: true,
      data: {
        trends,
        statusBreakdown,
        qrPerformance,
        checkInRate: parseFloat(checkInRate),
        checkInStats: {
          total: checkInStats.total || 0,
          checkedIn: checkInStats.checked_in || 0
        }
      }
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}








