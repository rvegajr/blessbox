import { describe, it, expect } from 'vitest';
import { createClient, type Client } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';

const MIGRATIONS = 'drizzle/migrations';

// The 23 application tables the schema must produce (excludes __drizzle_migrations).
const EXPECTED_TABLES = [
  'class_sessions', 'classes', 'coupon_codes', 'coupon_redemptions', 'coupons',
  'email_logs', 'email_templates', 'enrollments', 'export_jobs', 'login_codes',
  'memberships', 'organizations', 'participants', 'payment_transactions', 'qr_code_sets',
  'registrations', 'saved_searches', 'subscription_plans', 'usage_alerts', 'usage_tracking',
  'users', 'verification_codes', 'verification_tokens',
].sort();

async function appTables(client: Client): Promise<string[]> {
  const r = await client.execute(
    `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '__drizzle_migrations' ORDER BY name`,
  );
  return r.rows.map((x) => x.name as string);
}

async function freshDb(): Promise<{ client: Client; db: ReturnType<typeof drizzle> }> {
  const client = createClient({ url: ':memory:' });
  return { client, db: drizzle(client) };
}

describe('drizzle migrations', () => {
  it('apply cleanly to a fresh DB and produce the full 23-table schema', async () => {
    const { client, db } = await freshDb();
    await migrate(db, { migrationsFolder: MIGRATIONS });

    expect(await appTables(client)).toEqual(EXPECTED_TABLES);

    const recorded = await client.execute(`SELECT COUNT(*) AS c FROM __drizzle_migrations`);
    expect(Number((recorded.rows[0] as unknown as { c: number }).c)).toBe(2); // baseline + add_coupon_fields
    client.close();
  });

  it('include the coupon-fields fix (description/min_amount/max_discount on coupons)', async () => {
    const { client, db } = await freshDb();
    await migrate(db, { migrationsFolder: MIGRATIONS });

    const cols = (await client.execute(`PRAGMA table_info(coupons)`)).rows.map((r) => r.name as string);
    expect(cols).toContain('description');
    expect(cols).toContain('min_amount');
    expect(cols).toContain('max_discount');
    client.close();
  });

  it('are idempotent — re-running applies nothing and records no duplicates', async () => {
    const { client, db } = await freshDb();
    await migrate(db, { migrationsFolder: MIGRATIONS });
    await migrate(db, { migrationsFolder: MIGRATIONS }); // second run

    const recorded = await client.execute(`SELECT COUNT(*) AS c FROM __drizzle_migrations`);
    expect(Number((recorded.rows[0] as unknown as { c: number }).c)).toBe(2);
    client.close();
  });
});
