import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { requireDiagnosticsSecret, hasValidDiagnosticsSecret } from './diagnosticsAuth';

function makeReq(headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/diag', { headers });
}

describe('requireDiagnosticsSecret', () => {
  const origEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.DIAGNOSTICS_SECRET;
    delete process.env.CRON_SECRET;
    (process.env as any).NODE_ENV = 'development';
  });

  afterEach(() => {
    process.env = { ...origEnv };
  });

  it('returns 401 anon in dev when no secret configured', async () => {
    const res = requireDiagnosticsSecret(makeReq());
    expect(res).not.toBeNull();
    expect(res!.status).toBe(401);
  });

  it('returns 404 anon in production-like env (hides existence)', async () => {
    (process.env as any).NODE_ENV = 'production';
    process.env.DIAGNOSTICS_SECRET = 'shhh';
    const res = requireDiagnosticsSecret(makeReq());
    expect(res).not.toBeNull();
    expect(res!.status).toBe(404);
  });

  it('returns 404 in prod when wrong bearer token supplied', async () => {
    (process.env as any).NODE_ENV = 'production';
    process.env.DIAGNOSTICS_SECRET = 'shhh';
    const res = requireDiagnosticsSecret(makeReq({ authorization: 'Bearer wrong' }));
    expect(res!.status).toBe(404);
  });

  it('returns null (success) when correct bearer token supplied', () => {
    (process.env as any).NODE_ENV = 'production';
    process.env.DIAGNOSTICS_SECRET = 'shhh';
    const res = requireDiagnosticsSecret(makeReq({ authorization: 'Bearer shhh' }));
    expect(res).toBeNull();
  });

  it('accepts CRON_SECRET as fallback', () => {
    (process.env as any).NODE_ENV = 'production';
    process.env.CRON_SECRET = 'cron-shhh';
    const res = requireDiagnosticsSecret(makeReq({ authorization: 'Bearer cron-shhh' }));
    expect(res).toBeNull();
  });

  it('rejects when no secret configured even with bearer header', () => {
    (process.env as any).NODE_ENV = 'production';
    const res = requireDiagnosticsSecret(makeReq({ authorization: 'Bearer anything' }));
    expect(res!.status).toBe(404);
  });

  it('hasValidDiagnosticsSecret mirrors requireDiagnosticsSecret', () => {
    process.env.DIAGNOSTICS_SECRET = 'k';
    expect(hasValidDiagnosticsSecret(makeReq({ authorization: 'Bearer k' }))).toBe(true);
    expect(hasValidDiagnosticsSecret(makeReq())).toBe(false);
  });

  it('is case-insensitive on the "Bearer" scheme', () => {
    process.env.DIAGNOSTICS_SECRET = 'k';
    const res = requireDiagnosticsSecret(makeReq({ authorization: 'bearer k' }));
    expect(res).toBeNull();
  });
});
