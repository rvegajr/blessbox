import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';
import { ensureDbReady } from '@/lib/db-ready';
import { getDbClient } from '@/lib/db';

export async function GET() {
  const session = await getServerSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await ensureDbReady();
  const db = getDbClient();

  const res = await db.execute({
    sql: `
      SELECT
        o.id,
        o.name,
        o.contact_email,
        o.created_at,
        m.role
      FROM memberships m
      JOIN organizations o ON o.id = m.organization_id
      WHERE m.user_id = ?
      ORDER BY o.created_at DESC
    `,
    args: [userId],
  });

  return NextResponse.json({
    organizations: (res.rows || []).map((r: any) => ({
      id: String(r.id),
      name: String(r.name ?? ''),
      contactEmail: String(r.contact_email ?? ''),
      createdAt: r.created_at,
      role: String(r.role ?? 'member'),
    })),
    activeOrganizationId: (session.user as any)?.organizationId || null,
  });
}

