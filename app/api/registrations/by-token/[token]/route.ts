import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db';

/**
 * GET /api/registrations/by-token/[token]
 * 
 * Fetch registration details by check-in token.
 * Public endpoint - no auth required (token is the auth).
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const params = await context.params;
  const { token } = params;

  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Token is required' },
      { status: 400 }
    );
  }

  try {
    const db = getDbClient();

    // Fetch registration by check-in token
    const result = await db.execute({
      sql: `
        SELECT 
          r.id, r.registration_data, r.registered_at, r.check_in_token,
          r.checked_in_at, r.checked_in_by, r.token_status,
          qr.name as qr_set_name,
          o.name as organization_name, o.event_name
        FROM registrations r
        JOIN qr_code_sets qr ON r.qr_code_set_id = qr.id
        JOIN organizations o ON qr.organization_id = o.id
        WHERE r.check_in_token = ?
        LIMIT 1
      `,
      args: [token]
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired check-in token' },
        { status: 404 }
      );
    }

    const row = result.rows[0] as any;

    const registration = {
      id: row.id,
      registrationData: row.registration_data,
      registeredAt: row.registered_at,
      checkInToken: row.check_in_token,
      checkedInAt: row.checked_in_at,
      checkedInBy: row.checked_in_by,
      tokenStatus: row.token_status,
    };

    return NextResponse.json({
      success: true,
      registration,
      organizationName: row.organization_name,
      eventName: row.event_name,
      qrSetName: row.qr_set_name
    });

  } catch (error) {
    console.error('Error fetching registration by token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch registration' },
      { status: 500 }
    );
  }
}

