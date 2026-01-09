/**
 * GET /api/check-in/search
 * 
 * Search registrations for check-in
 * Supports search by name, email, or phone
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';
import { resolveOrganizationForSession } from '@/lib/subscriptions';
import { getDbClient } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get organization
    const organization = await resolveOrganizationForSession(session);
    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'No active organization' },
        { status: 403 }
      );
    }

    // Get search parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const filter = searchParams.get('filter') || 'all'; // all, pending, checked-in
    const limit = parseInt(searchParams.get('limit') || '50');

    const db = getDbClient();

    // Build search query
    let sql = `
      SELECT 
        r.id,
        r.registration_data,
        r.registered_at,
        r.check_in_token,
        r.token_status,
        r.checked_in_at,
        r.checked_in_by,
        qcs.label as qr_code_label
      FROM registrations r
      LEFT JOIN qr_code_sets qcs ON r.qr_code_set_id = qcs.id
      WHERE qcs.organization_id = ?
    `;

    const args: any[] = [organization.id];

    // Add search filter
    if (query.trim()) {
      sql += ` AND (
        r.registration_data LIKE ? OR
        r.registration_data LIKE ? OR
        r.registration_data LIKE ?
      )`;
      const searchPattern = `%${query}%`;
      args.push(searchPattern, searchPattern, searchPattern);
    }

    // Add status filter
    if (filter === 'pending') {
      sql += ` AND (r.checked_in_at IS NULL OR r.token_status != 'used')`;
    } else if (filter === 'checked-in') {
      sql += ` AND r.checked_in_at IS NOT NULL AND r.token_status = 'used'`;
    }

    // Order by most recent first
    sql += ` ORDER BY r.registered_at DESC LIMIT ?`;
    args.push(limit);

    const result = await db.execute({ sql, args });

    // Parse registration data and extract key fields
    const registrations = result.rows.map((row: any) => {
      const data = JSON.parse(row.registration_data || '{}');
      return {
        id: row.id,
        name: data.name || data.Name || data.fullName || 'Unknown',
        email: data.email || data.Email || data.emailAddress || '',
        phone: data.phone || data.Phone || data.phoneNumber || '',
        registeredAt: row.registered_at,
        checkInToken: row.check_in_token,
        tokenStatus: row.token_status,
        checkedInAt: row.checked_in_at,
        checkedInBy: row.checked_in_by,
        qrCodeLabel: row.qr_code_label,
        registrationData: data
      };
    });

    return NextResponse.json({
      success: true,
      registrations,
      total: registrations.length,
      filter,
      query
    });

  } catch (error) {
    console.error('Check-in search error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Search failed' 
      },
      { status: 500 }
    );
  }
}

