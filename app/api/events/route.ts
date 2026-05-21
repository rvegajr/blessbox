import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';
import { EventService } from '@/lib/services/EventService';
import { QRCodeService } from '@/lib/services/QRCodeService';
import { FormConfigService } from '@/lib/services/FormConfigService';
import { EventTypeService } from '@/lib/services/EventTypeService';
import { z } from 'zod';
import type { EventType } from '@/lib/interfaces/IEventTypeService';

const CreateEventSchema = z.object({
  organizationId: z.string().uuid(),
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

/**
 * GET /api/events
 * List all events for the authenticated user's active organization
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId query parameter is required' },
        { status: 400 }
      );
    }

    // Initialize services
    const qrCodeService = new QRCodeService();
    const formConfigService = new FormConfigService();
    const eventTypeService = new EventTypeService();
    const eventService = new EventService(
      qrCodeService,
      formConfigService,
      eventTypeService
    );

    const events = await eventService.listEvents(organizationId);

    return NextResponse.json({ events }, { status: 200 });
  } catch (error) {
    console.error('GET /api/events error:', error);
    return NextResponse.json(
      { error: 'Failed to list events' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events
 * Create a new event for an organization
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = CreateEventSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Initialize services
    const qrCodeService = new QRCodeService();
    const formConfigService = new FormConfigService();
    const eventTypeService = new EventTypeService();
    const eventService = new EventService(
      qrCodeService,
      formConfigService,
      eventTypeService
    );

    const event = await eventService.createEvent({
      organizationId: data.organizationId,
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
        return NextResponse.json(
          { error: 'Organization not found' },
          { status: 404 }
        );
      }
      if (error.message.includes('Validation failed')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
