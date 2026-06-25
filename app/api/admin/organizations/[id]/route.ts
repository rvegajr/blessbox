import { NextResponse } from 'next/server';
import { withSuperAdmin } from '@/lib/api/withAuth';
import { getDbClient } from '@/lib/db';

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/organizations/[id]
 * Get detailed information about a specific organization
 */
export const GET = withSuperAdmin(async (request, _auth, context) => {
  try {
    const { id } = await (context as Ctx).params;
    const db = getDbClient();

    // Get organization details
    const orgResult = await db.execute({
      sql: 'SELECT * FROM organizations WHERE id = ?',
      args: [id]
    });

    if (orgResult.rows.length === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const org = orgResult.rows[0] as any;

    // Get QR code sets count
    const qrSetsResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM qr_code_sets WHERE organization_id = ?',
      args: [id]
    });
    const qrSetsCount = (qrSetsResult.rows[0] as any).count;

    // Get registrations count
    const registrationsResult = await db.execute({
      sql: `
        SELECT COUNT(DISTINCT r.id) as count 
        FROM registrations r 
        JOIN qr_code_sets qcs ON r.qr_code_set_id = qcs.id 
        WHERE qcs.organization_id = ?
      `,
      args: [id]
    });
    const registrationsCount = (registrationsResult.rows[0] as any).count;

    // Get subscription info
    const subscriptionResult = await db.execute({
      sql: 'SELECT * FROM subscription_plans WHERE organization_id = ? ORDER BY created_at DESC LIMIT 1',
      args: [id]
    });
    const subscription = subscriptionResult.rows.length > 0 ? subscriptionResult.rows[0] : null;

    return NextResponse.json({
      success: true,
      organization: {
        ...org,
        qrCodeSetsCount: qrSetsCount,
        registrationsCount,
        subscription
      }
    });

  } catch (error) {
    console.error('Admin organization detail error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization details' },
      { status: 500 }
    );
  }
});

/**
 * PATCH /api/admin/organizations/[id]
 * Update organization (suspend, unsuspend, etc.)
 */
export const PATCH = withSuperAdmin(async (request, _auth, context) => {
  try {
    const { id } = await (context as Ctx).params;
    const body = await request.json();
    const { action } = body;

    const db = getDbClient();

    if (action === 'suspend') {
      // Suspend organization (mark as inactive)
      await db.execute({
        sql: 'UPDATE organizations SET email_verified = 0, updated_at = ? WHERE id = ?',
        args: [new Date().toISOString(), id]
      });

      return NextResponse.json({
        success: true,
        message: 'Organization suspended'
      });
    }

    if (action === 'unsuspend') {
      // Unsuspend organization
      await db.execute({
        sql: 'UPDATE organizations SET email_verified = 1, updated_at = ? WHERE id = ?',
        args: [new Date().toISOString(), id]
      });

      return NextResponse.json({
        success: true,
        message: 'Organization unsuspended'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Admin organization update error:', error);
    return NextResponse.json(
      { error: 'Failed to update organization' },
      { status: 500 }
    );
  }
});
