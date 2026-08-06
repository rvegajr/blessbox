/**
 * Deploy-time / local DB migrator (Drizzle + libSQL).
 *
 *   - Fresh DB (local/test, empty): applies ALL migrations (0000 baseline +
 *     forward migrations) to build the full schema.
 *   - Existing DB (prod, tables already present, no migration tracking yet):
 *     pre-seeds the 0000 baseline as "already applied" so the migrator does NOT
 *     try to re-CREATE existing tables, then applies only the forward migrations
 *     (e.g. 0001 add_coupon_fields).
 *
 * Usage:
 *   TURSO_DATABASE_URL=file:./local.db tsx scripts/migrate.ts          # local
 *   TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... tsx scripts/migrate.ts   # prod
 */
import { createClient, type Client } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { readMigrationFiles } from 'drizzle-orm/migrator';

const MIGRATIONS_FOLDER = 'drizzle/migrations';
const SENTINEL_TABLE = 'organizations'; // a core table that exists on any provisioned DB

async function tableExists(client: Client, name: string): Promise<boolean> {
  const r = await client.execute({
    sql: `SELECT 1 FROM sqlite_master WHERE type='table' AND name = ? LIMIT 1`,
    args: [name],
  });
  return r.rows.length > 0;
}

async function appliedMigrationCount(client: Client): Promise<number> {
  if (!(await tableExists(client, '__drizzle_migrations'))) return 0;
  const r = await client.execute(`SELECT COUNT(*) AS c FROM __drizzle_migrations`);
  return Number((r.rows[0] as { c: number }).c ?? 0);
}

async function main(): Promise<void> {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url) throw new Error('TURSO_DATABASE_URL is required');

  const client = createClient({ url, ...(authToken ? { authToken } : {}) });
  const db = drizzle(client);

  const existingDb = await tableExists(client, SENTINEL_TABLE);
  const alreadyTracked = (await appliedMigrationCount(client)) > 0;

  if (existingDb && !alreadyTracked) {
    // Adopt an already-provisioned DB: mark the baseline as applied (don't run it).
    const [baseline] = readMigrationFiles({ migrationsFolder: MIGRATIONS_FOLDER });
    if (!baseline) throw new Error('No migrations found to adopt baseline from');
    await client.execute(
      `CREATE TABLE IF NOT EXISTS __drizzle_migrations (id INTEGER PRIMARY KEY, hash text NOT NULL, created_at numeric)`,
    );
    await client.execute({
      sql: `INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)`,
      args: [baseline.hash, baseline.folderMillis],
    });
    console.log(`[migrate] Existing DB adopted — baseline ${baseline.hash.slice(0, 12)}… pre-seeded as applied.`);
  }

  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });

  const finalCount = await appliedMigrationCount(client);
  console.log(`[migrate] Done. ${finalCount} migration(s) recorded as applied.`);
  client.close();
}

main().catch((err) => {
  console.error('[migrate] FAILED:', err);
  process.exit(1);
});
