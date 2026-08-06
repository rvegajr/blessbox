/**
 * Narrow authorization seams (ISP) for API route handlers. Each is single-purpose
 * so a route depends only on what it needs — an auth-only route never pulls in the
 * org resolver, etc. Concrete adapters are thin wrappers over existing functions
 * (getServerSession, resolveOrganizationForSession, isSuperAdminEmail).
 */
import type { Session } from '@/lib/auth-helper';

/** The org shape resolveOrganizationForSession returns. */
export interface ActiveOrganization {
  id: string;
  contact_email: string;
}

/** Seam: request → authenticated session (the 401 source). */
export interface ISessionResolver {
  resolve(): Promise<Session | null>;
}

/** Seam: session → its active org (the 409 source). Never trusts client input. */
export interface IOrgResolver {
  resolveForSession(session: Session): Promise<ActiveOrganization | null>;
}

/** Seam: pure role predicates over a session — no I/O. */
export interface IRoleGate {
  isSuperAdmin(session: Session): boolean;
}
