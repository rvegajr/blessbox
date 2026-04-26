/**
 * Authorization tests for registration routes.
 *
 * Covers QA blockers 4 & 5 (qa-report/02-orgs-registrations.md, 07-security.md):
 *   - GET /api/registrations/[id]      — anon 401, cross-org 404
 *   - DELETE /api/registrations/[id]   — cross-org 404 (no delete leaks)
 *   - GET /api/registrations/export    — anon 401, cross-org orgId ignored
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/auth-helper', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/subscriptions', () => ({
  resolveOrganizationForSession: vi.fn(),
}));

const registrationServiceMock = {
  getRegistrationOrganizationId: vi.fn(),
  getRegistration: vi.fn(),
  deleteRegistration: vi.fn(),
  listRegistrations: vi.fn(),
};

vi.mock('@/lib/services/RegistrationService', () => ({
  RegistrationService: vi.fn().mockImplementation(() => registrationServiceMock),
}));

const callerOrg = { id: 'org_caller', contact_email: 'a@b.com' };
const callerSession = { user: { id: 'u1', email: 'a@b.com' }, expires: '2099-01-01' };

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/registrations/[id]', () => {
  it('returns 401 for anonymous request', async () => {
    const { getServerSession } = await import('@/lib/auth-helper');
    (getServerSession as any).mockResolvedValue(null);

    const { GET } = await import('@/app/api/registrations/[id]/route');
    const res = await GET({} as any, { params: Promise.resolve({ id: 'reg_1' }) });
    expect(res.status).toBe(401);
  });

  it('returns 404 (not 403) when registration belongs to another org', async () => {
    const { getServerSession } = await import('@/lib/auth-helper');
    const { resolveOrganizationForSession } = await import('@/lib/subscriptions');
    (getServerSession as any).mockResolvedValue(callerSession);
    (resolveOrganizationForSession as any).mockResolvedValue(callerOrg);
    registrationServiceMock.getRegistrationOrganizationId.mockResolvedValue('org_OTHER');

    const { GET } = await import('@/app/api/registrations/[id]/route');
    const res = await GET({} as any, { params: Promise.resolve({ id: 'reg_1' }) });
    expect(res.status).toBe(404);
    // Service must NOT be invoked for cross-org access — no existence oracle.
    expect(registrationServiceMock.getRegistration).not.toHaveBeenCalled();
  });

  it('returns 200 when registration belongs to caller org', async () => {
    const { getServerSession } = await import('@/lib/auth-helper');
    const { resolveOrganizationForSession } = await import('@/lib/subscriptions');
    (getServerSession as any).mockResolvedValue(callerSession);
    (resolveOrganizationForSession as any).mockResolvedValue(callerOrg);
    registrationServiceMock.getRegistrationOrganizationId.mockResolvedValue(callerOrg.id);
    registrationServiceMock.getRegistration.mockResolvedValue({ id: 'reg_1' });

    const { GET } = await import('@/app/api/registrations/[id]/route');
    const res = await GET({} as any, { params: Promise.resolve({ id: 'reg_1' }) });
    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/registrations/[id]', () => {
  it('returns 404 cross-org and does not call deleteRegistration', async () => {
    const { getServerSession } = await import('@/lib/auth-helper');
    const { resolveOrganizationForSession } = await import('@/lib/subscriptions');
    (getServerSession as any).mockResolvedValue(callerSession);
    (resolveOrganizationForSession as any).mockResolvedValue(callerOrg);
    registrationServiceMock.getRegistrationOrganizationId.mockResolvedValue('org_OTHER');

    const { DELETE } = await import('@/app/api/registrations/[id]/route');
    const res = await DELETE({} as any, { params: Promise.resolve({ id: 'reg_1' }) });
    expect(res.status).toBe(404);
    expect(registrationServiceMock.deleteRegistration).not.toHaveBeenCalled();
  });
});

describe('GET /api/registrations/export', () => {
  function makeReq(orgId?: string) {
    const url = new URL(`http://localhost/api/registrations/export${orgId ? `?orgId=${orgId}` : ''}`);
    return { nextUrl: url } as any;
  }

  it('returns 401 for anonymous request even with orgId param', async () => {
    const { getServerSession } = await import('@/lib/auth-helper');
    (getServerSession as any).mockResolvedValue(null);

    const { GET } = await import('@/app/api/registrations/export/route');
    const res = await GET(makeReq('org_VICTIM'));
    expect(res.status).toBe(401);
    expect(registrationServiceMock.listRegistrations).not.toHaveBeenCalled();
  });

  it('ignores client-supplied orgId and uses session-derived org', async () => {
    const { getServerSession } = await import('@/lib/auth-helper');
    const { resolveOrganizationForSession } = await import('@/lib/subscriptions');
    (getServerSession as any).mockResolvedValue(callerSession);
    (resolveOrganizationForSession as any).mockResolvedValue(callerOrg);
    registrationServiceMock.listRegistrations.mockResolvedValue([]);

    const { GET } = await import('@/app/api/registrations/export/route');
    const res = await GET(makeReq('org_VICTIM'));
    expect(res.status).toBe(200);
    expect(registrationServiceMock.listRegistrations).toHaveBeenCalledWith(callerOrg.id, {});
  });

  it('CSV output starts with UTF-8 BOM and escapes formula injection', async () => {
    const { getServerSession } = await import('@/lib/auth-helper');
    const { resolveOrganizationForSession } = await import('@/lib/subscriptions');
    (getServerSession as any).mockResolvedValue(callerSession);
    (resolveOrganizationForSession as any).mockResolvedValue(callerOrg);
    registrationServiceMock.listRegistrations.mockResolvedValue([
      {
        id: 'reg_1',
        qrCodeId: 'qr_1',
        registeredAt: new Date('2026-01-01T00:00:00Z').toISOString(),
        deliveryStatus: 'pending',
        checkedInAt: null,
        registrationData: JSON.stringify({ name: '=cmd|"/c calc"!A1', note: '+1234' }),
      },
    ]);

    const { GET } = await import('@/app/api/registrations/export/route');
    const res = await GET({ nextUrl: new URL('http://localhost/api/registrations/export?format=csv') } as any);
    expect(res.status).toBe(200);
    const buf = new Uint8Array(await res.arrayBuffer());
    // UTF-8 BOM bytes
    expect(buf[0]).toBe(0xef);
    expect(buf[1]).toBe(0xbb);
    expect(buf[2]).toBe(0xbf);
    const body = new TextDecoder('utf-8').decode(buf);
    // Formula-injection prefix
    expect(body).toContain("'=cmd"); // leading ' before =
    expect(body).toContain("'+1234"); // leading ' before +
  });
});
