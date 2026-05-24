/**
 * IOrganizationLoginTracker - Interface Segregation Principle Compliant
 *
 * Single responsibility: keep `organizations.last_login_at` accurate so the
 * super-admin "View Details" page (Issue #28) shows the real most recent
 * login for each organization.
 *
 * The column already exists in the schema and is read by
 * `app/admin/organizations/[id]/page.tsx`, but nothing in the codebase
 * was writing to it — the page therefore always shows "Never" or a stale
 * value.
 *
 * Split out from `IAuthService`/`IOrganizationService` because this concern
 * does not belong to either: AuthService creates sessions, OrganizationService
 * does CRUD. Login tracking is a cross-cutting hook that runs after a
 * successful authentication.
 */

export interface IOrganizationLoginTracker {
  /**
   * Record that `userId` just logged in. If `organizationId` is provided
   * (active-org cookie / membership selection), only that org is updated.
   * Otherwise, every org the user is a member of has its `last_login_at`
   * bumped — this matches the user-facing semantics of "anyone in the org
   * logged in".
   *
   * Idempotent and best-effort: callers MUST NOT fail their auth flow if
   * this throws. The implementation logs and swallows errors at the call
   * site by convention.
   */
  recordLogin(userId: string, organizationId?: string): Promise<void>;
}
