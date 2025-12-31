import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';
import { getDbClient } from '@/lib/db';
import { resolveOrganizationForSession } from '@/lib/subscriptions';

/**
 * Diagnostic endpoint to check session and organization data
 * GET /api/debug/session-org-data
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user?.email) {
      return NextResponse.json({
        authenticated: false,
        message: 'No session found'
      });
    }

    const db = getDbClient();
    const userId = session.user.id;
    
    // Get user's memberships
    const membershipsResult = await db.execute({
      sql: `
        SELECT 
          m.organization_id,
          o.name as org_name,
          m.role
        FROM memberships m
        JOIN organizations o ON o.id = m.organization_id
        WHERE m.user_id = ?
      `,
      args: [userId]
    });
    
    // Get active organization from session
    const activeOrg = await resolveOrganizationForSession(session);
    
    // For each organization, get QR codes and registrations count
    const orgsWithData = [];
    for (const membership of membershipsResult.rows) {
      const m = membership as any;
      
      // Get QR code sets
      const qrSetResult = await db.execute({
        sql: 'SELECT id, qr_codes, scan_count FROM qr_code_sets WHERE organization_id = ?',
        args: [m.organization_id]
      });
      
      let qrCodesCount = 0;
      let scanCount = 0;
      if (qrSetResult.rows.length > 0) {
        const qrRow = qrSetResult.rows[0] as any;
        const qrCodes = JSON.parse(qrRow.qr_codes || '[]');
        qrCodesCount = qrCodes.length;
        scanCount = qrRow.scan_count || 0;
      }
      
      // Get registrations count
      const regResult = await db.execute({
        sql: 'SELECT COUNT(*) as count FROM registrations WHERE organization_id = ?',
        args: [m.organization_id]
      });
      const regCount = (regResult.rows[0] as any).count;
      
      orgsWithData.push({
        id: m.organization_id,
        name: m.org_name,
        role: m.role,
        qrCodesCount,
        scanCount,
        registrationsCount: regCount,
        isActive: activeOrg?.id === m.organization_id
      });
    }
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email
      },
      activeOrganization: activeOrg ? {
        id: activeOrg.id,
        name: activeOrg.name
      } : null,
      organizations: orgsWithData,
      sessionCookies: {
        hasAuthToken: !!request.cookies.get('bb_auth_token'),
        hasActiveOrgId: !!request.cookies.get('bb_active_org_id'),
        activeOrgIdValue: request.cookies.get('bb_active_org_id')?.value
      }
    });
  } catch (error) {
    console.error('Debug session error:', error);
    return NextResponse.json(
      { error: 'Internal error', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

