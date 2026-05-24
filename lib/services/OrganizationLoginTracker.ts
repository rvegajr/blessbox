/**
 * OrganizationLoginTracker
 *
 * Implementation of `IOrganizationLoginTracker` that updates
 * `organizations.last_login_at` whenever a user authenticates. Issue #28:
 * the column existed but had no writer, so the super-admin "View Details"
 * panel always showed "Never" / stale values.
 *
 * Design:
 *   - When an explicit `organizationId` is given (active-org cookie set on
 *     login), update only that org. This is the common case.
 *   - When no org is provided (e.g. user with multiple orgs picking later)
 *     update every org the user is a member of so the admin still sees an
 *     accurate "any user logged in" timestamp.
 *
 * The implementation reads memberships through the `memberships` table to
 * avoid coupling to `MembershipService` internals.
 */

import { getDbClient, nowIso } from '../db';
import type { IOrganizationLoginTracker } from '../interfaces/IOrganizationLoginTracker';

export class OrganizationLoginTracker implements IOrganizationLoginTracker {
  private db = getDbClient();

  async recordLogin(userId: string, organizationId?: string): Promise<void> {
    if (!userId) return;
    const now = nowIso();

    if (organizationId) {
      await this.db.execute({
        sql: `UPDATE organizations
              SET last_login_at = ?, updated_at = ?
              WHERE id = ?`,
        args: [now, now, organizationId],
      });
      return;
    }

    const memberships = await this.db.execute({
      sql: `SELECT organization_id FROM memberships WHERE user_id = ?`,
      args: [userId],
    });

    const orgIds = (memberships.rows as any[])
      .map((row) => row.organization_id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);

    for (const orgId of orgIds) {
      await this.db.execute({
        sql: `UPDATE organizations
              SET last_login_at = ?, updated_at = ?
              WHERE id = ?`,
        args: [now, now, orgId],
      });
    }
  }
}
