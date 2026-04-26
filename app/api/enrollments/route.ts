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

    // Capacity semantics:
    //   capacity > 0  -> hard cap
    //   capacity == 0 -> CLOSED (no enrollments accepted) — historically meant
    //                    "unlimited"; that silently-permissive default is now a
    //                    deliberate "closed" gate. Use a large number for
    //                    effectively-unlimited classes until null is supported.
    if (classDetails.capacity === 0) {
      return NextResponse.json({ error: 'Class is closed for enrollment' }, { status: 409 });
    }

    // Race-safe enrollment: a single INSERT ... WHERE (count) < capacity
    // statement is evaluated atomically by libsql/SQLite, so concurrent POSTs
    // can't both pass the capacity check. The UNIQUE index on
    // (class_id, participant_id) also blocks duplicate enrollments.
    let inserted: { id: string } | null = null;
    try {
      inserted = await classService.enrollParticipantWithCapacity(
        {
          participant_id,
          class_id,
          session_id: session_id || null,
          enrollment_status: 'pending',
          enrolled_at: new Date().toISOString(),
          notes: notes || ''
        },
        classDetails.capacity // capacity > 0; 0 was rejected above
      );
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (/UNIQUE constraint failed.*enrollments/i.test(msg)) {
        return NextResponse.json(
          { error: 'Participant is already enrolled in this class' },
          { status: 409 }
        );
      }
      throw e;
    }

    if (!inserted) {
      return NextResponse.json({ error: 'Class capacity reached' }, { status: 409 });
    }

    const enrollment = await classService.getEnrollment(inserted.id);
    if (!enrollment) {
      return NextResponse.json({ error: 'Failed to create enrollment' }, { status: 500 });
    }

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
            organization_name: (organization as any).name || 'Organization',
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
