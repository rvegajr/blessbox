/**
 * RegistrationRoleService — pure logic, no DB.
 * Extracts and normalizes the `role` field from registration_data JSON.
 */

import type {
  IRegistrationRoleService,
  RoleAwareRegistration,
} from '../interfaces/IRegistrationRoleService';

const MAX_ROLE_LENGTH = 32;
const ROLE_PATTERN = /^[a-z0-9_-]+$/;

export class RegistrationRoleService implements IRegistrationRoleService {
  extractRole(registrationData: Record<string, unknown>): string | null {
    if (!registrationData || typeof registrationData !== 'object' || Array.isArray(registrationData)) {
      return null;
    }
    const raw = (registrationData as Record<string, unknown>).role;
    if (typeof raw !== 'string') return null;
    const normalized = raw.trim().toLowerCase();
    if (normalized.length === 0) return null;
    if (normalized.length > MAX_ROLE_LENGTH) return null;
    if (!ROLE_PATTERN.test(normalized)) return null;
    return normalized;
  }

  groupByRole<T extends RoleAwareRegistration>(registrations: T[]): Record<string, T[]> {
    const groups: Record<string, T[]> = {};
    for (const reg of registrations) {
      const role = this.extractRole(reg.registrationData) ?? 'unspecified';
      if (!groups[role]) groups[role] = [];
      groups[role].push(reg);
    }
    return groups;
  }

  listObservedRoles<T extends RoleAwareRegistration>(registrations: T[]): string[] {
    const seen = new Set<string>();
    for (const reg of registrations) {
      const role = this.extractRole(reg.registrationData);
      if (role) seen.add(role);
    }
    return [...seen].sort();
  }

  matchesRole<T extends RoleAwareRegistration>(registration: T, filter: string): boolean {
    if (!filter || filter.trim() === '') return true;
    const normalizedFilter = filter.trim().toLowerCase();
    const role = this.extractRole(registration.registrationData);
    if (!role) return false;
    return role === normalizedFilter;
  }
}
