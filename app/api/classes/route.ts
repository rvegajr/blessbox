import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/authOptions';
import { ClassService } from '@/lib/services/ClassService';
import { getOrganizationByEmail } from '@/lib/subscriptions';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const organization = await getOrganizationByEmail(session.user.email);
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
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
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const organization = await getOrganizationByEmail(session.user.email);
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { name, description, capacity, timezone } = await req.json();

    if (!name || !capacity) {
      return NextResponse.json({ error: 'Name and capacity are required' }, { status: 400 });
    }

    const classService = new ClassService();
    const newClass = await classService.createClass({
      organization_id: organization.id,
      name,
      description: description || '',
      capacity: parseInt(capacity),
      timezone: timezone || 'UTC',
      status: 'active'
    });

    return NextResponse.json(newClass, { status: 201 });
  } catch (error) {
    console.error('Error creating class:', error);
    return NextResponse.json({ error: 'Failed to create class' }, { status: 500 });
  }
}
