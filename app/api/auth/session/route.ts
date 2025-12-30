/**
 * GET /api/auth/session
 * 
 * Get the current user session and their organizations.
 * Returns null if not authenticated.
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/AuthService';
import { getDbClient } from '@/lib/db';

export const runtime = 'nodejs';

const authService = new AuthService();

export async function GET(_request: NextRequest) {
  try {
    const session = await authService.getSession();

    if (!session) {
      return NextResponse.json({ user: null, organizations: [] });
    }

    // Fetch user's organizations
    const db = getDbClient();
    const orgsResult = await db.execute({
      sql: `
        SELECT o.id, o.name, o.contact_email, m.role
        FROM memberships m
        JOIN organizations o ON o.id = m.organization_id
        WHERE m.user_id = ?
        ORDER BY o.created_at DESC
      `,
      args: [session.user.id],
    });

    const organizations = (orgsResult.rows || []).map((r: any) => ({
      id: String(r.id),
      name: String(r.name ?? ''),
      contactEmail: String(r.contact_email ?? ''),
      role: String(r.role ?? 'member'),
    }));

    return NextResponse.json({
      user: session.user,
      expires: session.expires,
      organizations,
      activeOrganizationId: session.user.organizationId || null,
    });
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json({ user: null, organizations: [] });
  }
}
