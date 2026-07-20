import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const ensureLibsqlSchema = vi.fn(async (_opts?: unknown) => {});
const ensureSubscriptionSchema = vi.fn(async () => {});

vi.mock('@/lib/database/bootstrap', () => ({ ensureLibsqlSchema: (opts?: unknown) => ensureLibsqlSchema(opts) }));
vi.mock('./db', () => ({ ensureSubscriptionSchema: () => ensureSubscriptionSchema() }));

describe('ensureDbReady', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });
  afterEach(() => vi.unstubAllEnvs());

  it('is a NO-OP in production against a remote Turso DB (no request-path DDL/rebuild)', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('TURSO_DATABASE_URL', 'libsql://blessbox-prod.turso.io');
    const { ensureDbReady } = await import('./db-ready');
    await ensureDbReady();
    expect(ensureLibsqlSchema).not.toHaveBeenCalled();
    expect(ensureSubscriptionSchema).not.toHaveBeenCalled();
  });

  it('runs schema bootstrap for a local file DB (dev/test convenience preserved)', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('TURSO_DATABASE_URL', 'file:./blessbox.db');
    const { ensureDbReady } = await import('./db-ready');
    await ensureDbReady();
    expect(ensureLibsqlSchema).toHaveBeenCalled();
  });
});
