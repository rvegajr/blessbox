import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';
import { isSuperAdminEmail } from '@/lib/auth';
import { getDbClient } from '@/lib/db';

// GET /api/admin/organizations - Get all organizations (super admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email || !isSuperAdminEmail(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = getDbClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get organizations
    const orgsResult = await db.execute({
      sql: `SELECT * FROM organizations ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      args: [limit, offset]
    });

    // Get total count
    const countResult = await db.execute({
      sql: `SELECT COUNT(*) as count FROM organizations`,
      args: []
    });

    const organizations = orgsResult.rows as any[];
    const totalCount = (countResult.rows[0] as any)?.count || 0;

    // Get registration counts for each org
    const orgsWithStats = await Promise.all(
      organizations.map(async (org) => {
        const regCountResult = await db.execute({
          sql: `SELECT COUNT(*) as count FROM registrations r
                INNER JOIN qr_code_sets qcs ON r.qr_code_set_id = qcs.id
                WHERE qcs.organization_id = ?`,
          args: [org.id]
        });
        const regCount = (regCountResult.rows[0] as any)?.count || 0;

        const qrCountResult = await db.execute({
          sql: `SELECT COUNT(*) as count FROM qr_code_sets WHERE organization_id = ?`,
          args: [org.id]
        });
        const qrCount = (qrCountResult.rows[0] as any)?.count || 0;

        return {
          ...org,
          registrationCount: regCount,
          qrCodeSetCount: qrCount
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: orgsWithStats,
      count: organizations.length,
      totalCount
    });
  } catch (error) {
    console.error('Admin organizations API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}

