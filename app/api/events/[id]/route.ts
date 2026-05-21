import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';
import { EventService } from '@/lib/services/EventService';
import { QRCodeService } from '@/lib/services/QRCodeService';
import { FormConfigService } from '@/lib/services/FormConfigService';
import { EventTypeService } from '@/lib/services/EventTypeService';
import { z } from 'zod';

const UpdateEventSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/events/[id]
 * Get a single event by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    // Initialize services
    const qrCodeService = new QRCodeService();
    const formConfigService = new FormConfigService();
    const eventTypeService = new EventTypeService();
    const eventService = new EventService(
      qrCodeService,
      formConfigService,
      eventTypeService
    );

    const event = await eventService.getEvent(id);

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ event }, { status: 200 });
  } catch (error) {
    const { id } = await context.params;
    console.error(`GET /api/events/${id} error:`, error);
    return NextResponse.json(
      { error: 'Failed to get event' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/events/[id]
 * Update an event's metadata
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const validation = UpdateEventSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const updates = validation.data;

    // Initialize services
    const qrCodeService = new QRCodeService();
    const formConfigService = new FormConfigService();
    const eventTypeService = new EventTypeService();
    const eventService = new EventService(
      qrCodeService,
      formConfigService,
      eventTypeService
    );

    const event = await eventService.updateEvent(id, updates);

    return NextResponse.json({ event }, { status: 200 });
  } catch (error) {
    const { id } = await context.params;
    console.error(`PATCH /api/events/${id} error:`, error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/events/[id]
 * Soft-delete an event (sets isActive to false)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    // Initialize services
    const qrCodeService = new QRCodeService();
    const formConfigService = new FormConfigService();
    const eventTypeService = new EventTypeService();
    const eventService = new EventService(
      qrCodeService,
      formConfigService,
      eventTypeService
    );

    await eventService.deleteEvent(id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const { id } = await context.params;
    console.error(`DELETE /api/events/${id} error:`, error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}
