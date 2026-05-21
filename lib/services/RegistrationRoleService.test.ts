/**
 * RegistrationRoleService Tests - TDD Approach
 * Pure logic, no DB. Extracts/normalizes the optional `role` field stored
 * inside the `registrations.registration_data` JSON blob.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RegistrationRoleService } from './RegistrationRoleService';

interface FakeReg {
  id: string;
  registrationData: Record<string, unknown>;
}

describe('RegistrationRoleService', () => {
  let service: RegistrationRoleService;

  beforeEach(() => {
    service = new RegistrationRoleService();
  });

  describe('extractRole', () => {
    it('returns the role string when present and well-formed', () => {
      expect(service.extractRole({ role: 'volunteer' })).toBe('volunteer');
      expect(service.extractRole({ role: 'attendee' })).toBe('attendee');
    });

    it('lowercases and trims role values', () => {
      expect(service.extractRole({ role: 'Volunteer' })).toBe('volunteer');
      expect(service.extractRole({ role: '  ATTENDEE  ' })).toBe('attendee');
      expect(service.extractRole({ role: 'Co-Organizer' })).toBe('co-organizer');
    });

    it('returns null when role is missing', () => {
      expect(service.extractRole({ name: 'Jane' })).toBeNull();
      expect(service.extractRole({})).toBeNull();
    });

    it('returns null for empty / whitespace-only role', () => {
      expect(service.extractRole({ role: '' })).toBeNull();
      expect(service.extractRole({ role: '   ' })).toBeNull();
    });

    it('returns null when role is not a string', () => {
      expect(service.extractRole({ role: 123 as unknown })).toBeNull();
      expect(service.extractRole({ role: null })).toBeNull();
      expect(service.extractRole({ role: ['volunteer'] as unknown })).toBeNull();
    });

    it('rejects roles with disallowed characters (only [a-z0-9_-] permitted)', () => {
      expect(service.extractRole({ role: 'volunteer!' })).toBeNull();
      expect(service.extractRole({ role: 'volun teer' })).toBeNull();
      expect(service.extractRole({ role: '<script>' })).toBeNull();
    });

    it('caps role length at 32 characters to prevent abuse', () => {
      const longRole = 'a'.repeat(40);
      expect(service.extractRole({ role: longRole })).toBeNull();
      const okRole = 'a'.repeat(32);
      expect(service.extractRole({ role: okRole })).toBe(okRole);
    });

    it('handles non-object inputs gracefully', () => {
      expect(service.extractRole(null as unknown as Record<string, unknown>)).toBeNull();
      expect(service.extractRole(undefined as unknown as Record<string, unknown>)).toBeNull();
      expect(service.extractRole('string' as unknown as Record<string, unknown>)).toBeNull();
    });
  });

  describe('groupByRole', () => {
    it('groups registrations by their extracted role', () => {
      const regs: FakeReg[] = [
        { id: 'r1', registrationData: { role: 'volunteer' } },
        { id: 'r2', registrationData: { role: 'attendee' } },
        { id: 'r3', registrationData: { role: 'volunteer' } },
        { id: 'r4', registrationData: {} },
      ];
      const grouped = service.groupByRole(regs);
      expect(Object.keys(grouped).sort()).toEqual(['attendee', 'unspecified', 'volunteer']);
      expect(grouped.volunteer).toHaveLength(2);
      expect(grouped.attendee).toHaveLength(1);
      expect(grouped.unspecified).toHaveLength(1);
    });

    it('returns empty object when input is empty', () => {
      expect(service.groupByRole([])).toEqual({});
    });
  });

  describe('listObservedRoles', () => {
    it('returns a deduped sorted list of valid roles seen in the input', () => {
      const regs: FakeReg[] = [
        { id: 'a', registrationData: { role: 'volunteer' } },
        { id: 'b', registrationData: { role: 'attendee' } },
        { id: 'c', registrationData: { role: 'Volunteer' } },
        { id: 'd', registrationData: { role: 'organizer' } },
      ];
      expect(service.listObservedRoles(regs)).toEqual([
        'attendee',
        'organizer',
        'volunteer',
      ]);
    });

    it('excludes invalid / missing roles', () => {
      const regs: FakeReg[] = [
        { id: 'a', registrationData: {} },
        { id: 'b', registrationData: { role: '!!!' } },
        { id: 'c', registrationData: { role: 'attendee' } },
      ];
      expect(service.listObservedRoles(regs)).toEqual(['attendee']);
    });
  });

  describe('matchesRole', () => {
    it('returns true for case-insensitive match', () => {
      const reg: FakeReg = { id: 'r1', registrationData: { role: 'Volunteer' } };
      expect(service.matchesRole(reg, 'volunteer')).toBe(true);
      expect(service.matchesRole(reg, 'VOLUNTEER')).toBe(true);
    });

    it('returns false when registration has no role', () => {
      const reg: FakeReg = { id: 'r1', registrationData: {} };
      expect(service.matchesRole(reg, 'volunteer')).toBe(false);
    });

    it('treats empty filter as "match all"', () => {
      const regWithRole: FakeReg = { id: 'r1', registrationData: { role: 'volunteer' } };
      const regWithoutRole: FakeReg = { id: 'r2', registrationData: {} };
      expect(service.matchesRole(regWithRole, '')).toBe(true);
      expect(service.matchesRole(regWithoutRole, '')).toBe(true);
    });
  });
});
