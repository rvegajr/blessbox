/**
 * traklet-proxy security regression tests (Prod-readiness Phase 1).
 *
 * The proxy re-attaches the server GitHub PAT with no caller auth. These tests
 * pin the containment guarantees: disabled by default, scoped to one repo, and
 * no destructive HTTP methods.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

import * as route from '@/app/api/dev/traklet-proxy/[...path]/route';

const PAT = 'ghp_testtoken';
const origEnv = { ...process.env };

function req(path: string) {
  return new NextRequest(`http://localhost${path}`);
}

beforeEach(() => {
  vi.restoreAllMocks();
  process.env.TRAKLET_PAT = PAT;
  delete process.env.TRAKLET_REPO; // exercise the rvegajr/blessbox default
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
});

describe('traklet-proxy — scoping (enabled)', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_TRAKLET_ENABLED = 'true';
  });

  it('rejects a path targeting a different repo with 403 and never calls GitHub', async () => {
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

  it('forwards an in-scope request to GitHub with the server PAT attached', async () => {
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
    expect(String(url)).toBe('https://api.github.com/repos/rvegajr/blessbox/issues?state=open');
    expect((init as RequestInit).headers).toMatchObject({ Authorization: `token ${PAT}` });
  });
});

describe('traklet-proxy — no destructive methods', () => {
  it('does not export PUT or DELETE handlers', () => {
    expect((route as Record<string, unknown>).PUT).toBeUndefined();
    expect((route as Record<string, unknown>).DELETE).toBeUndefined();
  });
});
