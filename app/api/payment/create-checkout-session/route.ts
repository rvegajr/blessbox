import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from '@/lib/auth-helper';
import { createSubscription, resolveOrganizationForSession } from '@/lib/subscriptions';
import { getPlanPriceCents, isValidPlan, type PlanType, type BillingCycle } from '@/lib/pricing/plans';
import { CouponService } from '@/lib/coupons';
import { CouponUsageEnforcer } from '@/lib/services/CouponUsageEnforcer';
import { parseBody } from '@/lib/api/validate';
import { rateLimit, rateLimitResponse } from '@/lib/security/rateLimit';
import { createNoctusoftCheckoutSession } from '@/lib/services/NoctusoftCheckoutService';

// Issue #26: Noctusoft proxy currently only has `single-org` configured in
// its Square catalog. Other plans return 422 "No plan variation configured".
// We restrict the catalog path to plans that actually have variations and
// surface a helpful error for the rest so the client can offer a fallback.
const NOCTUSOFT_CATALOG_PLANS = new Set<PlanType>(['single-org']);
// Plans that are valid in the system but cannot use catalog checkout yet.
const NON_CATALOG_PAID_PLANS = new Set<PlanType>(['standard', 'enterprise']);

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

  // Issue #26: only `single-org` is currently configured in the Noctusoft
  // Square catalog. For other paid plans (standard, enterprise) we return
  // 409 with a clear message and a `fallback: 'contact-support'` flag so
  // the client can render a helpful CTA instead of a confusing 502.
  if (!NOCTUSOFT_CATALOG_PLANS.has(planType)) {
    if (NON_CATALOG_PAID_PLANS.has(planType)) {
      return json({
        success: false,
        error: 'Catalog checkout not yet available for this plan',
        message: `The ${planType} plan is not yet wired into our hosted Square catalog. Please apply a coupon, choose the Single-Org plan, or contact support@blessbox.org to upgrade.`,
        fallback: 'contact-support',
      }, 409);
    }
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

  // Re-validate coupon server-side + enforce per-org redemption (Issue #27).
  const originalAmountCents = amountCents;
  let discountAppliedCents = 0;
  const usageEnforcer = new CouponUsageEnforcer();
  if (couponCode) {
    try {
      const couponService = new CouponService();
      const validation = await couponService.validateCoupon(couponCode);
      if (!validation.valid) {
        return json({ success: false, error: validation.error || 'Invalid coupon' }, 400);
      }

      const eligibility = await usageEnforcer.assertEligible(couponCode, org.id);
      if (!eligibility.eligible) {
        return json({ success: false, error: eligibility.reason || 'Coupon not eligible' }, 400);
      }

      const newAmount = await couponService.applyCoupon(couponCode, amountCents, planType);
      discountAppliedCents = amountCents - newAmount;
      amountCents = newAmount;
    } catch (e: any) {
      return json({ success: false, error: e?.message || 'Coupon application failed' }, 400);
    }
  }

  // 100%-off coupon: create subscription directly, no Square redirect.
  // Issue #27: also record redemption so the same org can't reuse the coupon.
  if (amountCents <= 0) {
    const sub = await createSubscription({
      organizationId: org.id,
      planType,
      billingCycle,
      currency: 'USD',
      amountCents: 0,
    });
    if (couponCode) {
      try {
        await usageEnforcer.recordRedemption({
          code: couponCode,
          userId: session.user.id || session.user.email,
          organizationId: org.id,
          subscriptionId: sub.id,
          originalAmountCents,
          discountAppliedCents,
        });
      } catch (recErr) {
        console.error('[create-checkout-session] Failed to record coupon redemption:', recErr);
      }
    }
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
