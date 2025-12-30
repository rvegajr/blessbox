/**
 * IMembershipService - Interface Segregation Principle
 * 
 * Manages user-organization membership relationships.
 */

export interface IMembershipService {
  /**
   * Ensure a membership exists (idempotent - creates if not exists, updates timestamp if exists)
   */
  ensureMembership(userId: string, organizationId: string, role?: string): Promise<void>;

  /**
   * Check if user is a member of organization
   */
  isMember(userId: string, organizationId: string): Promise<boolean>;

  /**
   * List all organizations for a user (ordered by creation date, newest first)
   */
  listOrganizationsForUser(userId: string): Promise<Array<{ id: string }>>;
}


