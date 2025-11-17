import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/authOptions';
import { ClassService } from '@/lib/services/ClassService';
import { getOrganizationByEmail } from '@/lib/subscriptions';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const classService = new ClassService();
    const sessions = await classService.getSessionsByClass(params.id);

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { session_date, session_time, duration_minutes, location, instructor_name } = await req.json();

    if (!session_date || !session_time) {
      return NextResponse.json({ error: 'Session date and time are required' }, { status: 400 });
    }

    const classService = new ClassService();
    const newSession = await classService.createSession({
      class_id: params.id,
      session_date,
      session_time,
      duration_minutes: duration_minutes || 60,
      location: location || '',
      instructor_name: instructor_name || '',
      status: 'scheduled'
    });

    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

