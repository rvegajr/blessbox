import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  safeParseJson,
  badRequestResponse,
  internalErrorResponse,
  isSensitive,
} from '@/lib/api/errorResponse';

// Silence console.error noise in tests
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

function makeReq(body: string, contentType = 'application/json'): Request {
  return new Request('http://localhost/test', {
    method: 'POST',
    headers: { 'content-type': contentType },
    body,
  });
}

describe('errorResponse helpers', () => {
  describe('safeParseJson', () => {
    it('parses valid JSON', async () => {
      const req = makeReq(JSON.stringify({ a: 1 }));
      const r = await safeParseJson<{ a: number }>(req as any);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.body.a).toBe(1);
    });

    it('returns 400 with generic body on malformed JSON — never the parser message', async () => {
      const req = makeReq('oops');
      const r = await safeParseJson(req as any);
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.response.status).toBe(400);
        const body = await r.response.json();
        expect(body.error).toBe('Bad request');
        // Must NOT leak parser internals
        expect(JSON.stringify(body)).not.toMatch(/Unexpected token/i);
        expect(JSON.stringify(body)).not.toMatch(/JSON/i);
      }
    });
  });

  describe('badRequestResponse', () => {
    it('returns 400 with custom message', async () => {
      const r = badRequestResponse('Invalid organization');
      expect(r.status).toBe(400);
      const body = await r.json();
      expect(body).toEqual({ success: false, error: 'Invalid organization' });
    });
  });

  describe('internalErrorResponse', () => {
    it('returns 500 with generic message — never leaks the original error text', async () => {
      const original = new Error('SQLITE_CONSTRAINT_FOREIGNKEY: FOREIGN KEY constraint failed');
      const r = internalErrorResponse(original, 'Verify code');
      expect(r.status).toBe(500);
      const body = await r.json();
      expect(body.error).toBe('Internal error');
      const text = JSON.stringify(body);
      expect(text).not.toMatch(/SQLITE/);
      expect(text).not.toMatch(/FOREIGN KEY/i);
    });
  });

  describe('isSensitive', () => {
    it('flags SQLite/FK/parser strings', () => {
      expect(isSensitive('SQLITE_CONSTRAINT_FOREIGNKEY: FOREIGN KEY constraint failed')).toBe(true);
      expect(isSensitive('Unexpected token o in JSON at position 0')).toBe(true);
      expect(isSensitive('libsql: connection refused')).toBe(true);
    });
    it('does not flag clean validation messages', () => {
      expect(isSensitive('Email is required')).toBe(false);
      expect(isSensitive('Invalid organization')).toBe(false);
    });
  });
});

// Regression for QA Blocker 9: verify-code with non-existent organizationId
// must return 400 (not 500) and must NOT leak SQLITE error text.
describe('Blocker 9 regression — /api/onboarding/verify-code with bad organizationId', () => {
  it('returns 400 with clean error and no SQLITE text in body', async () => {
    // Mock dependencies so we can exercise the route in-process.
    vi.resetModules();

    vi.doMock('@/lib/db-ready', () => ({ ensureDbReady: vi.fn().mockResolvedValue(undefined) }));

    const execute = vi.fn(async ({ sql }: { sql: string }) => {
      const s = sql.toLowerCase();
      if (s.includes('insert into users')) return { rows: [] };
      if (s.includes('select id, email from users')) return { rows: [{ id: 'user-1', email: 'qa@example.com' }] };
      if (s.includes('select id from organizations')) return { rows: [] }; // org does NOT exist
      return { rows: [] };
    });
    vi.doMock('@/lib/db', () => ({ getDbClient: () => ({ execute }) }));

    vi.doMock('@/lib/services/VerificationService', () => ({
      VerificationService: class {
        async verifyCode() {
          return { success: true, verified: true, message: 'OK' };
        }
      },
    }));

    const route = await import('../../app/api/onboarding/verify-code/route');

    const req = new Request('http://localhost/api/onboarding/verify-code', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'qa@example.com',
        code: '123456',
        organizationId: 'does-not-exist',
      }),
    });

    const res = await route.POST(req as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    const text = JSON.stringify(body);
    expect(text).not.toMatch(/SQLITE/);
    expect(text).not.toMatch(/FOREIGN KEY/i);
    expect(body.error).toBe('Invalid organization');
    expect(body.membershipCreated).toBe(false);

    // The membership INSERT must NEVER have fired
    const insertedMembership = (execute as any).mock.calls.some(([arg]: any[]) =>
      String(arg.sql).toLowerCase().includes('insert into memberships')
    );
    expect(insertedMembership).toBe(false);
  });

  it('returns 400 (not 500) on malformed JSON and does not leak parser text', async () => {
    vi.resetModules();
    vi.doMock('@/lib/db-ready', () => ({ ensureDbReady: vi.fn() }));
    vi.doMock('@/lib/db', () => ({ getDbClient: () => ({ execute: vi.fn() }) }));
    vi.doMock('@/lib/services/VerificationService', () => ({
      VerificationService: class { async verifyCode() { return { success: true, verified: true }; } },
    }));

    const route = await import('../../app/api/onboarding/verify-code/route');
    const req = new Request('http://localhost/api/onboarding/verify-code', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'oops not json',
    });
    const res = await route.POST(req as any);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(JSON.stringify(body)).not.toMatch(/Unexpected token/i);
  });
});
