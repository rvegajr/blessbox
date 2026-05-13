import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from '@/lib/auth-helper';
import {
  createSubscription,
  getActiveSubscription,
  resolveOrganizationForSession,
  type PlanType,
  type BillingCycle,
} from '@/lib/subscriptions';
import { isValidPlan } from '@/lib/pricing/plans';
import { parseBody } from '@/lib/api/validate';

const Schema = z.object({
  planType: z.string().min(1).optional().default('single-org'),
  billingCycle: z.enum(['monthly', 'yearly', 'annual']).optional(),
  amountCents: z.number().int().min(0).optional(),
});

/**
 * POST /api/payment/activate-subscription
 *
 * Called from /checkout/success after Square redirects back.
 * Creates a BlessBox subscription record for the org.
 * Idempotent — returns success if org already has an active subscription.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return json({ success: false, error: 'Authentication required' }, 401);
  }

  const parsed = await parseBody(req, Schema);
  if ('error' in parsed) return parsed.error;
  const body = parsed.data;

  const planTypeRaw = body.planType ?? 'single-org';
  const billingCycle: BillingCycle = body.billingCycle === 'yearly' || body.billingCycle === 'annual' ? 'yearly' : 'monthly';

  if (!isValidPlan(planTypeRaw)) {
    return json({ success: false, error: 'Invalid planType' }, 400);
  }
  const planType = planTypeRaw as PlanType;

  let org;
  try {
    org = await resolveOrganizationForSession(session as any);
  } catch {
    return json({ success: false, error: 'Failed to resolve organization' }, 500);
  }
  if (!org) {
    return json({ success: false, error: 'Organization selection required' }, 409);
  }

  // Idempotency check — don't double-activate
  const existing = await getActiveSubscription(org.id);
  if (existing) {
    return json({ success: true, subscription: existing, alreadyActive: true }, 200);
  }

  const amountCents = body.amountCents ?? 999; // default $9.99 for single-org

  const sub = await createSubscription({
    organizationId: org.id,
    planType,
    billingCycle,
    currency: 'USD',
    amountCents,
  });

  return json({ success: true, subscription: sub }, 201);
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
