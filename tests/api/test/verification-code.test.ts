/**
 * Hardening tests for /api/test/verification-code (Prod-readiness P3).
 * This endpoint returns a login OTP, so in production it must:
 *   - reject a wrong secret WITHOUT leaking a debug/oracle object,
 *   - only return codes for allow-listed QA emails.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockDb = vi.hoisted(() => ({ execute: vi.fn() }));
vi.mock('@/lib/db', () => ({ getDbClient: () => mockDb }));
vi.mock('@/lib/db-ready', () => ({ ensureDbReady: async () => {} }));

import { POST } from '@/app/api/test/verification-code/route';

const origEnv = { ...process.env };

function post(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/test/verification-code', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mockDb.execute.mockReset();
  process.env.NODE_ENV = 'production';
  process.env.PROD_TEST_VERIFICATION_SECRET = 'correct-secret';
  process.env.QA_TEST_LOGIN_ALLOWED_EMAILS = 'qa@blessbox.org';
});

afterEach(() => {
  process.env = { ...origEnv };
});

describe('test/verification-code hardening (production)', () => {
  it('rejects a wrong secret with 403 and NO debug object', async () => {
    const res = await POST(post({ email: 'qa@blessbox.org' }, { 'x-qa-verification-token': 'wrong' }));
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json).not.toHaveProperty('debug');
    expect(mockDb.execute).not.toHaveBeenCalled();
  });

  it('rejects a non-allow-listed email even with the correct secret', async () => {
    const res = await POST(post({ email: 'victim@example.com' }, { 'x-qa-verification-token': 'correct-secret' }));
    expect(res.status).toBe(403);
    expect(mockDb.execute).not.toHaveBeenCalled();
  });

  it('returns the code for an allow-listed email with the correct secret', async () => {
    mockDb.execute.mockResolvedValue({ rows: [{ code: '654321', created_at: 'n', expires_at: 'n', verified: 0 }] });
    const res = await POST(post({ email: 'qa@blessbox.org' }, { 'x-qa-verification-token': 'correct-secret' }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.code).toBe('654321');
  });
});
