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
  const getConsumedOrder = vi.fn(async () => null);
  const recordConsumedOrder = vi.fn(async () => {});
  const deleteConsumedOrder = vi.fn(async () => {});
  const getPlanPriceCents = vi.fn(() => SINGLE_ORG_PRICE);
  const executeUpgrade = vi.fn(async () => ({ success: true }));
  return { createSubscription, getActiveSubscription, getConsumedOrder, recordConsumedOrder, deleteConsumedOrder, getPlanPriceCents, executeUpgrade, ...over } as any;
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

  it('provisions once for a verified PAID order and records the order as consumed', async () => {
    const deps = makeDeps();
    const verifier = new InMemoryOrderVerifier().seed(paidOrder());
    const res = await new SubscriptionProvisioner(verifier, deps).provisionFromOrder(input);
    expect(res.ok).toBe(true);
    expect(res.code).toBe('CREATED');
    expect(deps.createSubscription).toHaveBeenCalledTimes(1);
    const arg = deps.createSubscription.mock.calls[0][0];
    expect(arg.externalSubscriptionId).toBe('ord_1');
    expect(arg.amountCents).toBe(SINGLE_ORG_PRICE);
    // Ledger records the consumption so the order can never be reused.
    expect(deps.recordConsumedOrder).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: 'ord_1', organizationId: 'org_1' }),
    );
  });

  it('is idempotent when an active subscription for the same plan already exists (and records consumption)', async () => {
    const deps = makeDeps({ getActiveSubscription: vi.fn(async () => ({ id: 'sub_x', plan_type: 'single-org' })) });
    const verifier = new InMemoryOrderVerifier().seed(paidOrder());
    const res = await new SubscriptionProvisioner(verifier, deps).provisionFromOrder(input);
    expect(res.ok).toBe(true);
    expect(res.code).toBe('ALREADY_ACTIVE');
    expect(deps.createSubscription).not.toHaveBeenCalled();
    expect(deps.recordConsumedOrder).toHaveBeenCalledWith(expect.objectContaining({ orderId: 'ord_1' }));
  });

  it('REJECTS re-using a paid order for a DIFFERENT org (one order → one org), even via the ledger', async () => {
    const deps = makeDeps({
      getConsumedOrder: vi.fn(async () => ({ order_id: 'ord_1', organization_id: 'org_OTHER', subscription_id: 'sub_prev' })),
    });
    const verifier = new InMemoryOrderVerifier().seed(paidOrder());
    const res = await new SubscriptionProvisioner(verifier, deps).provisionFromOrder(input); // input.orgId = org_1
    expect(res.ok).toBe(false);
    expect(res.code).toBe('ORDER_ALREADY_CONSUMED');
    expect(deps.createSubscription).not.toHaveBeenCalled();
    expect(deps.executeUpgrade).not.toHaveBeenCalled();
  });

  // REGRESSION (re-audit): the upgrade path previously never recorded the order,
  // so one paid order could upgrade unlimited pre-seeded orgs. Now the ledger
  // blocks a second org whether it takes the create OR the upgrade path.
  it('REJECTS re-using a paid order to UPGRADE a different pre-seeded org', async () => {
    const deps = makeDeps({
      // Order already consumed by org_OTHER (recorded on its create/upgrade).
      getConsumedOrder: vi.fn(async () => ({ order_id: 'ord_1', organization_id: 'org_OTHER', subscription_id: 'sub_prev' })),
      // Attacker org has a pre-seeded active sub of a different plan (would trigger upgrade).
      getActiveSubscription: vi.fn(async () => ({ id: 'sub_free', plan_type: 'free' })),
    });
    const verifier = new InMemoryOrderVerifier().seed(paidOrder());
    const res = await new SubscriptionProvisioner(verifier, deps).provisionFromOrder(input);
    expect(res.ok).toBe(false);
    expect(res.code).toBe('ORDER_ALREADY_CONSUMED');
    expect(deps.executeUpgrade).not.toHaveBeenCalled();
  });

  it('records consumption on the UPGRADE path so the order cannot be reused afterward', async () => {
    const deps = makeDeps({
      getActiveSubscription: vi.fn(async () => ({ id: 'sub_free', plan_type: 'free' })),
    });
    const verifier = new InMemoryOrderVerifier().seed(paidOrder());
    const res = await new SubscriptionProvisioner(verifier, deps).provisionFromOrder(input);
    expect(res.ok).toBe(true);
    expect(res.code).toBe('UPGRADED');
    expect(deps.executeUpgrade).toHaveBeenCalledTimes(1);
    expect(deps.recordConsumedOrder).toHaveBeenCalledWith(expect.objectContaining({ orderId: 'ord_1', organizationId: 'org_1' }));
  });

  // TOCTOU: the loser of a concurrent reservation race must NOT grant. Because
  // the ledger row is reserved BEFORE the grant, a PK collision short-circuits
  // before executeUpgrade/createSubscription — even when the org has an existing
  // sub that would otherwise be upgraded.
  it('the loser of a reservation race never grants (no upgrade/create after PK collision)', async () => {
    const deps = makeDeps({
      getActiveSubscription: vi.fn(async () => ({ id: 'sub_free', plan_type: 'free' })), // would upgrade
      recordConsumedOrder: vi.fn(async () => {
        throw new Error('UNIQUE constraint failed: consumed_orders.order_id');
      }),
      // Re-check after the collision shows a DIFFERENT org already owns it.
      getConsumedOrder: vi.fn(async () => null),
    });
    const verifier = new InMemoryOrderVerifier().seed(paidOrder());
    const res = await new SubscriptionProvisioner(verifier, deps).provisionFromOrder(input);
    expect(res.ok).toBe(false);
    expect(res.code).toBe('ORDER_ALREADY_CONSUMED');
    expect(deps.executeUpgrade).not.toHaveBeenCalled();
    expect(deps.createSubscription).not.toHaveBeenCalled();
  });

  it('releases the reservation when the grant (upgrade) fails, so the payer can retry', async () => {
    const deps = makeDeps({
      getActiveSubscription: vi.fn(async () => ({ id: 'sub_std', plan_type: 'standard' })),
      executeUpgrade: vi.fn(async () => ({ success: false, error: 'Cannot downgrade' })),
    });
    const verifier = new InMemoryOrderVerifier().seed(paidOrder());
    const res = await new SubscriptionProvisioner(verifier, deps).provisionFromOrder(input);
    expect(res.ok).toBe(false);
    expect(res.code).toBe('UPGRADE_FAILED');
    // Reservation was taken then released.
    expect(deps.recordConsumedOrder).toHaveBeenCalledTimes(1);
    expect(deps.deleteConsumedOrder).toHaveBeenCalledWith('ord_1');
  });
});
