/**
 * Centralized authorization wrappers for API route handlers.
 *
 * Makes the correct multi-tenant pattern the DEFAULT: the active organization is
 * always derived from the session and a client-supplied organizationId is never
 * trusted. Replaces ~per-route hand-rolled auth that some routes forgot entirely
 * (the registrations GET PII leak, the events IDOR).
 *
 *   withAuth(handler, {role?})       — 401 if unauthenticated, 403 if role unmet
 *   withAuthAndOrg(handler, {role?}) — + resolves the active org (409 if none),
 *                                       injects { session, organization }
 *   withSuperAdmin(handler)          — super_admin by role OR isSuperAdminEmail
 *   assertOwnership(auth, ownerOrgId)— single 404 on existence/ownership mismatch
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, type Session } from '@/lib/auth-helper';
import { resolveOrganizationForSession } from '@/lib/subscriptions';
import { isSuperAdminEmail } from '@/lib/auth';
import type { ActiveOrganization } from '@/lib/interfaces/IRouteAuthorizer';

export interface AuthedCtx { session: Session }
export interface AuthedOrgCtx extends AuthedCtx { organization: ActiveOrganization }

export interface WithAuthOptions {
  /** Minimum role required. Omit = any authenticated user. */
  role?: 'user' | 'admin' | 'super_admin';
  /** For super_admin: also accept the email allow-list (isSuperAdminEmail). */
  superAdminByEmail?: boolean;
}

type AnyCtx = unknown;
type Handler<C> = (req: NextRequest, auth: C, ctx?: AnyCtx) => Promise<Response> | Response;

const unauthorized = () => NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
const forbidden = () => NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
const orgRequired = () => NextResponse.json({ success: false, error: 'Organization selection required' }, { status: 409 });

function roleSatisfied(session: Session, opts: WithAuthOptions): boolean {
  if (!opts.role) return true;
  const role = session.user.role;
  if (opts.role === 'super_admin') {
    return role === 'super_admin' || (opts.superAdminByEmail === true && isSuperAdminEmail(session.user.email));
  }
  if (opts.role === 'admin') return role === 'admin' || role === 'super_admin';
  return true; // 'user' — any authenticated session
}

export function withAuth<C extends AnyCtx = AnyCtx>(handler: Handler<AuthedCtx>, opts: WithAuthOptions = {}) {
  return async (req: NextRequest, ctx?: C): Promise<Response> => {
    const session = await getServerSession();
    if (!session?.user?.email) return unauthorized();
    if (!roleSatisfied(session, opts)) return forbidden();
    return handler(req, { session }, ctx);
  };
}

export function withAuthAndOrg<C extends AnyCtx = AnyCtx>(handler: Handler<AuthedOrgCtx>, opts: WithAuthOptions = {}) {
  return async (req: NextRequest, ctx?: C): Promise<Response> => {
    const session = await getServerSession();
    if (!session?.user?.email) return unauthorized();
    if (!roleSatisfied(session, opts)) return forbidden();
    const organization = await resolveOrganizationForSession(session);
    if (!organization) return orgRequired();
    return handler(req, { session, organization }, ctx);
  };
}

export const withSuperAdmin = <C extends AnyCtx = AnyCtx>(handler: Handler<AuthedCtx>) =>
  withAuth<C>(handler, { role: 'super_admin', superAdminByEmail: true });

/**
 * Collapse existence + ownership into a single 404 to avoid a cross-tenant
 * existence oracle. super_admin bypasses ownership. Pass the resource's owning
 * organizationId (null if the resource doesn't exist).
 */
export async function assertOwnership(
  auth: AuthedOrgCtx,
  ownerOrgId: string | null,
): Promise<{ ok: true } | { ok: false; response: Response }> {
  const superAdmin = auth.session.user.role === 'super_admin';
  if (!ownerOrgId || (ownerOrgId !== auth.organization.id && !superAdmin)) {
    return { ok: false, response: NextResponse.json({ success: false, error: 'Not found' }, { status: 404 }) };
  }
  return { ok: true };
}
