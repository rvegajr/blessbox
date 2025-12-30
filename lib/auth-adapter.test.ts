import { describe, expect, it, vi } from 'vitest';

describe('createLibsqlAuthAdapter', () => {
  it('stores and consumes verification tokens (case-insensitive identifier)', async () => {
    process.env.TURSO_DATABASE_URL = `file:./.tmp/auth-adapter-test-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}.sqlite`;
    process.env.TURSO_AUTH_TOKEN = '';

    vi.resetModules();

    const { ensureDbReady } = await import('./db-ready');
    await ensureDbReady();

    const { createLibsqlAuthAdapter } = await import('./auth-adapter');
    const adapter = createLibsqlAuthAdapter();

    const created = await adapter.createUser({
      id: undefined,
      email: 'Case@Example.com',
      emailVerified: null,
      name: null,
      image: null,
    });
    expect(created.email).toBe('case@example.com');

    const byEmail = await adapter.getUserByEmail('CASE@example.com');
    expect(byEmail?.id).toBe(created.id);

    const expires = new Date(Date.now() + 5 * 60 * 1000);
    await adapter.createVerificationToken({
      identifier: 'Case@Example.com',
      token: 'token-hash',
      expires,
    });

    const used = await adapter.useVerificationToken({
      identifier: 'case@example.com',
      token: 'token-hash',
    });
    expect(used?.identifier).toBe('case@example.com');

    const usedAgain = await adapter.useVerificationToken({
      identifier: 'case@example.com',
      token: 'token-hash',
    });
    expect(usedAgain).toBeNull();
  });
});


