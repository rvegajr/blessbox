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
  getConsumedOrder as defaultGetConsumedOrder,
  recordConsumedOrder as defaultRecordConsumedOrder,
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
  getConsumedOrder: typeof defaultGetConsumedOrder;
  recordConsumedOrder: typeof defaultRecordConsumedOrder;
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
      getConsumedOrder: deps?.getConsumedOrder ?? defaultGetConsumedOrder,
      recordConsumedOrder: deps?.recordConsumedOrder ?? defaultRecordConsumedOrder,
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

    // One order provisions AT MOST ONE org, across ALL grant paths (create,
    // upgrade, same-plan). A consumed-orders ledger keyed by order_id is the
    // authoritative guard — external_subscription_id alone missed the upgrade
    // path (PlanUpgrade never wrote it), letting one order upgrade many orgs.
    const prior = await this.deps.getConsumedOrder(orderId);
    if (prior) {
      if (prior.organization_id !== orgId) {
        return { ok: false, code: 'ORDER_ALREADY_CONSUMED' };
      }
      // Same org re-activating the same order — idempotent.
      const current = await this.deps.getActiveSubscription(orgId);
      return { ok: true, code: 'ALREADY_ACTIVE', subscription: current ?? undefined };
    }

    const existing = await this.deps.getActiveSubscription(orgId);
    let result: ProvisionResult;
    if (existing) {
      if ((existing as { plan_type?: string }).plan_type === planType) {
        result = { ok: true, code: 'ALREADY_ACTIVE', subscription: existing };
      } else {
        const up = await this.deps.executeUpgrade(orgId, planType);
        if (!up.success) {
          return { ok: false, code: 'UPGRADE_FAILED', error: up.error };
        }
        const updated = await this.deps.getActiveSubscription(orgId);
        result = { ok: true, code: 'UPGRADED', subscription: updated };
      }
    } else {
      const sub = await this.deps.createSubscription({
        organizationId: orgId,
        planType,
        billingCycle,
        currency: verified.currency || 'USD',
        amountCents: verified.amountCents,
        externalSubscriptionId: orderId,
      });
      result = { ok: true, code: 'CREATED', subscription: sub };
    }

    // Record consumption for EVERY successful path so this order can never be
    // reused by any org. The order_id PRIMARY KEY also closes the concurrent
    // double-consume race: a second writer throws and we report ALREADY_CONSUMED.
    try {
      const subscriptionId = (result.subscription as { id?: string } | undefined)?.id;
      await this.deps.recordConsumedOrder({
        orderId,
        organizationId: orgId,
        subscriptionId,
        planType,
        amountCents: verified.amountCents,
      });
    } catch {
      return { ok: false, code: 'ORDER_ALREADY_CONSUMED' };
    }
    return result;
  }
}
