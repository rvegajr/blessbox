import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';
import { ClassService } from '@/lib/services/ClassService';
import { EmailService } from '@/lib/services/EmailService';
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

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId');
    if (!classId) {
      return NextResponse.json({ error: 'classId required' }, { status: 400 });
    }

    const classService = new ClassService();
    const cls = await classService.getClass(classId);
    if (!cls) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }
    if ((cls as any).organization_id !== organization.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const enrollments = await classService.getEnrollmentsByClass(classId);
    return NextResponse.json({ success: true, data: enrollments });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 });
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

    const { participant_id, class_id, session_id, notes } = await req.json();

    if (!participant_id || !class_id) {
      return NextResponse.json({ error: 'Participant ID and Class ID are required' }, { status: 400 });
    }

    const classService = new ClassService();
    const emailService = new EmailService();

    const classDetails = await classService.getClass(class_id);
    if (!classDetails) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }
    if ((classDetails as any).organization_id !== organization.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Enforce capacity limits (non-cancelled enrollments)
    const currentEnrollments = await classService.getEnrollmentsByClass(class_id);
    const activeCount = currentEnrollments.filter((e: any) => e.enrollment_status !== 'cancelled').length;
    if (classDetails.capacity > 0 && activeCount >= classDetails.capacity) {
      return NextResponse.json({ error: 'Class capacity reached' }, { status: 409 });
    }

    // Create enrollment
    const enrollment = await classService.enrollParticipant({
      participant_id,
      class_id,
      session_id: session_id || null,
      enrollment_status: 'pending',
      enrolled_at: new Date().toISOString(),
      notes: notes || ''
    });

    // Get participant and class details for email
    const participant = await classService.getParticipant(participant_id);
    const sessionDetails = session_id ? await classService.getSession(session_id) : null;

    if (participant && classDetails) {
      // Send invitation email
      try {
        await emailService.sendEmail(
          organization.id,
          participant.email,
          'class_invitation',
          {
            participant_name: `${participant.first_name} ${participant.last_name}`,
            class_name: classDetails.name,
            session_date: sessionDetails?.session_date || 'TBD',
            session_time: sessionDetails?.session_time || 'TBD',
            duration_minutes: sessionDetails?.duration_minutes || 60,
            location: sessionDetails?.location || 'TBD',
            instructor_name: sessionDetails?.instructor_name || 'TBD',
            organization_name: organization.name,
            confirmation_link: `${process.env.PUBLIC_APP_URL || process.env.NEXTAUTH_URL || ''}/enrollments/${enrollment.id}/confirm`
          }
        );
      } catch (e) {
        // Don't fail enrollment if email sending isn't configured (common in local/dev).
        console.warn('Enrollment created but failed to send invitation email:', e);
      }
    }

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error) {
    console.error('Error creating enrollment:', error);
    return NextResponse.json({ error: 'Failed to create enrollment' }, { status: 500 });
  }
}
