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
import { isValidPlan, getPlanPriceCents } from '@/lib/pricing/plans';
import { parseBody } from '@/lib/api/validate';
import { PlanUpgrade } from '@/lib/services/PlanUpgrade';

const Schema = z.object({
  planType: z.string().min(1).optional().default('single-org'),
  billingCycle: z.enum(['monthly', 'yearly', 'annual']).optional(),
  amountCents: z.number().int().min(0).optional(),
  orderId: z.string().optional(), // Square order ID from Noctusoft checkout
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

  // P0 Fix: Check for existing subscription and execute upgrade if needed
  const existing = await getActiveSubscription(org.id);
  const amountCents = body.amountCents ?? getPlanPriceCents(planType, billingCycle);

  if (existing) {
    // Existing subscription — execute upgrade (or re-provision same plan idempotently)
    const existingPlan = existing.plan_type as PlanType;
    
    if (existingPlan === planType) {
      // Same plan, idempotent — return existing
      return json({ success: true, subscription: existing, alreadyActive: true }, 200);
    }
    
    // Different plan — execute upgrade
    const planUpgrade = new PlanUpgrade();
    const upgradeResult = await planUpgrade.executeUpgrade(org.id, planType);
    
    if (!upgradeResult.success) {
      return json({ 
        success: false, 
        error: upgradeResult.error || 'Upgrade failed' 
      }, 400);
    }
    
    // Fetch updated subscription
    const updated = await getActiveSubscription(org.id);
    return json({ success: true, subscription: updated, upgraded: true }, 200);
  }

  // No existing subscription — create new one
  const sub = await createSubscription({
    organizationId: org.id,
    planType,
    billingCycle,
    currency: 'USD',
    amountCents,
    externalSubscriptionId: body.orderId,
  });

  return json({ success: true, subscription: sub }, 201);
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
