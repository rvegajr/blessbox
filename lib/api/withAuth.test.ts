import { describe, it, expect, vi, beforeEach } from 'vitest';

const getServerSession = vi.fn();
const resolveOrganizationForSession = vi.fn();
const isSuperAdminEmail = vi.fn((_email?: string) => false);

vi.mock('@/lib/auth-helper', () => ({ getServerSession: () => getServerSession() }));
vi.mock('@/lib/subscriptions', () => ({ resolveOrganizationForSession: (s: unknown) => resolveOrganizationForSession(s) }));
vi.mock('@/lib/auth', () => ({ isSuperAdminEmail: (e: string) => isSuperAdminEmail(e) }));

import { withAuth, withAuthAndOrg, withSuperAdmin, assertOwnership } from './withAuth';

const sessionOf = (over: Record<string, unknown> = {}) => ({
  user: { id: 'u1', email: 'a@b.com', role: 'user', ...over },
  expires: '',
});
const req = () => ({ nextUrl: { searchParams: new URLSearchParams('organizationId=ATTACKER') } }) as any;

beforeEach(() => {
  vi.clearAllMocks();
  isSuperAdminEmail.mockReturnValue(false);
});

describe('withAuthAndOrg', () => {
  it('401s and does not call the handler when there is no session', async () => {
    getServerSession.mockResolvedValue(null);
    const handler = vi.fn();
    const res = await withAuthAndOrg(handler)(req());
    expect(res.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it('401s when the session has no email', async () => {
    getServerSession.mockResolvedValue(sessionOf({ email: '' }));
    const handler = vi.fn();
    const res = await withAuthAndOrg(handler)(req());
    expect(res.status).toBe(401);
  });

  it('409s and does not call the handler when no active org resolves', async () => {
    getServerSession.mockResolvedValue(sessionOf());
    resolveOrganizationForSession.mockResolvedValue(null);
    const handler = vi.fn();
    const res = await withAuthAndOrg(handler)(req());
    expect(res.status).toBe(409);
    expect(handler).not.toHaveBeenCalled();
  });

  it('injects the session-resolved org and IGNORES any client organizationId', async () => {
    getServerSession.mockResolvedValue(sessionOf());
    resolveOrganizationForSession.mockResolvedValue({ id: 'org-real', contact_email: 'a@b.com' });
    const handler = vi.fn(async (_req: any, _auth: any, _ctx?: any) => new Response('ok', { status: 200 }));
    const res = await withAuthAndOrg(handler)(req());
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
    const auth = handler.mock.calls[0][1];
    expect(auth.organization.id).toBe('org-real');
    expect(auth.organization.id).not.toBe('ATTACKER');
    expect(auth.session.user.email).toBe('a@b.com');
  });

  it('forwards the dynamic route context (params) untouched as the 3rd arg', async () => {
    getServerSession.mockResolvedValue(sessionOf());
    resolveOrganizationForSession.mockResolvedValue({ id: 'org-real', contact_email: 'a@b.com' });
    const ctx = { params: Promise.resolve({ id: 'x' }) };
    const handler = vi.fn(async (_req: any, _auth: any, _ctx?: any) => new Response('ok'));
    await withAuthAndOrg(handler)(req(), ctx as any);
    expect(handler.mock.calls[0][2]).toBe(ctx);
  });
});

describe('withAuth role gating', () => {
  it('allows any authenticated user when no role is required', async () => {
    getServerSession.mockResolvedValue(sessionOf());
    const handler = vi.fn(async () => new Response('ok'));
    const res = await withAuth(handler)(req());
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalled();
  });

  it('403s a non-superadmin for a super_admin route', async () => {
    getServerSession.mockResolvedValue(sessionOf({ role: 'user' }));
    const handler = vi.fn();
    const res = await withAuth(handler, { role: 'super_admin' })(req());
    expect(res.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });

  it('allows a super_admin role for a super_admin route', async () => {
    getServerSession.mockResolvedValue(sessionOf({ role: 'super_admin' }));
    const handler = vi.fn(async () => new Response('ok'));
    const res = await withAuth(handler, { role: 'super_admin' })(req());
    expect(res.status).toBe(200);
  });

  it('withSuperAdmin allows by email allow-list even without the role', async () => {
    getServerSession.mockResolvedValue(sessionOf({ role: 'user' }));
    isSuperAdminEmail.mockReturnValue(true);
    const handler = vi.fn(async () => new Response('ok'));
    const res = await withSuperAdmin(handler)(req());
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalled();
  });

  it('withSuperAdmin 403s when neither role nor email qualifies', async () => {
    getServerSession.mockResolvedValue(sessionOf({ role: 'user' }));
    isSuperAdminEmail.mockReturnValue(false);
    const res = await withSuperAdmin(vi.fn())(req());
    expect(res.status).toBe(403);
  });
});

describe('assertOwnership', () => {
  const auth = { session: sessionOf() as any, organization: { id: 'org-1', contact_email: 'a@b.com' } };
  const superAuth = { session: sessionOf({ role: 'super_admin' }) as any, organization: { id: 'org-1', contact_email: 'a@b.com' } };

  it('404s when the resource does not exist (ownerOrgId null)', async () => {
    const r = await assertOwnership(auth, null);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(404);
  });

  it('404s on a cross-tenant resource (no oracle)', async () => {
    const r = await assertOwnership(auth, 'org-OTHER');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.response.status).toBe(404);
  });

  it('allows a super_admin to access a cross-tenant resource', async () => {
    const r = await assertOwnership(superAuth, 'org-OTHER');
    expect(r.ok).toBe(true);
  });

  it('allows the owner', async () => {
    const r = await assertOwnership(auth, 'org-1');
    expect(r.ok).toBe(true);
  });
});
