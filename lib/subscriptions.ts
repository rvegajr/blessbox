import { getDbClient, ensureSubscriptionSchema, nowIso } from './db';
import type { Session } from 'next-auth';
import { normalizeEmail } from '@/lib/utils/normalize-email';

export type PlanType = 'free' | 'standard' | 'enterprise' | 'single-org';
export type BillingCycle = 'monthly' | 'yearly';

export const planPricingCents: Record<PlanType, number> = {
  free: 0,
  standard: 1900,
  enterprise: 9900,
  'single-org': 999,
};

export const planRegistrationLimits: Record<PlanType, number> = {
  free: 100,
  standard: 5000,
  enterprise: 50000,
  'single-org': 1000,
};

export async function getOrganizationByEmail(email: string): Promise<{ id: string; contact_email: string } | null> {
  const e = normalizeEmail(email);
  if (!e) return null;
  const db = getDbClient();
  const result = await db.execute({
    // Multi-org per email: return most recently created org for legacy callers.
    sql: 'SELECT id, contact_email FROM organizations WHERE contact_email = ? ORDER BY created_at DESC LIMIT 1',
    args: [e],
  });
  if (result.rows.length > 0) {
    return result.rows[0] as unknown as { id: string; contact_email: string };
  }
  return null;
}

export async function getOrganizationById(id: string): Promise<{ id: string; contact_email: string } | null> {
  const db = getDbClient();
  const result = await db.execute({
    sql: 'SELECT id, contact_email FROM organizations WHERE id = ? LIMIT 1',
    args: [id],
  });
  if (result.rows.length > 0) {
    return result.rows[0] as unknown as { id: string; contact_email: string };
  }
  return null;
}

async function getOrganizationIdsForUser(userId: string): Promise<string[]> {
  const client = getDbClient();
  await ensureSubscriptionSchema();
  const res = await client.execute({
    sql: `SELECT organization_id FROM memberships WHERE user_id = ? ORDER BY created_at DESC`,
    args: [userId],
  });
  return (res.rows as any[]).map((r) => String(r.organization_id));
}

/**
 * Resolve the active organization for a session:
 * - Prefer explicit session.user.organizationId (active org context)
 * - If missing, auto-select only when user has exactly one membership
 * - Fallback to legacy email->organization mapping for older data
 */
export async function resolveOrganizationForSession(session: Session): Promise<{ id: string; contact_email: string } | null> {
  const explicitOrgId = (session.user as any)?.organizationId as string | undefined;
  if (explicitOrgId) {
    const org = await getOrganizationById(explicitOrgId);
    if (!org) {
      console.warn(`[resolveOrganizationForSession] Explicit org ID ${explicitOrgId} not found in database`);
    }
    return org;
  }

  const userId = session.user?.id;
  if (userId) {
    const orgIds = await getOrganizationIdsForUser(String(userId));
    if (orgIds.length === 1) {
      const org = await getOrganizationById(orgIds[0]);
      if (!org) {
        console.warn(`[resolveOrganizationForSession] Org ID ${orgIds[0]} from membership not found in database`);
      }
      return org;
    }
    if (orgIds.length > 1) {
      // Multiple orgs, none selected yet.
      console.log(`[resolveOrganizationForSession] User ${userId} has ${orgIds.length} organizations, none selected`);
      return null;
    }
  }

  const email = session.user?.email;
  if (!email) {
    console.warn('[resolveOrganizationForSession] No email in session, cannot resolve organization');
    return null;
  }
  
  const org = await getOrCreateOrganizationForEmail(email);
  if (!org) {
    console.warn(`[resolveOrganizationForSession] Failed to get/create org for email ${email}`);
  }
  return org;
}

export async function getOrCreateOrganizationForEmail(email: string): Promise<{ id: string; contact_email: string } | null> {
  const e = normalizeEmail(email);
  if (!e) return null;
  const client = getDbClient();
  await ensureSubscriptionSchema();

  const existing = await client.execute({
    sql: `SELECT id, contact_email FROM organizations WHERE contact_email = ? ORDER BY created_at DESC LIMIT 1`,
    args: [e],
  });
  if ((existing.rows as any[]).length > 0) {
    const row: any = existing.rows[0];
    return { id: String(row.id), contact_email: String(row.contact_email) };
    
  }

  const id = (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) as string;
  await client.execute({
    sql: `INSERT INTO organizations (id, name, contact_email, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
    args: [id, e.split('@')[0], e, nowIso(), nowIso()],
  });
  return { id, contact_email: e };
}

export async function getActiveSubscription(organizationId: string): Promise<any | null> {
  const client = getDbClient();
  await ensureSubscriptionSchema();

  const res = await client.execute({
    sql: `SELECT * FROM subscription_plans WHERE organization_id = ? AND status = 'active' ORDER BY start_date DESC LIMIT 1`,
    args: [organizationId],
  });
  return (res.rows as any[])[0] || null;
}

/**
 * Look up any subscription that was provisioned from a given external order /
 * payment id. Used to enforce one-order-one-subscription so a single paid order
 * cannot provision paid tiers on multiple organizations.
 */
export async function getSubscriptionByExternalId(externalId: string): Promise<any | null> {
  if (!externalId) return null;
  const client = getDbClient();
  await ensureSubscriptionSchema();

  const res = await client.execute({
    sql: `SELECT * FROM subscription_plans WHERE external_subscription_id = ? ORDER BY start_date DESC LIMIT 1`,
    args: [externalId],
  });
  return (res.rows as any[])[0] || null;
}

/**
 * Consumed-orders ledger — the authoritative "this paid order has been used"
 * record. Keyed by order_id so ONE paid order can grant a subscription to at most
 * ONE organization, across create AND upgrade AND same-plan paths (the
 * external_subscription_id approach missed the upgrade path).
 */
export async function getConsumedOrder(
  orderId: string,
): Promise<{ order_id: string; organization_id: string; subscription_id: string | null } | null> {
  if (!orderId) return null;
  const client = getDbClient();
  await ensureSubscriptionSchema();
  const res = await client.execute({
    sql: `SELECT order_id, organization_id, subscription_id FROM consumed_orders WHERE order_id = ? LIMIT 1`,
    args: [orderId],
  });
  return (res.rows as any[])[0] || null;
}

/**
 * Record an order as consumed. The order_id PRIMARY KEY makes a duplicate insert
 * throw, which the caller treats as "already consumed" (also closes the
 * concurrent double-consume race).
 */
export async function recordConsumedOrder(params: {
  orderId: string;
  organizationId: string;
  subscriptionId?: string;
  planType?: string;
  amountCents?: number;
}): Promise<void> {
  const client = getDbClient();
  await ensureSubscriptionSchema();
  await client.execute({
    sql: `INSERT INTO consumed_orders (order_id, organization_id, subscription_id, plan_type, amount_cents, consumed_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      params.orderId,
      params.organizationId,
      params.subscriptionId ?? null,
      params.planType ?? null,
      params.amountCents ?? null,
      nowIso(),
    ],
  });
}

/** Release a reservation when the grant that followed it failed, so the payer can retry. */
export async function deleteConsumedOrder(orderId: string): Promise<void> {
  if (!orderId) return;
  const client = getDbClient();
  await client.execute({ sql: `DELETE FROM consumed_orders WHERE order_id = ?`, args: [orderId] });
}

export async function createSubscription(params: {
  organizationId: string;
  planType: PlanType;
  billingCycle?: BillingCycle;
  currency?: string;
  amountCents?: number;
  externalSubscriptionId?: string;
}): Promise<any> {
  const { organizationId, planType, billingCycle = 'monthly', currency = 'USD' } = params;
  const client = getDbClient();
  await ensureSubscriptionSchema();

  const id = (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) as string;
  const amount = params.amountCents ?? planPricingCents[planType];
  const registrationLimit = planRegistrationLimits[planType];
  const start = nowIso();
  const end =
    billingCycle === 'yearly'
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await client.execute({
    sql: `INSERT INTO subscription_plans (
      id, organization_id, plan_type, status, registration_limit, current_registration_count,
      billing_cycle, amount, currency, current_period_start, current_period_end,
      start_date, end_date, external_subscription_id, created_at, updated_at
    ) VALUES (?, ?, ?, 'active', ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      organizationId,
      planType,
      registrationLimit,
      billingCycle,
      amount,
      currency,
      start,
      end,
      start,
      end,
      params.externalSubscriptionId || null,
      start,
      start,
    ],
  });

  const res = await client.execute({ sql: `SELECT * FROM subscription_plans WHERE id = ?`, args: [id] });
  return (res.rows as any[])[0];
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  const client = getDbClient();
  await ensureSubscriptionSchema();
  const end = nowIso();
  await client.execute({ sql: `UPDATE subscription_plans SET status = 'canceled', end_date = ?, updated_at = ? WHERE id = ?`, args: [end, end, subscriptionId] });
}

export async function listAllSubscriptions(): Promise<any[]> {
  const client = getDbClient();
  await ensureSubscriptionSchema();
  const res = await client.execute({
    sql: `SELECT sp.*, org.contact_email, org.name as organization_name
          FROM subscription_plans sp
          JOIN organizations org ON org.id = sp.organization_id
          ORDER BY sp.created_at DESC`,
    args: [],
  });
  return res.rows as any[];
}
