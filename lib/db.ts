import { createClient, Client } from '@libsql/client';

let cachedClient: Client | null = null;

export function getDbClient(): Client {
  if (cachedClient) return cachedClient;

  const url = process.env.TURSO_DATABASE_URL || 'file:./blessbox.db';
  const authToken = process.env.TURSO_AUTH_TOKEN || '';

  cachedClient = createClient({ url, authToken });
  return cachedClient;
}

export async function ensureSubscriptionSchema(): Promise<void> {
  const client = getDbClient();

  await client.execute(
    `CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT,
      event_name TEXT,
      custom_domain TEXT UNIQUE,
      contact_email TEXT NOT NULL UNIQUE,
      contact_phone TEXT,
      contact_address TEXT,
      contact_city TEXT,
      contact_state TEXT,
      contact_zip TEXT,
      email_verified INTEGER DEFAULT 0 NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`
  );

  await client.execute(
    `CREATE TABLE IF NOT EXISTS subscription_plans (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      plan_type TEXT NOT NULL,
      status TEXT DEFAULT 'active' NOT NULL,
      registration_limit INTEGER NOT NULL,
      current_registration_count INTEGER DEFAULT 0 NOT NULL,
      billing_cycle TEXT DEFAULT 'monthly' NOT NULL,
      amount REAL,
      currency TEXT DEFAULT 'USD' NOT NULL,
      current_period_start TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      current_period_end TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      payment_provider TEXT DEFAULT 'square',
      external_subscription_id TEXT,
      start_date TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      end_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    )`
  );

  await client.execute(`CREATE INDEX IF NOT EXISTS subscription_plans_org_idx ON subscription_plans(organization_id)`);
  await client.execute(`CREATE INDEX IF NOT EXISTS subscription_plans_status_idx ON subscription_plans(status)`);
}

export function nowIso(): string {
  return new Date().toISOString();
}

