import { ensureSubscriptionSchema } from './db';
import { ensureLibsqlSchema } from '@/src/database/bootstrap';

let initPromise: Promise<void> | null = null;

/**
 * Ensure the local/libsql schema exists before handling requests.
 *
 * This is primarily for local development and automated tests where the SQLite/libsql file
 * may be empty. It is safe to call multiple times (idempotent + cached).
 */
export async function ensureDbReady(): Promise<void> {
  if (!initPromise) {
    const url = process.env.TURSO_DATABASE_URL || 'file:./blessbox.db';
    const authToken = process.env.TURSO_AUTH_TOKEN || '';

    initPromise = (async () => {
      await ensureLibsqlSchema({ url, authToken });
      // Keep existing behavior for subscriptions/coupons that relies on this helper.
      await ensureSubscriptionSchema();
    })();
  }

  await initPromise;
}

