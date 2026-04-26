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

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
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

    const body = await req.json().catch(() => ({}));
    const updates: any = {};
    if (typeof body.name === 'string') updates.name = body.name;
    if (typeof body.description === 'string') updates.description = body.description;
    if (body.capacity !== undefined && body.capacity !== null) {
      const cap = parseInt(String(body.capacity), 10);
      if (Number.isNaN(cap) || cap < 0) {
        return NextResponse.json({ error: 'capacity must be a non-negative integer' }, { status: 400 });
      }
      updates.capacity = cap;
    }
    if (typeof body.timezone === 'string') updates.timezone = body.timezone;
    if (typeof body.status === 'string') updates.status = body.status;

    const updated = await classService.updateClass(params.id, updates);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating class:', error);
    return NextResponse.json({ error: 'Failed to update class' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
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

    await classService.deleteClass(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting class:', error);
    return NextResponse.json({ error: 'Failed to delete class' }, { status: 500 });
  }
}

