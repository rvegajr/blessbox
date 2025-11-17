import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/authOptions';
import { ClassService } from '@/lib/services/ClassService';
import { EmailService } from '@/lib/services/EmailService';
import { getOrganizationByEmail } from '@/lib/subscriptions';

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

    const { participant_id, class_id, session_id, notes } = await req.json();

    if (!participant_id || !class_id) {
      return NextResponse.json({ error: 'Participant ID and Class ID are required' }, { status: 400 });
    }

    const classService = new ClassService();
    const emailService = new EmailService();

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
    const classDetails = await classService.getClass(class_id);
    const sessionDetails = session_id ? await classService.getSession(session_id) : null;

    if (participant && classDetails) {
      // Send invitation email
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
          confirmation_link: `${process.env.NEXTAUTH_URL}/enrollments/${enrollment.id}/confirm`
        }
      );
    }

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error) {
    console.error('Error creating enrollment:', error);
    return NextResponse.json({ error: 'Failed to create enrollment' }, { status: 500 });
  }
}
