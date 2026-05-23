/**
 * GET /api/check-in/search
 * 
 * Search registrations for check-in
 * Supports search by name, email, or phone
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from '@/lib/auth-helper';
import { resolveOrganizationForSession } from '@/lib/subscriptions';
import { getDbClient } from '@/lib/db';
import { RegistrationRoleService } from '@/lib/services/RegistrationRoleService';
import { extractName, extractEmail, extractPhone, type FormField } from '@/lib/utils/registration-field-parser';

const SearchQuerySchema = z.object({
  q: z.string().max(200).optional().default(''),
  filter: z.enum(['all', 'pending', 'checked-in']).optional().default('all'),
  limit: z.coerce.number().int().min(1).max(500).optional().default(50),
  // Phase 2: optional role filter (case-insensitive). Empty/omitted = no filter.
  role: z.string().max(32).optional().default(''),
});

const roleService = new RegistrationRoleService();

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

    // Get search parameters (validated via zod)
    const searchParams = request.nextUrl.searchParams;
    const qsParse = SearchQuerySchema.safeParse({
      q: searchParams.get('q') ?? undefined,
      filter: searchParams.get('filter') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      role: searchParams.get('role') ?? undefined,
    });
    if (!qsParse.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: qsParse.error.flatten() },
        { status: 400 }
      );
    }
    const { q: query, filter, limit, role: roleFilter } = qsParse.data;

    const db = getDbClient();

    // Build search query - include form_fields for label mapping
    let sql = `
      SELECT 
        r.id,
        r.registration_data,
        r.registered_at,
        r.check_in_token,
        r.token_status,
        r.checked_in_at,
        r.checked_in_by,
        qcs.name as qr_code_set_name,
        qcs.form_fields
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
      sql += ` AND (r.checked_in_at IS NULL AND r.token_status != 'used')`;
    } else if (filter === 'checked-in') {
      sql += ` AND r.checked_in_at IS NOT NULL AND r.token_status = 'used'`;
    }

    // Order by most recent first
    sql += ` ORDER BY r.registered_at DESC LIMIT ?`;
    args.push(limit);

    const result = await db.execute({ sql, args });

    // Parse registration data and extract key fields using field parser
    const allRegistrations = result.rows.map((row: any) => {
      const data = JSON.parse(row.registration_data || '{}');
      
      // Parse form fields for label mapping
      let formFields: FormField[] | undefined;
      try {
        formFields = row.form_fields ? JSON.parse(row.form_fields) : undefined;
      } catch {
        formFields = undefined;
      }
      
      // Use registration-field-parser for intelligent name/email/phone extraction
      const name = extractName(data, formFields);
      const email = extractEmail(data, formFields);
      const phone = extractPhone(data, formFields);
      
      return {
        id: row.id,
        name,
        email,
        phone,
        registeredAt: row.registered_at,
        checkInToken: row.check_in_token,
        tokenStatus: row.token_status,
        checkedInAt: row.checked_in_at,
        checkedInBy: row.checked_in_by,
        qrCodeSetName: row.qr_code_set_name,
        // Phase 2: surface normalized role for badges/filters; null when missing.
        role: roleService.extractRole(data),
        registrationData: data,
      };
    });

    // Apply role filter at the JSON layer (not pushed down to SQL because role
    // lives inside the registration_data blob).
    const registrations = roleFilter
      ? allRegistrations.filter((r) => roleService.matchesRole(r, roleFilter))
      : allRegistrations;

    return NextResponse.json({
      success: true,
      registrations,
      total: registrations.length,
      filter,
      role: roleFilter || null,
      query,
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

