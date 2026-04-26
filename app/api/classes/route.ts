import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';
import { ClassService } from '@/lib/services/ClassService';
import { resolveOrganizationForSession } from '@/lib/subscriptions';
import { ensureDbReady } from '@/lib/db-ready';

export async function GET(req: NextRequest) {
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
    const classes = await classService.getClassesByOrganization(organization.id);

    return NextResponse.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const { name, description, capacity, timezone } = await req.json();

    if (!name || capacity === undefined || capacity === null || capacity === '') {
      return NextResponse.json({ error: 'Name and capacity are required' }, { status: 400 });
    }

    // Capacity semantics: capacity must be a non-negative integer.
    //   > 0 -> hard cap
    //   = 0 -> "closed" (no enrollments accepted). NOTE: this changes the
    //          previous behavior where capacity=0 silently meant "unlimited".
    const capacityNum = parseInt(String(capacity), 10);
    if (Number.isNaN(capacityNum) || capacityNum < 0) {
      return NextResponse.json(
        { error: 'capacity must be a non-negative integer (0 = closed)' },
        { status: 400 }
      );
    }

    const classService = new ClassService();
    const newClass = await classService.createClass({
      organization_id: organization.id,
      name,
      description: description || '',
      capacity: capacityNum,
      timezone: timezone || 'UTC',
      status: 'active'
    });

    return NextResponse.json(newClass, { status: 201 });
  } catch (error) {
    console.error('Error creating class:', error);
    return NextResponse.json({ error: 'Failed to create class' }, { status: 500 });
  }
}
