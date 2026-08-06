/**
 * Cron auth regression (Prod-readiness P5): the finalize-cancellations job must
 * require the CRON_SECRET bearer. The client-spoofable `x-vercel-cron` header
 * alone must NOT authorize it.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// The route reaches these only AFTER auth passes; mock so an accidental pass is
// still safe and never touches a real DB.
vi.mock('@/lib/db', () => ({ ensureSubscriptionSchema: vi.fn(async () => {}), nowIso: () => 'now' }));
vi.mock('@/lib/services/SubscriptionFinalizer', () => ({
  SubscriptionFinalizer: class {
    async findExpiredCancellations() {
      return [];
    }
    async finalizeCancellation() {}
  },
}));

import { GET } from '@/app/api/cron/finalize-cancellations/route';

const origEnv = { ...process.env };
function req(headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/cron/finalize-cancellations', { headers });
}

beforeEach(() => {
  process.env.CRON_SECRET = 'topsecret';
});
afterEach(() => {
  process.env = { ...origEnv };
});

describe('cron finalize-cancellations auth', () => {
  it('rejects with 401 when only the spoofable x-vercel-cron header is present', async () => {
    const res = await GET(req({ 'x-vercel-cron': '1' }));
    expect(res.status).toBe(401);
  });

  it('rejects with 401 for a wrong bearer', async () => {
    const res = await GET(req({ authorization: 'Bearer wrong' }));
    expect(res.status).toBe(401);
  });

  it('returns 503 when CRON_SECRET is not configured', async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(req({ authorization: 'Bearer whatever' }));
    expect(res.status).toBe(503);
  });

  it('accepts a valid CRON_SECRET bearer', async () => {
    const res = await GET(req({ authorization: 'Bearer topsecret' }));
    expect(res.status).toBe(200);
  });
});
