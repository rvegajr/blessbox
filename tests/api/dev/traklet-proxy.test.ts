/**
 * traklet-proxy security regression tests.
 *
 * The proxy no longer holds a GitHub PAT — it forwards to the Noctusoft relay's
 * scoped /github endpoint, authenticating with the app's relay identity (Vercel
 * OIDC / deploy key). These tests pin the containment guarantees: hard-off in
 * production, off unless enabled, scoped to one repo, no destructive methods,
 * and that in-scope requests forward to the relay with Bearer auth.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/services/gatewayConfig', () => ({
  relayBaseUrl: () => 'https://api.sendgrid.noctusoft.com',
  gatewayAuthToken: vi.fn(async () => 'relay-token-123'),
}));

import * as route from '@/app/api/dev/traklet-proxy/[...path]/route';

const origEnv = { ...process.env };

function req(path: string) {
  return new NextRequest(`http://localhost${path}`);
}

beforeEach(() => {
  vi.restoreAllMocks();
  delete process.env.TRAKLET_REPO; // exercise the rvegajr/blessbox default
  process.env.NODE_ENV = 'development'; // not production
});

afterEach(() => {
  process.env = { ...origEnv };
});

describe('traklet-proxy — enablement', () => {
  it('returns 404 when NEXT_PUBLIC_TRAKLET_ENABLED is not "true"', async () => {
    delete process.env.NEXT_PUBLIC_TRAKLET_ENABLED;
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const res = await route.GET(req('/api/dev/traklet-proxy/repos/rvegajr/blessbox/issues'));
    expect(res.status).toBe(404);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns 404 in production even when enabled', async () => {
    process.env.NEXT_PUBLIC_TRAKLET_ENABLED = 'true';
    process.env.NODE_ENV = 'production';
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const res = await route.GET(req('/api/dev/traklet-proxy/repos/rvegajr/blessbox/issues'));
    expect(res.status).toBe(404);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('traklet-proxy — scoping (enabled)', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_TRAKLET_ENABLED = 'true';
  });

  it('rejects a path targeting a different repo with 403 and never calls the relay', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const res = await route.GET(req('/api/dev/traklet-proxy/repos/someone/other-repo/issues'));
    expect(res.status).toBe(403);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects path traversal (..) with 403', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const res = await route.GET(req('/api/dev/traklet-proxy/repos/rvegajr/blessbox/../../users/victim'));
    expect(res.status).toBe(403);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('forwards an in-scope request to the relay /github with Bearer auth (no PAT)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([{ number: 1 }]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }) as any,
    );

    const res = await route.GET(req('/api/dev/traklet-proxy/repos/rvegajr/blessbox/issues?state=open'));

    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toBe('https://api.sendgrid.noctusoft.com/github/repos/rvegajr/blessbox/issues?state=open');
    expect((init as RequestInit).headers).toMatchObject({ Authorization: 'Bearer relay-token-123' });
  });
});

describe('traklet-proxy — no destructive methods', () => {
  it('does not export PUT or DELETE handlers', () => {
    expect((route as Record<string, unknown>).PUT).toBeUndefined();
    expect((route as Record<string, unknown>).DELETE).toBeUndefined();
  });
});
