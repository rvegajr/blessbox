/**
 * MembershipService - ISP Compliant Implementation
 * 
 * Manages user-organization membership relationships.
 * Implements IMembershipService interface.
 */

import { getDbClient } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import type { IMembershipService } from '@/lib/interfaces/IMembershipService';

export class MembershipService implements IMembershipService {
  private db = getDbClient();

  async ensureMembership(userId: string, organizationId: string, role: string = 'admin'): Promise<void> {
    const now = new Date().toISOString();
    
    await this.db.execute({
      sql: `
        INSERT INTO memberships (id, user_id, organization_id, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, organization_id) DO UPDATE SET updated_at = excluded.updated_at
      `,
      args: [uuidv4(), userId, organizationId, role, now, now],
    });
  }

  async isMember(userId: string, organizationId: string): Promise<boolean> {
    const result = await this.db.execute({
      sql: `SELECT id FROM memberships WHERE user_id = ? AND organization_id = ? LIMIT 1`,
      args: [userId, organizationId],
    });
    return result.rows.length > 0;
  }

  async listOrganizationsForUser(userId: string): Promise<Array<{ id: string }>> {
    const result = await this.db.execute({
      sql: `SELECT organization_id as id FROM memberships WHERE user_id = ? ORDER BY created_at DESC`,
      args: [userId],
    });
    return result.rows as Array<{ id: string }>;
  }
}


