import { NextResponse } from 'next/server';
import { withAuthAndOrg } from '@/lib/api/withAuth';
import { EventService } from '@/lib/services/EventService';
import { QRCodeService } from '@/lib/services/QRCodeService';
import { FormConfigService } from '@/lib/services/FormConfigService';
import { EventTypeService } from '@/lib/services/EventTypeService';
import { z } from 'zod';
import type { EventType } from '@/lib/interfaces/IEventTypeService';

// organizationId is intentionally NOT accepted from the client — the active org
// is derived from the session (withAuthAndOrg). Previously a client-supplied
// organizationId allowed cross-tenant create (IDOR).
const CreateEventSchema = z.object({
  name: z.string().min(1).max(255),
  eventType: z.enum(['food_distribution', 'seminar', 'volunteer', 'custom']),
  description: z.string().max(1000).optional(),
  formFields: z.array(z.object({
    id: z.string(),
    type: z.enum(['text', 'email', 'phone', 'select', 'textarea', 'checkbox', 'number', 'date']),
    label: z.string(),
    placeholder: z.string().optional(),
    required: z.boolean(),
    options: z.array(z.string()).optional(),
    validation: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional(),
      minLength: z.number().optional(),
      maxLength: z.number().optional(),
    }).optional(),
    order: z.number(),
  })).optional(),
});

function makeEventService(): EventService {
  return new EventService(new QRCodeService(), new FormConfigService(), new EventTypeService());
}

/**
 * GET /api/events — list events for the authenticated user's active organization.
 */
export const GET = withAuthAndOrg(async (_request, { organization }) => {
  try {
    const events = await makeEventService().listEvents(organization.id);
    return NextResponse.json({ events }, { status: 200 });
  } catch (error) {
    console.error('GET /api/events error:', error);
    return NextResponse.json({ error: 'Failed to list events' }, { status: 500 });
  }
});

/**
 * POST /api/events — create an event in the caller's active organization.
 */
export const POST = withAuthAndOrg(async (request, { organization }) => {
  try {
    const body = await request.json();
    const validation = CreateEventSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }
    const data = validation.data;

    const event = await makeEventService().createEvent({
      organizationId: organization.id,
      name: data.name,
      eventType: data.eventType as EventType,
      description: data.description,
      formFields: data.formFields,
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('POST /api/events error:', error);
    if (error instanceof Error) {
      if (error.message.includes('Organization not found')) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }
      if (error.message.includes('Validation failed')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
});
