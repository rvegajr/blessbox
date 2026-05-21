/**
 * IRegistrationRoleService - Interface Segregation Principle Compliant.
 * Single responsibility: extract & filter the optional `role` field stored
 * inside the registrations.registration_data JSON blob.
 *
 * Read-only by design — the role itself is set by the registrant through
 * the form-builder field, never written by this service.
 */

/** Minimal shape of a registration record needed to extract its role. */
export interface RoleAwareRegistration {
  id: string;
  registrationData: Record<string, unknown>;
}

export interface IRegistrationRoleReader {
  /**
   * Pull the normalized role string out of registration_data.
   * Returns null when missing, blank, malformed, or longer than 32 chars.
   */
  extractRole(registrationData: Record<string, unknown>): string | null;

  /**
   * Group registrations by role. Registrations without a valid role land
   * in the "unspecified" bucket.
   */
  groupByRole<T extends RoleAwareRegistration>(registrations: T[]): Record<string, T[]>;

  /**
   * Return the sorted, deduped list of valid roles observed in the input.
   * Useful for populating filter dropdowns from live data.
   */
  listObservedRoles<T extends RoleAwareRegistration>(registrations: T[]): string[];

  /**
   * True when the registration's role matches the provided filter
   * (case-insensitive). An empty filter matches everything.
   */
  matchesRole<T extends RoleAwareRegistration>(registration: T, filter: string): boolean;
}

export type IRegistrationRoleService = IRegistrationRoleReader;
