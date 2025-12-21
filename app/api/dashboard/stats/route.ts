import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';
import { resolveOrganizationForSession } from '@/lib/subscriptions';
import { RegistrationService } from '@/lib/services/RegistrationService';
import { QRCodeService } from '@/lib/services/QRCodeService';
import { getDbClient } from '@/lib/db';

const registrationService = new RegistrationService();
const qrCodeService = new QRCodeService();

// GET /api/dashboard/stats - Get overall dashboard statistics
export async function GET(request: NextRequest) {
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

    const db = getDbClient();

    // Get registration stats
    const regStats = await registrationService.getRegistrationStats(organization.id);

    // Get QR code stats
    const qrCodes = await qrCodeService.listQRCodes(organization.id);
    const activeQRCodes = qrCodes.filter(qr => qr.isActive).length;
    const totalScans = qrCodes.reduce((sum, qr) => sum + (qr.scanCount || 0), 0);
    const totalRegistrations = qrCodes.reduce((sum, qr) => sum + (qr.registrationCount || 0), 0);

    // Get check-in stats
    const checkInResult = await db.execute({
      sql: `
        SELECT COUNT(*) as checked_in_count
        FROM registrations r
        JOIN qr_code_sets qcs ON r.qr_code_set_id = qcs.id
        WHERE qcs.organization_id = ? AND r.checked_in_at IS NOT NULL
      `,
      args: [organization.id]
    });
    const checkedInCount = (checkInResult.rows[0] as any)?.checked_in_count || 0;

    // Get recent activity count (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const recentActivityResult = await db.execute({
      sql: `
        SELECT COUNT(*) as recent_count
        FROM registrations r
        JOIN qr_code_sets qcs ON r.qr_code_set_id = qcs.id
        WHERE qcs.organization_id = ? AND r.registered_at >= ?
      `,
      args: [organization.id, sevenDaysAgo]
    });
    const recentActivityCount = (recentActivityResult.rows[0] as any)?.recent_count || 0;

    return NextResponse.json({
      success: true,
      data: {
        registrations: {
          total: regStats.total,
          pending: regStats.pending,
          delivered: regStats.delivered,
          cancelled: regStats.cancelled,
          today: regStats.today,
          thisWeek: regStats.thisWeek,
          thisMonth: regStats.thisMonth,
          checkedIn: checkedInCount
        },
        qrCodes: {
          total: qrCodes.length,
          active: activeQRCodes,
          totalScans,
          totalRegistrations
        },
        recentActivity: recentActivityCount
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}








