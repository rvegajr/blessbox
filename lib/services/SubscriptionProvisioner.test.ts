import { describe, it, expect, vi } from 'vitest';
import { SubscriptionProvisioner } from './SubscriptionProvisioner';
import { InMemoryOrderVerifier } from './__fakes__/InMemoryOrderVerifier';
import type { VerifiedOrder } from '@/lib/interfaces/IOrderVerifier';

const SINGLE_ORG_PRICE = 999; // getPlanPriceCents('single-org','monthly')

function paidOrder(over: Partial<VerifiedOrder> = {}): VerifiedOrder {
  return { orderId: 'ord_1', status: 'PAID', amountCents: SINGLE_ORG_PRICE, currency: 'USD', planType: 'single-org', ...over };
}

function makeDeps(over: Record<string, unknown> = {}) {
  const createSubscription = vi.fn(async (p: any) => ({ id: 'sub_new', plan_type: p.planType, external_subscription_id: p.externalSubscriptionId, amount: p.amountCents }));
  const getActiveSubscription = vi.fn(async () => null);
  const getPlanPriceCents = vi.fn(() => SINGLE_ORG_PRICE);
  const executeUpgrade = vi.fn(async () => ({ success: true }));
  return { createSubscription, getActiveSubscription, getPlanPriceCents, executeUpgrade, ...over } as any;
}

const input = { orgId: 'org_1', orderId: 'ord_1', planType: 'single-org' as const, billingCycle: 'monthly' as const };

describe('SubscriptionProvisioner.provisionFromOrder', () => {
  it('refuses to provision when the order is not PAID and never writes a subscription', async () => {
    const deps = makeDeps();
    const verifier = new InMemoryOrderVerifier().seed(paidOrder({ status: 'PENDING' }));
    const res = await new SubscriptionProvisioner(verifier, deps).provisionFromOrder(input);
    expect(res.ok).toBe(false);
    expect(res.code).toBe('ORDER_NOT_PAID');
    expect(deps.createSubscription).not.toHaveBeenCalled();
  });

  it('refuses when the order is unknown (verifier returns null)', async () => {
    const deps = makeDeps();
    const verifier = new InMemoryOrderVerifier(); // nothing seeded
    const res = await new SubscriptionProvisioner(verifier, deps).provisionFromOrder(input);
    expect(res.ok).toBe(false);
    expect(res.code).toBe('ORDER_NOT_PAID');
    expect(deps.createSubscription).not.toHaveBeenCalled();
  });

  it('refuses when the paid amount does not match the server-side plan price', async () => {
    const deps = makeDeps();
    const verifier = new InMemoryOrderVerifier().seed(paidOrder({ amountCents: 1 }));
    const res = await new SubscriptionProvisioner(verifier, deps).provisionFromOrder(input);
    expect(res.ok).toBe(false);
    expect(res.code).toBe('AMOUNT_MISMATCH');
    expect(deps.createSubscription).not.toHaveBeenCalled();
  });

  it('refuses when the order plan does not match the requested plan', async () => {
    const deps = makeDeps();
    const verifier = new InMemoryOrderVerifier().seed(paidOrder({ planType: 'enterprise' }));
    const res = await new SubscriptionProvisioner(verifier, deps).provisionFromOrder(input);
    expect(res.ok).toBe(false);
    expect(res.code).toBe('PLAN_MISMATCH');
    expect(deps.createSubscription).not.toHaveBeenCalled();
  });

  it('provisions once for a verified PAID order, deriving amount from the order (not the client)', async () => {
    const deps = makeDeps();
    const verifier = new InMemoryOrderVerifier().seed(paidOrder());
    const res = await new SubscriptionProvisioner(verifier, deps).provisionFromOrder(input);
    expect(res.ok).toBe(true);
    expect(res.code).toBe('CREATED');
    expect(deps.createSubscription).toHaveBeenCalledTimes(1);
    const arg = deps.createSubscription.mock.calls[0][0];
    expect(arg.externalSubscriptionId).toBe('ord_1');
    expect(arg.amountCents).toBe(SINGLE_ORG_PRICE);
  });

  it('is idempotent when an active subscription for the same plan already exists', async () => {
    const deps = makeDeps({ getActiveSubscription: vi.fn(async () => ({ id: 'sub_x', plan_type: 'single-org' })) });
    const verifier = new InMemoryOrderVerifier().seed(paidOrder());
    const res = await new SubscriptionProvisioner(verifier, deps).provisionFromOrder(input);
    expect(res.ok).toBe(true);
    expect(res.code).toBe('ALREADY_ACTIVE');
    expect(deps.createSubscription).not.toHaveBeenCalled();
  });
});
