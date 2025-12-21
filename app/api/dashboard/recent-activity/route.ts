import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';
import { resolveOrganizationForSession } from '@/lib/subscriptions';
import { getDbClient } from '@/lib/db';

// GET /api/dashboard/recent-activity - Get recent activity feed
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const db = getDbClient();

    // Get recent registrations
    const recentRegistrations = await db.execute({
      sql: `
        SELECT 
          r.id,
          r.qr_code_id,
          r.registration_data,
          r.registered_at,
          r.checked_in_at,
          qr.label as qr_label
        FROM registrations r
        JOIN qr_code_sets qcs ON r.qr_code_set_id = qcs.id
        LEFT JOIN (
          SELECT 
            json_extract(je.value, '$.id') as qr_id,
            json_extract(je.value, '$.label') as label
          FROM qr_code_sets qcs2, json_each(qcs2.qr_codes) je
          WHERE qcs2.organization_id = ?
        ) qr ON r.qr_code_id = qr.qr_id
        WHERE qcs.organization_id = ?
        ORDER BY r.registered_at DESC
        LIMIT ?
      `,
      args: [organization.id, organization.id, limit]
    });

    const activities = recentRegistrations.rows.map((row: any) => {
      const formData = JSON.parse(row.registration_data || '{}');
      return {
        type: 'registration',
        id: row.id,
        timestamp: row.registered_at,
        data: {
          registrantName: formData.name || formData.Name || formData.fullName || 'Anonymous',
          registrantEmail: formData.email || formData.Email || formData.emailAddress || null,
          qrCodeLabel: row.qr_label,
          checkedIn: row.checked_in_at !== null
        }
      };
    });

    return NextResponse.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Recent activity error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}








