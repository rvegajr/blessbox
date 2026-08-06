import { describe, it, expect } from 'vitest';
import { decideTestLogin } from './testLoginPolicy';

const ALLOW = ['qa@blessbox.org', 'smoke@blessbox.org'];

describe('decideTestLogin', () => {
  describe('production', () => {
    it('denies admin:true (never mints superadmin in prod)', () => {
      const d = decideTestLogin({ isProd: true, email: 'qa@blessbox.org', admin: true, allowList: ALLOW });
      expect(d.allowed).toBe(false);
      expect(d.role).toBe('user');
      expect(d.error).toMatch(/admin/i);
    });

    it('allows an allow-listed non-admin email as role "user"', () => {
      const d = decideTestLogin({ isProd: true, email: 'qa@blessbox.org', admin: false, allowList: ALLOW });
      expect(d.allowed).toBe(true);
      expect(d.role).toBe('user');
      expect(d.ttlSeconds).toBeLessThanOrEqual(900);
    });

    it('is case-insensitive on the allow-list', () => {
      const d = decideTestLogin({ isProd: true, email: 'QA@BlessBox.org', admin: false, allowList: ALLOW });
      expect(d.allowed).toBe(true);
    });

    it('denies an email that is not allow-listed', () => {
      const d = decideTestLogin({ isProd: true, email: 'attacker@evil.com', admin: false, allowList: ALLOW });
      expect(d.allowed).toBe(false);
      expect(d.error).toMatch(/allow.?list/i);
    });

    it('caps the TTL at 900s even when a larger TTL is requested', () => {
      const d = decideTestLogin({ isProd: true, email: 'qa@blessbox.org', admin: false, allowList: ALLOW, requestedTtlSeconds: 99999 });
      expect(d.ttlSeconds).toBe(900);
    });

    it('denies when the allow-list is empty', () => {
      const d = decideTestLogin({ isProd: true, email: 'qa@blessbox.org', admin: false, allowList: [] });
      expect(d.allowed).toBe(false);
    });
  });

  describe('non-production (dev convenience preserved)', () => {
    it('allows admin:true as superadmin off-prod', () => {
      const d = decideTestLogin({ isProd: false, email: 'anyone@example.com', admin: true, allowList: [] });
      expect(d.allowed).toBe(true);
      expect(d.role).toBe('superadmin');
    });

    it('allows non-admin as user with the requested TTL', () => {
      const d = decideTestLogin({ isProd: false, email: 'dev@example.com', admin: false, allowList: [], requestedTtlSeconds: 7200 });
      expect(d.allowed).toBe(true);
      expect(d.role).toBe('user');
      expect(d.ttlSeconds).toBe(7200);
    });
  });
});
