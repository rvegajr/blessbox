import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from '@/lib/auth-helper';
import { createSubscription, resolveOrganizationForSession } from '@/lib/subscriptions';
import { getPlanPriceCents, isValidPlan, type PlanType, type BillingCycle } from '@/lib/pricing/plans';
import { CouponService } from '@/lib/coupons';
import { parseBody } from '@/lib/api/validate';
import { rateLimit, rateLimitResponse } from '@/lib/security/rateLimit';
import { createNoctusoftCheckoutSession } from '@/lib/services/NoctusoftCheckoutService';

const NOCTUSOFT_PLANS = new Set<PlanType>(['single-org', 'standard', 'enterprise']);

const Schema = z.object({
  planType: z.string().min(1),
  billingCycle: z.enum(['monthly', 'yearly', 'annual']).optional(),
  couponCode: z.string().max(50).optional(),
  email: z.string().email().optional(),
});

/**
 * POST /api/payment/create-checkout-session
 *
 * Creates a Noctusoft/Square hosted checkout session for catalog-based plans
 * (currently "single-org"). Returns { checkoutUrl } for the client to redirect to.
 *
 * If a 100%-off coupon reduces the amount to $0, the subscription is created
 * directly (no Square redirect needed) and { success: true, redirect: '/dashboard' }
 * is returned instead.
 */
export async function POST(req: NextRequest) {
  const ipLimit = rateLimit(req, { key: 'payment/checkout-session:ip', limit: 10, windowMs: 60_000 });
  if (!ipLimit.allowed) return rateLimitResponse(ipLimit.retryAfterSec);

  const session = await getServerSession();
  if (!session?.user?.email) {
    return json({ success: false, error: 'Authentication required' }, 401);
  }

  const parsed = await parseBody(req, Schema);
  if ('error' in parsed) return parsed.error;
  const body = parsed.data;

  const planTypeRaw = body.planType;
  const billingCycle: BillingCycle = body.billingCycle === 'yearly' || body.billingCycle === 'annual' ? 'yearly' : 'monthly';
  const couponCode = body.couponCode?.trim() || undefined;
  const email = body.email || session.user.email;

  if (!isValidPlan(planTypeRaw)) {
    return json({ success: false, error: 'Invalid planType' }, 400);
  }
  const planType = planTypeRaw as PlanType;

  if (!NOCTUSOFT_PLANS.has(planType)) {
    return json({ success: false, error: `Plan "${planType}" does not use catalog checkout` }, 400);
  }

  let org;
  try {
    org = await resolveOrganizationForSession(session as any);
  } catch {
    return json({ success: false, error: 'Failed to resolve organization' }, 500);
  }
  if (!org) {
    return json({ success: false, error: 'Organization selection required' }, 409);
  }

  // Server-authoritative price
  let amountCents: number;
  try {
    amountCents = getPlanPriceCents(planType, billingCycle);
  } catch {
    return json({ success: false, error: 'Invalid plan pricing' }, 400);
  }

  // Re-validate coupon server-side
  if (couponCode) {
    try {
      const couponService = new CouponService();
      const validation = await couponService.validateCoupon(couponCode);
      if (!validation.valid) {
        return json({ success: false, error: validation.error || 'Invalid coupon' }, 400);
      }
      amountCents = await couponService.applyCoupon(couponCode, amountCents, planType);
    } catch (e: any) {
      return json({ success: false, error: e?.message || 'Coupon application failed' }, 400);
    }
  }

  // 100%-off coupon: create subscription directly, no Square redirect
  if (amountCents <= 0) {
    const sub = await createSubscription({
      organizationId: org.id,
      planType,
      billingCycle,
      currency: 'USD',
      amountCents: 0,
    });
    return json({ success: true, redirect: '/dashboard', subscription: sub }, 200);
  }

  // Build redirect URL — Square will redirect here after the customer pays
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://blessbox.org';
  const successParams = new URLSearchParams({
    plan: planType,
    cycle: billingCycle,
    amount: String(amountCents),
  });
  const redirectUrl = `${appUrl}/checkout/success?${successParams}`;

  try {
    // P0 Fix: Pass stable sessionId for idempotency
    // Use user ID as session identifier to prevent duplicate charges on retry
    const sessionId = session.user?.id || 'anonymous';
    
    const { checkoutUrl, orderId } = await createNoctusoftCheckoutSession({
      plan: planType,
      userId: org.id,
      email,
      redirectUrl,
      sessionId,
    });
    // Return orderId to client — stored in sessionStorage before redirect to Square
    return json({ success: true, checkoutUrl, orderId }, 200);
  } catch (err: any) {
    console.error('[create-checkout-session] Noctusoft error:', err);
    return json({ success: false, error: 'Failed to create checkout session', message: err?.message }, 502);
  }
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
