/**
 * AuthService security regression tests (Prod-readiness Phase 1).
 *
 * Covers two CONFIRMED cross-tenant vulnerabilities:
 *   1. active-org IDOR — getSession() must NOT honor an attacker-set
 *      bb_active_org_id cookie for an org the user is not a member of.
 *   2. verify-code org-takeover — verifyCodeAndCreateSession() must NOT grant
 *      an 'admin' membership from a client-supplied organizationId unless the
 *      verified email is the org's contact email or the user is already a member.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SignJWT } from 'jose';

const TEST_SECRET = 'test-secret-please-change-0123456789';
process.env.NEXTAUTH_SECRET = TEST_SECRET;

// ---- in-memory data model driving a smart db mock ----
type Org = { id: string; contact_email: string };
const state = {
  orgs: new Map<string, Org>(),
  users: new Map<string, { id: string; email: string }>(),
  memberships: [] as Array<{ user_id: string; organization_id: string; role: string }>,
  code: '123456',
  codeExists: true,
};

// Hoisted so the mock is initialized before AuthService.ts instantiates its
// singleton (which calls getDbClient()) at import time.
const mockDb = vi.hoisted(() => ({ execute: vi.fn() }));
vi.mock('../db', () => ({ getDbClient: () => mockDb }));

// Controllable cookie jar for next/headers.
const jar = new Map<string, string>();
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      const v = jar.get(name);
      return v === undefined ? undefined : { value: v };
    },
  }),
}));

import { AuthService } from './AuthService';

function dbImpl({ sql, args }: { sql: string; args: unknown[] }) {
  const s = String(sql);
  if (/SELECT .* FROM verification_codes/i.test(s)) {
    return {
      rows: state.codeExists
        ? [
            {
              id: 'vc1',
              email: args[0],
              code: state.code,
              attempts: 0,
              created_at: new Date().toISOString(),
              expires_at: new Date(Date.now() + 900_000).toISOString(),
              verified: 0,
            },
          ]
        : [],
    };
  }
  if (/UPDATE verification_codes/i.test(s)) return { rows: [] };
  if (/FROM users WHERE email/i.test(s)) {
    const u = state.users.get(String(args[0]));
    return { rows: u ? [{ id: u.id, email: u.email, name: null }] : [] };
  }
  if (/INSERT INTO users/i.test(s)) {
    const [id, email] = args as string[];
    state.users.set(email, { id, email });
    return { rows: [] };
  }
  if (/SELECT contact_email FROM organizations/i.test(s)) {
    const org = state.orgs.get(String(args[0]));
    return { rows: org ? [{ contact_email: org.contact_email }] : [] };
  }
  if (/SELECT id FROM memberships/i.test(s)) {
    const [uid, oid] = args as string[];
    const m = state.memberships.find((x) => x.user_id === uid && x.organization_id === oid);
    return { rows: m ? [{ id: 'm' }] : [] };
  }
  if (/INSERT INTO memberships/i.test(s)) {
    const [, uid, oid, role] = args as string[];
    state.memberships.push({ user_id: uid, organization_id: oid, role });
    return { rows: [] };
  }
  if (/UPDATE organizations/i.test(s)) return { rows: [] };
  return { rows: [] };
}

async function signSession(payload: Record<string, unknown>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(TEST_SECRET));
}

beforeEach(() => {
  mockDb.execute.mockReset();
  mockDb.execute.mockImplementation(dbImpl as any);
  jar.clear();
  state.orgs.clear();
  state.users.clear();
  state.memberships = [];
  state.code = '123456';
  state.codeExists = true;
});

describe('AuthService.getSession — active-org IDOR', () => {
  it('IGNORES bb_active_org_id when the user is NOT a member of that org', async () => {
    const token = await signSession({ sub: 'user-1', email: 'a@example.com', organizationId: 'org-own', role: 'user' });
    jar.set('bb_session', token);
    jar.set('bb_active_org_id', 'org-victim'); // attacker-forged, no membership

    const session = await new AuthService().getSession();

    expect(session).not.toBeNull();
    expect(session!.user.organizationId).toBe('org-own'); // fell back to JWT org
    expect(session!.user.organizationId).not.toBe('org-victim');
  });

  it('HONORS bb_active_org_id when the user IS a member', async () => {
    state.memberships.push({ user_id: 'user-1', organization_id: 'org-second', role: 'admin' });
    const token = await signSession({ sub: 'user-1', email: 'a@example.com', organizationId: 'org-own', role: 'user' });
    jar.set('bb_session', token);
    jar.set('bb_active_org_id', 'org-second');

    const session = await new AuthService().getSession();

    expect(session!.user.organizationId).toBe('org-second');
  });

  it('lets a super_admin act on any org without a membership row', async () => {
    const token = await signSession({ sub: 'admin-1', email: 'root@example.com', organizationId: 'org-own', role: 'super_admin' });
    jar.set('bb_session', token);
    jar.set('bb_active_org_id', 'org-anything');

    const session = await new AuthService().getSession();

    expect(session!.user.organizationId).toBe('org-anything');
  });
});

describe('AuthService.verifyCodeAndCreateSession — org-takeover', () => {
  it('does NOT grant membership for a foreign org id (contact_email mismatch, not a member)', async () => {
    state.orgs.set('victim-org', { id: 'victim-org', contact_email: 'owner@victim.com' });

    const res = await new AuthService().verifyCodeAndCreateSession('attacker@evil.com', '123456', {
      organizationId: 'victim-org',
    });

    expect(res.success).toBe(true); // login still succeeds
    const granted = state.memberships.some((m) => m.organization_id === 'victim-org');
    expect(granted).toBe(false); // but NO membership on the victim org
    expect(res.session!.user.organizationId).toBeUndefined();
  });

  it('DOES grant membership when the verified email is the org contact (onboarding)', async () => {
    state.orgs.set('my-org', { id: 'my-org', contact_email: 'founder@church.org' });

    const res = await new AuthService().verifyCodeAndCreateSession('founder@church.org', '123456', {
      organizationId: 'my-org',
    });

    expect(res.success).toBe(true);
    const granted = state.memberships.find((m) => m.organization_id === 'my-org');
    expect(granted).toBeTruthy();
    expect(granted!.role).toBe('admin');
    expect(res.session!.user.organizationId).toBe('my-org');
  });

  it('DOES grant/keep access when the user is already a member', async () => {
    state.orgs.set('shared-org', { id: 'shared-org', contact_email: 'someone-else@org.com' });
    state.users.set('member@org.com', { id: 'user-9', email: 'member@org.com' });
    state.memberships.push({ user_id: 'user-9', organization_id: 'shared-org', role: 'admin' });

    const res = await new AuthService().verifyCodeAndCreateSession('member@org.com', '123456', {
      organizationId: 'shared-org',
    });

    expect(res.success).toBe(true);
    expect(res.session!.user.organizationId).toBe('shared-org');
  });
});
