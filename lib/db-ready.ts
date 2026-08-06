import { ensureSubscriptionSchema } from './db';
import { ensureLibsqlSchema } from '@/lib/database/bootstrap';
import { getEnv } from './utils/env';

let initPromise: Promise<void> | null = null;

/**
 * Ensure the local/libsql schema exists before handling requests.
 *
 * This is primarily for local development and automated tests where the SQLite/libsql file
 * may be empty. It is safe to call multiple times (idempotent + cached).
 */
export async function ensureDbReady(): Promise<void> {
  const url = getEnv('TURSO_DATABASE_URL', 'file:./blessbox.db');
  const authToken = getEnv('TURSO_AUTH_TOKEN');

  // In production against a real (non-file) Turso database, the schema is owned
  // by deploy-time migrations. NEVER run CREATE/ALTER/table-rebuild DDL on the
  // request path here — ensureLibsqlSchema includes a destructive `organizations`
  // table rebuild. This is a no-op in prod; local/test (file: DB) still bootstrap.
  const isFileDb = url.startsWith('file:');
  if (process.env.NODE_ENV === 'production' && !isFileDb) {
    return;
  }

  if (!initPromise) {
    initPromise = (async () => {
      await ensureLibsqlSchema({ url, authToken });
      // Keep existing behavior for subscriptions/coupons that relies on this helper.
      await ensureSubscriptionSchema();
    })();
  }

  await initPromise;
}

