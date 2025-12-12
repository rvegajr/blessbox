import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';
import { ClassService } from '@/lib/services/ClassService';
import { getOrganizationByEmail } from '@/lib/subscriptions';
import { ensureDbReady } from '@/lib/db-ready';

export async function GET(req: NextRequest) {
  const session = await getServerSession();

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureDbReady();
    const organization = await getOrganizationByEmail(session.user.email);
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const classService = new ClassService();
    const participants = await classService.getParticipantsByOrganization(organization.id);

    return NextResponse.json(participants);
  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureDbReady();
    const organization = await getOrganizationByEmail(session.user.email);
    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const { first_name, last_name, email, phone, emergency_contact, emergency_phone, notes } = await req.json();

    if (!first_name || !last_name || !email) {
      return NextResponse.json({ error: 'First name, last name, and email are required' }, { status: 400 });
    }

    const classService = new ClassService();
    const newParticipant = await classService.createParticipant({
      organization_id: organization.id,
      first_name,
      last_name,
      email,
      phone: phone || '',
      emergency_contact: emergency_contact || '',
      emergency_phone: emergency_phone || '',
      notes: notes || '',
      status: 'active'
    });

    return NextResponse.json(newParticipant, { status: 201 });
  } catch (error) {
    console.error('Error creating participant:', error);
    return NextResponse.json({ error: 'Failed to create participant' }, { status: 500 });
  }
}
