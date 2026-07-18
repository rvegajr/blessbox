/**
 * SubscriptionProvisioner — the single server-verified path to an active paid
 * subscription. Depends on IOrderVerifier (ISP) and refuses to write status
 * 'active' unless the order is verified PAID with an amount and plan that match
 * the server-side price. The paid amount is taken from the VERIFIED order, never
 * from the client. Both the Noctusoft webhook and /api/payment/activate-subscription
 * funnel through this one unit.
 */

import type { IOrderVerifier } from '@/lib/interfaces/IOrderVerifier';
import {
  createSubscription as defaultCreateSubscription,
  getActiveSubscription as defaultGetActiveSubscription,
  getSubscriptionByExternalId as defaultGetSubscriptionByExternalId,
  type PlanType,
  type BillingCycle,
} from '@/lib/subscriptions';
import { getPlanPriceCents as defaultGetPlanPriceCents } from '@/lib/pricing/plans';
import { PlanUpgrade } from '@/lib/services/PlanUpgrade';

export type ProvisionCode =
  | 'CREATED'
  | 'UPGRADED'
  | 'ALREADY_ACTIVE'
  | 'ORDER_NOT_PAID'
  | 'ORDER_ALREADY_CONSUMED'
  | 'AMOUNT_MISMATCH'
  | 'PLAN_MISMATCH'
  | 'UPGRADE_FAILED';

export interface ProvisionResult {
  ok: boolean;
  code: ProvisionCode;
  subscription?: unknown;
  error?: string;
}

export interface ProvisionInput {
  orgId: string;
  orderId: string;
  planType: PlanType;
  billingCycle: BillingCycle;
}

export interface ProvisionerDeps {
  createSubscription: typeof defaultCreateSubscription;
  getActiveSubscription: typeof defaultGetActiveSubscription;
  getSubscriptionByExternalId: typeof defaultGetSubscriptionByExternalId;
  getPlanPriceCents: typeof defaultGetPlanPriceCents;
  executeUpgrade: (orgId: string, planType: PlanType) => Promise<{ success: boolean; error?: string }>;
}

export class SubscriptionProvisioner {
  private readonly deps: ProvisionerDeps;

  constructor(
    private readonly verifier: IOrderVerifier,
    deps?: Partial<ProvisionerDeps>,
  ) {
    this.deps = {
      createSubscription: deps?.createSubscription ?? defaultCreateSubscription,
      getActiveSubscription: deps?.getActiveSubscription ?? defaultGetActiveSubscription,
      getSubscriptionByExternalId: deps?.getSubscriptionByExternalId ?? defaultGetSubscriptionByExternalId,
      getPlanPriceCents: deps?.getPlanPriceCents ?? defaultGetPlanPriceCents,
      executeUpgrade: deps?.executeUpgrade ?? ((orgId, planType) => new PlanUpgrade().executeUpgrade(orgId, planType)),
    };
  }

  async provisionFromOrder(input: ProvisionInput): Promise<ProvisionResult> {
    const { orgId, orderId, planType, billingCycle } = input;

    const verified = await this.verifier.verifyOrder(orderId);
    if (!verified || verified.status !== 'PAID') {
      return { ok: false, code: 'ORDER_NOT_PAID' };
    }

    // Amount must match server-authoritative pricing (binds plan↔price, blocking
    // a cheap order from provisioning an expensive plan).
    const expected = this.deps.getPlanPriceCents(planType, billingCycle);
    if (verified.amountCents !== expected) {
      return { ok: false, code: 'AMOUNT_MISMATCH' };
    }
    if (verified.planType !== planType) {
      return { ok: false, code: 'PLAN_MISMATCH' };
    }

    // One order provisions AT MOST ONE org. If this order was already consumed,
    // only the original org may (idempotently) re-activate it — any other org is
    // rejected. This blocks a single paid order from provisioning paid tiers on
    // arbitrarily many organizations.
    const consumed = await this.deps.getSubscriptionByExternalId(orderId);
    if (consumed) {
      const consumedOrg = (consumed as { organization_id?: string }).organization_id;
      if (consumedOrg && consumedOrg !== orgId) {
        return { ok: false, code: 'ORDER_ALREADY_CONSUMED' };
      }
      return { ok: true, code: 'ALREADY_ACTIVE', subscription: consumed };
    }

    const existing = await this.deps.getActiveSubscription(orgId);
    if (existing) {
      if ((existing as { plan_type?: string }).plan_type === planType) {
        return { ok: true, code: 'ALREADY_ACTIVE', subscription: existing };
      }
      const up = await this.deps.executeUpgrade(orgId, planType);
      if (!up.success) {
        return { ok: false, code: 'UPGRADE_FAILED', error: up.error };
      }
      const updated = await this.deps.getActiveSubscription(orgId);
      return { ok: true, code: 'UPGRADED', subscription: updated };
    }

    const sub = await this.deps.createSubscription({
      organizationId: orgId,
      planType,
      billingCycle,
      currency: verified.currency || 'USD',
      amountCents: verified.amountCents,
      externalSubscriptionId: orderId,
    });
    return { ok: true, code: 'CREATED', subscription: sub };
  }
}
