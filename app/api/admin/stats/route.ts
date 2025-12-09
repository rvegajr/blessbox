import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';
import { isSuperAdminEmail } from '@/lib/auth';
import { getDbClient } from '@/lib/db';

// GET /api/admin/stats - Get system-wide statistics (super admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email || !isSuperAdminEmail(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = getDbClient();

    // Get all stats in parallel
    const [
      orgsResult,
      registrationsResult,
      qrCodesResult,
      subscriptionsResult,
      couponsResult,
      activeSubsResult,
      todayRegsResult,
      thisWeekRegsResult
    ] = await Promise.all([
      db.execute({ sql: `SELECT COUNT(*) as count FROM organizations`, args: [] }),
      db.execute({ sql: `SELECT COUNT(*) as count FROM registrations`, args: [] }),
      db.execute({ sql: `SELECT COUNT(*) as count FROM qr_code_sets`, args: [] }),
      db.execute({ sql: `SELECT COUNT(*) as count FROM subscription_plans`, args: [] }),
      db.execute({ sql: `SELECT COUNT(*) as count FROM coupons`, args: [] }),
      db.execute({ sql: `SELECT COUNT(*) as count FROM subscription_plans WHERE status = 'active'`, args: [] }),
      db.execute({ sql: `SELECT COUNT(*) as count FROM registrations WHERE DATE(registered_at) = DATE('now')`, args: [] }),
      db.execute({ sql: `SELECT COUNT(*) as count FROM registrations WHERE registered_at >= datetime('now', '-7 days')`, args: [] })
    ]);

    const stats = {
      organizations: {
        total: (orgsResult.rows[0] as any)?.count || 0,
        verified: 0, // Would need separate query
        active: 0
      },
      registrations: {
        total: (registrationsResult.rows[0] as any)?.count || 0,
        today: (todayRegsResult.rows[0] as any)?.count || 0,
        thisWeek: (thisWeekRegsResult.rows[0] as any)?.count || 0
      },
      qrCodes: {
        total: (qrCodesResult.rows[0] as any)?.count || 0
      },
      subscriptions: {
        total: (subscriptionsResult.rows[0] as any)?.count || 0,
        active: (activeSubsResult.rows[0] as any)?.count || 0
      },
      coupons: {
        total: (couponsResult.rows[0] as any)?.count || 0
      }
    };

    // Get verified orgs count
    const verifiedResult = await db.execute({
      sql: `SELECT COUNT(*) as count FROM organizations WHERE email_verified = 1`,
      args: []
    });
    stats.organizations.verified = (verifiedResult.rows[0] as any)?.count || 0;
    stats.organizations.active = stats.subscriptions.active;

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Admin stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

