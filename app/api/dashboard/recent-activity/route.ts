import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';
import { resolveOrganizationForSession } from '@/lib/subscriptions';
import { getDbClient } from '@/lib/db';
import { extractName } from '@/lib/utils/registration-field-parser';

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

    // Get recent registrations, including form field definitions for label resolution
    // NOTE: We query qr_codes JSON in application layer to avoid Cartesian product from json_each
    const recentRegistrations = await db.execute({
      sql: `
        SELECT DISTINCT
          r.id,
          r.qr_code_id,
          r.registration_data,
          r.registered_at,
          r.checked_in_at,
          qcs.form_fields,
          qcs.qr_codes
        FROM registrations r
        JOIN qr_code_sets qcs ON r.qr_code_set_id = qcs.id
        WHERE qcs.organization_id = ?
        ORDER BY r.registered_at DESC
        LIMIT ?
      `,
      args: [organization.id, limit]
    });

    const activities = recentRegistrations.rows.map((row: any) => {
      const formData = JSON.parse(row.registration_data || '{}');
      let formFields: any[] | undefined;
      try {
        formFields = row.form_fields ? JSON.parse(row.form_fields) : undefined;
      } catch {
        formFields = undefined;
      }
      const registrantName = extractName(formData, formFields) || 'Anonymous';
      
      // Extract QR code label from qr_codes JSON array (avoid Cartesian product)
      let qrCodeLabel = row.qr_code_id;
      try {
        const qrCodes = row.qr_codes ? JSON.parse(row.qr_codes) : [];
        const matchingCode = qrCodes.find((qr: any) => qr.id === row.qr_code_id);
        if (matchingCode?.label) {
          qrCodeLabel = matchingCode.label;
        }
      } catch {
        // Fall back to qr_code_id if parsing fails
      }
      
      return {
        type: 'registration',
        id: row.id,
        timestamp: row.registered_at,
        data: {
          registrantName,
          registrantEmail: formData.email || formData.Email || formData.emailAddress || null,
          qrCodeLabel,
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








