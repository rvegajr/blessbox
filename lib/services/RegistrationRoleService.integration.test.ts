/**
 * Integration test for the role-filter behavior used by the check-in search API.
 * Exercises RegistrationRoleService against shapes returned by the SQL layer
 * (JSON-string registration_data, mixed casing, missing roles).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RegistrationRoleService } from './RegistrationRoleService';

interface SearchHit {
  id: string;
  registrationData: Record<string, unknown>;
}

function fromRow(id: string, raw: string | null): SearchHit {
  const data = raw ? JSON.parse(raw) : {};
  return { id, registrationData: data };
}

describe('RegistrationRoleService — integration with check-in search shape', () => {
  let service: RegistrationRoleService;

  beforeEach(() => {
    service = new RegistrationRoleService();
  });

  it('filters a mixed list of registrations down to a single role', () => {
    const rows: SearchHit[] = [
      fromRow('r1', JSON.stringify({ name: 'Alice', role: 'volunteer' })),
      fromRow('r2', JSON.stringify({ name: 'Bob', role: 'attendee' })),
      fromRow('r3', JSON.stringify({ name: 'Carol', role: 'Volunteer' })),
      fromRow('r4', JSON.stringify({ name: 'Dan' })),
      fromRow('r5', null),
    ];

    const filtered = rows.filter((r) => service.matchesRole(r, 'volunteer'));
    expect(filtered.map((r) => r.id)).toEqual(['r1', 'r3']);
  });

  it('empty role filter returns all rows (matches the API contract)', () => {
    const rows: SearchHit[] = [
      fromRow('r1', JSON.stringify({ role: 'volunteer' })),
      fromRow('r2', JSON.stringify({})),
    ];
    const filtered = rows.filter((r) => service.matchesRole(r, ''));
    expect(filtered).toHaveLength(2);
  });

  it('listObservedRoles produces a UI-ready dropdown source', () => {
    const rows: SearchHit[] = [
      fromRow('r1', JSON.stringify({ role: 'volunteer' })),
      fromRow('r2', JSON.stringify({ role: 'attendee' })),
      fromRow('r3', JSON.stringify({ role: 'organizer' })),
      fromRow('r4', JSON.stringify({ role: 'attendee' })),
      fromRow('r5', JSON.stringify({})),
    ];
    expect(service.listObservedRoles(rows)).toEqual(['attendee', 'organizer', 'volunteer']);
  });

  it('extractRole gracefully handles malformed JSON resolved to {}', () => {
    expect(service.extractRole({})).toBeNull();
  });

  it('survives weird incoming role types without throwing', () => {
    const cases: Record<string, unknown>[] = [
      { role: { nested: 'value' } },
      { role: true },
      { role: ['volunteer', 'attendee'] },
      { role: 0 },
    ];
    for (const c of cases) {
      expect(service.extractRole(c)).toBeNull();
    }
  });
});
