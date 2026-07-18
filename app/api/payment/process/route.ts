import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from '@/lib/auth-helper';
import { createSubscription, resolveOrganizationForSession, getActiveSubscription } from '@/lib/subscriptions';
import { SquarePaymentService } from '@/lib/services/SquarePaymentService';
import { getPlanPriceCents, isValidPlan, type PlanType, type BillingCycle } from '@/lib/pricing/plans';
import { CouponService } from '@/lib/coupons';
import { CouponUsageEnforcer } from '@/lib/services/CouponUsageEnforcer';
import { PlanUpgrade } from '@/lib/services/PlanUpgrade';
import { parseBody } from '@/lib/api/validate';
import { rateLimit, rateLimitResponse } from '@/lib/security/rateLimit';
import { getEnv, getEnvBoolean } from '@/lib/utils/env';
import { createHash } from 'crypto';

// NOTE: We deliberately do NOT include `amount` in the schema — pricing is
// always derived server-side from `planType` + `billingCycle`. Including it
// in the schema would imply the client could influence price (it cannot).
// `paymentToken` and `nonce` are both accepted for backwards-compat — same
// thing semantically (Square Web SDK calls it `nonce`/`token`).
const PaymentProcessSchema = z.object({
  planType: z.string().min(1).optional().default('standard'),
  billingCycle: z.enum(['monthly', 'yearly', 'annual']).optional(),
  currency: z.string().min(1).max(10).optional(),
  paymentToken: z.string().min(1).optional(),
  nonce: z.string().min(1).optional(),
  couponCode: z.string().max(50).optional(),
  // Optional client-generated stable id for one checkout attempt. Lets a retry
  // (double-click, re-tokenization) resolve to the SAME Square idempotency key
  // so the customer is never charged twice.
  purchaseNonce: z.string().min(1).max(100).optional(),
});

/**
 * POST /api/payment/process
 *
 * SECURITY:
 *   - Authenticated session REQUIRED. No body-email fallback (would allow
 *     attacker to provision an Enterprise org for any email).
 *   - Amount is ALWAYS derived server-side from `planType` (+ billingCycle)
 *     via `getPlanPriceCents()`. Any client-supplied `amount` is IGNORED.
 *   - Coupons are re-validated server-side via `CouponService`. The client
 *     cannot fake a discounted amount.
 *   - This route is the ONLY path that mutates the subscription tier after
 *     a successful charge.
 */
export async function POST(req: NextRequest) {
  // Per-IP rate limit: 10/min — payment is expensive and a brute-force vector for stolen cards
  const ipLimit = rateLimit(req, { key: 'payment/process:ip', limit: 10, windowMs: 60_000 });
  if (!ipLimit.allowed) return rateLimitResponse(ipLimit.retryAfterSec);

  const session = await getServerSession();
  if (!session?.user?.email) {
    return json({ success: false, error: 'Authentication required' }, 401);
  }

  // Per-session rate limit: 30/hr — bounds total charge attempts on one account
  const sessionLimit = rateLimit(req, {
    key: 'payment/process:session',
    identifier: session.user.email,
    limit: 30,
    windowMs: 60 * 60_000,
  });
  if (!sessionLimit.allowed) return rateLimitResponse(sessionLimit.retryAfterSec);

  const parsed = await parseBody(req, PaymentProcessSchema);
  if ('error' in parsed) return parsed.error;
  const body = parsed.data;
  const planTypeRaw = body.planType ?? 'standard';
  const billingCycle: BillingCycle = body.billingCycle === 'yearly' || body.billingCycle === 'annual' ? 'yearly' : 'monthly';
  const currency: string = body.currency ?? 'USD';
  const paymentToken: string | undefined = body.paymentToken ?? body.nonce;
  const couponCode: string | undefined = body.couponCode && body.couponCode.trim() ? body.couponCode.trim() : undefined;

  if (!isValidPlan(planTypeRaw)) {
    return json({ success: false, error: 'Invalid planType' }, 400);
  }
  const planType = planTypeRaw as PlanType;

  // Resolve organization strictly from session — NO email fallback.
  let org;
  try {
    org = await resolveOrganizationForSession(session as any);
  } catch (orgError) {
    console.error('Organization resolution error:', orgError);
    return json({
      success: false,
      error: 'Failed to resolve organization',
      message: 'Please ensure you have selected an organization or try logging in again.',
    }, 500);
  }

  if (!org) {
    return json({
      success: false,
      error: 'Organization selection required',
      message: 'Please select an organization from your dashboard before proceeding with payment.',
    }, 409);
  }

  // ----- Server-authoritative price computation -----
  let amountCents: number;
  try {
    amountCents = getPlanPriceCents(planType, billingCycle);
  } catch (e) {
    return json({ success: false, error: 'Invalid plan pricing' }, 400);
  }

  // Re-validate coupon server-side. NEVER trust client-discounted amount.
  // Issue #27: also enforce per-org redemption uniqueness so a 100% coupon
  // can't be reused by the same org to upgrade for free repeatedly.
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

      // Per-org eligibility gate (Issue #27): block re-redemption.
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

  // Free plans skip Square entirely.
  const isFree = amountCents <= 0 || planType === 'free';

  // Stable idempotency key for this charge intent. Derived from a client-supplied
  // purchaseNonce when present, else the single-use payment token — so a retry of
  // the SAME intended charge maps to the SAME Square idempotency key and cannot
  // double-charge. Real Square payment id (below) is persisted for reconciliation
  // and, via the UNIQUE external_subscription_id index, blocks a double grant.
  const idemSeed = body.purchaseNonce?.trim() || paymentToken || '';
  const chargeIdempotencyKey = idemSeed
    ? createHash('sha256').update(`${org.id}|${planType}|${billingCycle}|${idemSeed}`).digest('hex')
    : undefined;
  let squarePaymentId: string | undefined;

  if (!isFree) {
    if (!paymentToken) {
      return json({ success: false, error: 'paymentToken required for paid plan' }, 400);
    }

    const forceRealSquare = getEnvBoolean('FORCE_REAL_SQUARE');
    const shouldMockPayment = !forceRealSquare && (
      process.env.NODE_ENV !== 'production' &&
      (getEnv('TEST_ENV') === 'local' || !getEnv('NOCTUSOFT_DEPLOY_KEY'))
    );

    try {
      if (!shouldMockPayment) {
        // Charges go through the Noctusoft gateway — the only required server
        // credential is the gateway deploy key (no direct SQUARE_ACCESS_TOKEN).
        if (!getEnv('NOCTUSOFT_DEPLOY_KEY')) {
          console.error('[PAYMENT] Missing Noctusoft gateway configuration');
          return json({
            success: false,
            error: 'Payment provider not configured',
            message: 'The Noctusoft payment gateway is not configured on the server.',
          }, 500);
        }

        const squarePaymentService = new SquarePaymentService();
        const paymentResult = await squarePaymentService.processPayment(
          paymentToken,
          amountCents,
          currency || 'USD',
          org.id,
          chargeIdempotencyKey,
        );

        if (!paymentResult.success) {
          const errorMessage = paymentResult.error || 'Payment failed';
          const isAuthError = errorMessage.includes('401') || errorMessage.includes('authorization');
          return json({
            success: false,
            error: isAuthError
              ? 'Payment authorization failed. Please contact support.'
              : errorMessage,
            payment: paymentResult,
          }, isAuthError ? 500 : 400);
        }

        // Persist the real Square payment id for reconciliation + duplicate-grant
        // protection (UNIQUE external_subscription_id).
        squarePaymentId = paymentResult.paymentId || (paymentResult as { squarePaymentId?: string }).squarePaymentId;
      } else {
        console.log(`[PAYMENT] [mock-payment] org=${org.id}, plan=${planType}, amount=${amountCents} ${currency}`);
      }
    } catch (error) {
      console.error('[PAYMENT] Square payment processing error:', error);
      return json({
        success: false,
        error: 'Payment processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }, 500);
    }
  }

  // P0 Fix: Check for existing subscription and execute upgrade if needed
  const existing = await getActiveSubscription(org.id);
  
  if (existing) {
    // Existing subscription — execute upgrade (or re-provision same plan)
    const existingPlan = existing.plan_type as PlanType;
    
    if (existingPlan === planType) {
      // Same plan, idempotent — return existing
      return json({
        success: true,
        subscription: existing,
        chargedAmountCents: amountCents,
        alreadyActive: true,
        ...(paymentToken && { transactionId: squarePaymentId ?? 'square-tx-' + Date.now() }),
      }, 200);
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

    // Issue #27: record coupon redemption AFTER successful upgrade so
    // current_uses bumps and the same org cannot redeem this coupon again.
    if (couponCode && updated) {
      try {
        await usageEnforcer.recordRedemption({
          code: couponCode,
          userId: session.user.id || session.user.email,
          organizationId: org.id,
          subscriptionId: updated.id,
          originalAmountCents,
          discountAppliedCents,
        });
      } catch (recErr) {
        console.error('[PAYMENT] Failed to record coupon redemption:', recErr);
      }
    }

    return json({
      success: true,
      subscription: updated,
      chargedAmountCents: amountCents,
      upgraded: true,
      ...(paymentToken && { transactionId: squarePaymentId ?? 'square-tx-' + Date.now() }),
    }, 200);
  }

  // No existing subscription — create new one
  const sub = await createSubscription({
    organizationId: org.id,
    planType,
    billingCycle,
    currency,
    amountCents,
    externalSubscriptionId: squarePaymentId,
  });

  // Issue #27: record coupon redemption for fresh subscription path too.
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
      console.error('[PAYMENT] Failed to record coupon redemption:', recErr);
    }
  }

  return json({
    success: true,
    subscription: sub,
    chargedAmountCents: amountCents,
    ...(paymentToken && { transactionId: 'square-tx-' + Date.now() }),
  }, 200);
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
