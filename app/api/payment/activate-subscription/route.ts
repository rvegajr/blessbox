import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from '@/lib/auth-helper';
import { resolveOrganizationForSession, type PlanType, type BillingCycle } from '@/lib/subscriptions';
import { isValidPlan } from '@/lib/pricing/plans';
import { parseBody } from '@/lib/api/validate';
import { SubscriptionProvisioner } from '@/lib/services/SubscriptionProvisioner';
import { NoctusoftOrderVerifier } from '@/lib/services/NoctusoftOrderVerifier';

const Schema = z.object({
  planType: z.string().min(1).optional().default('single-org'),
  billingCycle: z.enum(['monthly', 'yearly', 'annual']).optional(),
  amountCents: z.number().int().min(0).optional(), // accepted but IGNORED — never trusted
  orderId: z.string().min(1, 'orderId is required'),
});

/**
 * POST /api/payment/activate-subscription
 *
 * Called from /checkout/success after the Noctusoft/Square hosted checkout
 * redirects back. Provisions ONLY after server-side verification that the order
 * was actually PAID (via the gateway) for the correct plan + amount. The client
 * supplies orderId; amount/plan are derived from the verified order, never the
 * request body.
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

  const provisioner = new SubscriptionProvisioner(new NoctusoftOrderVerifier());
  const result = await provisioner.provisionFromOrder({
    orgId: org.id,
    orderId: body.orderId,
    planType,
    billingCycle,
  });

  if (!result.ok) {
    // Bad request data (plan/amount don't match the verified order) → 400;
    // order simply not paid yet / upgrade failure → 402.
    const status = result.code === 'AMOUNT_MISMATCH' || result.code === 'PLAN_MISMATCH' ? 400 : 402;
    return json({ success: false, error: result.code, message: result.error }, status);
  }

  return json(
    { success: true, subscription: result.subscription, code: result.code },
    result.code === 'CREATED' ? 201 : 200,
  );
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
