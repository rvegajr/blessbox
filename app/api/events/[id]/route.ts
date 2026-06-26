import { NextResponse } from 'next/server';
import { withAuthAndOrg, assertOwnership } from '@/lib/api/withAuth';
import { EventService } from '@/lib/services/EventService';
import { QRCodeService } from '@/lib/services/QRCodeService';
import { FormConfigService } from '@/lib/services/FormConfigService';
import { EventTypeService } from '@/lib/services/EventTypeService';
import { z } from 'zod';

type Ctx = { params: Promise<{ id: string }> };

const UpdateEventSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  isActive: z.boolean().optional(),
});

function makeEventService(): EventService {
  return new EventService(new QRCodeService(), new FormConfigService(), new EventTypeService());
}

/**
 * GET /api/events/[id] — fetch a single event the caller's org owns.
 * Ownership + existence collapse into a single 404 (no cross-tenant oracle).
 */
export const GET = withAuthAndOrg(async (_request, auth, context) => {
  const { id } = await (context as Ctx).params;
  try {
    const event = await makeEventService().getEvent(id);
    const guard = await assertOwnership(auth, event?.organizationId ?? null);
    if (!guard.ok) return guard.response;
    return NextResponse.json({ event }, { status: 200 });
  } catch (error) {
    console.error(`GET /api/events/${id} error:`, error);
    return NextResponse.json({ error: 'Failed to get event' }, { status: 500 });
  }
});

/**
 * PATCH /api/events/[id] — update metadata of an event the caller's org owns.
 */
export const PATCH = withAuthAndOrg(async (request, auth, context) => {
  const { id } = await (context as Ctx).params;
  try {
    const body = await request.json();
    const validation = UpdateEventSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.error.errors }, { status: 400 });
    }

    const svc = makeEventService();
    const existing = await svc.getEvent(id);
    const guard = await assertOwnership(auth, existing?.organizationId ?? null);
    if (!guard.ok) return guard.response;

    const event = await svc.updateEvent(id, validation.data);
    return NextResponse.json({ event }, { status: 200 });
  } catch (error) {
    console.error(`PATCH /api/events/${id} error:`, error);
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
});

/**
 * DELETE /api/events/[id] — soft-delete an event the caller's org owns.
 */
export const DELETE = withAuthAndOrg(async (_request, auth, context) => {
  const { id } = await (context as Ctx).params;
  try {
    const svc = makeEventService();
    const existing = await svc.getEvent(id);
    const guard = await assertOwnership(auth, existing?.organizationId ?? null);
    if (!guard.ok) return guard.response;

    await svc.deleteEvent(id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(`DELETE /api/events/${id} error:`, error);
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
});
