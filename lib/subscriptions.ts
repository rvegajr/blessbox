import { getDbClient, ensureSubscriptionSchema, nowIso } from './db';

export type PlanType = 'free' | 'standard' | 'enterprise';
export type BillingCycle = 'monthly' | 'yearly';

export const planPricingCents: Record<PlanType, number> = {
  free: 0,
  standard: 1900,
  enterprise: 9900,
};

export const planRegistrationLimits: Record<PlanType, number> = {
  free: 100,
  standard: 5000,
  enterprise: 50000,
};

export async function getOrganizationByEmail(email: string): Promise<{ id: string; contact_email: string } | null> {
  const db = getDbClient();
  const result = await db.execute({
    sql: 'SELECT id, contact_email FROM organizations WHERE contact_email = ?',
    args: [email],
  });
  if (result.rows.length > 0) {
    return result.rows[0] as { id: string; contact_email: string };
  }
  return null;
}

export async function getOrCreateOrganizationForEmail(email: string): Promise<{ id: string; contact_email: string } | null> {
  if (!email) return null;
  const client = getDbClient();
  await ensureSubscriptionSchema();

  const existing = await client.execute({ sql: `SELECT id, contact_email FROM organizations WHERE contact_email = ?`, args: [email] });
  if ((existing.rows as any[]).length > 0) {
    const row: any = existing.rows[0];
    return { id: String(row.id), contact_email: String(row.contact_email) };
    
  }

  const id = (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) as string;
  await client.execute({
    sql: `INSERT INTO organizations (id, name, contact_email, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
    args: [id, email.split('@')[0], email, nowIso(), nowIso()],
  });
  return { id, contact_email: email };
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

export async function createSubscription(params: {
  organizationId: string;
  planType: PlanType;
  billingCycle?: BillingCycle;
  currency?: string;
  amountCents?: number;
}): Promise<any> {
  const { organizationId, planType, billingCycle = 'monthly', currency = 'USD' } = params;
  const client = getDbClient();
  await ensureSubscriptionSchema();

  const id = (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) as string;
  const amount = params.amountCents ?? planPricingCents[planType];
  const registrationLimit = planRegistrationLimits[planType];
  const start = nowIso();

  await client.execute({
    sql: `INSERT INTO subscription_plans (
      id, organization_id, plan_type, status, registration_limit, current_registration_count,
      billing_cycle, amount, currency, start_date, created_at, updated_at
    ) VALUES (?, ?, ?, 'active', ?, 0, ?, ?, ?, ?, ?, ?)`,
    args: [id, organizationId, planType, registrationLimit, billingCycle, amount, currency, start, start, start],
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
