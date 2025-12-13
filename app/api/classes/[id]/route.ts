import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';
import { resolveOrganizationForSession } from '@/lib/subscriptions';
import { ClassService } from '@/lib/services/ClassService';
import { ensureDbReady } from '@/lib/db-ready';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const session = await getServerSession();

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureDbReady();
    const organization = await resolveOrganizationForSession(session);
    if (!organization) {
      return NextResponse.json({ error: 'Organization selection required' }, { status: 409 });
    }

    const classService = new ClassService();
    const cls = await classService.getClass(params.id);
    if (!cls) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    if ((cls as any).organization_id !== organization.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(cls);
  } catch (error) {
    console.error('Error fetching class:', error);
    return NextResponse.json({ error: 'Failed to fetch class' }, { status: 500 });
  }
}

