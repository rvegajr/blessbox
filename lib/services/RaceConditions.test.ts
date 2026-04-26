// Concurrency tests for the race-condition fixes documented in
// qa-report/03-qr-checkin-classes.md and qa-report/fix-races.md.
//
// These tests use a real in-memory libsql client (file::memory:?cache=shared)
// and spawn parallel operations via Promise.all to assert exactly one wins
// and the rest see a 409-style "already" error.

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { createClient, type Client } from '@libsql/client';
import { ensureLibsqlSchema } from '../database/bootstrap';
import { RegistrationService } from './RegistrationService';
import { ClassService } from './ClassService';

// Each test file gets its own shared in-memory db so other tests don't collide.
// Use a unique on-disk temp file per run; libsql node client doesn't support
// in-memory shared-cache URL params. The file is created in os.tmpdir() and
// cleaned up best-effort after the suite.
import { tmpdir } from 'os';
import { join } from 'path';
import { unlinkSync } from 'fs';
const DB_PATH = join(tmpdir(), `blessbox-races-${process.pid}-${Date.now()}.db`);
const DB_URL = `file:${DB_PATH}`;

let client: Client;

async function resetTables() {
  // Wipe rows we touch between tests; keep schema in place.
  await client.execute('DELETE FROM enrollments;');
  await client.execute('DELETE FROM participants;');
  await client.execute('DELETE FROM classes;');
  await client.execute('DELETE FROM registrations;');
  await client.execute('DELETE FROM qr_code_sets;');
  await client.execute('DELETE FROM organizations;');
}

beforeAll(async () => {
  await ensureLibsqlSchema({ url: DB_URL, authToken: '' });
  client = createClient({ url: DB_URL, authToken: '' });
});

beforeEach(async () => {
  await resetTables();
});

afterAll(() => {
  try { unlinkSync(DB_PATH); } catch { /* best effort */ }
});

describe('Concurrency: checkInRegistration', () => {
  it('10 parallel check-ins on the same registration: exactly one succeeds', async () => {
    // Seed an org, qr_code_set, and a registration row directly.
    await client.execute({
      sql: `INSERT INTO organizations (id, name, contact_email) VALUES (?, ?, ?)`,
      args: ['org-race', 'Race Org', 'race@example.com']
    });
    await client.execute({
      sql: `INSERT INTO qr_code_sets (id, organization_id, name, language, form_fields, qr_codes, is_active)
            VALUES (?, ?, ?, ?, ?, ?, 1)`,
      args: ['qrs-race', 'org-race', 'set', 'en', '[]', '[]']
    });
    await client.execute({
      sql: `INSERT INTO registrations (id, qr_code_set_id, qr_code_id, organization_id, registration_data, delivery_status, registered_at, token_status)
            VALUES (?, ?, ?, ?, ?, 'pending', ?, 'active')`,
      args: ['reg-race', 'qrs-race', 'qr-1', 'org-race', '{}', new Date().toISOString()]
    });

    const svc = new RegistrationService();
    (svc as any).db = client; // bind to our isolated in-memory db

    const results = await Promise.allSettled(
      Array.from({ length: 10 }, (_, i) =>
        svc.checkInRegistration('reg-race', `staff-${i}`)
      )
    );

    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[];

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(9);
    for (const r of rejected) {
      expect(String(r.reason?.message || r.reason)).toMatch(/already checked in/i);
    }

    const verify = await client.execute({
      sql: 'SELECT checked_in_at, checked_in_by FROM registrations WHERE id = ?',
      args: ['reg-race']
    });
    const row = verify.rows[0] as any;
    expect(row.checked_in_at).toBeTruthy();
    expect(row.checked_in_by).toMatch(/^staff-\d+$/);
  });
});

describe('Concurrency: enrollment capacity', () => {
  it('10 parallel enrollments at capacity-1 + capacity unique participants: exactly capacity rows survive', async () => {
    // Seed org + class with capacity = 1.
    await client.execute({
      sql: `INSERT INTO organizations (id, name, contact_email) VALUES (?, ?, ?)`,
      args: ['org-cap', 'Cap Org', 'cap@example.com']
    });
    await client.execute({
      sql: `INSERT INTO classes (id, organization_id, name, capacity, timezone, status)
            VALUES (?, ?, ?, ?, 'UTC', 'active')`,
      args: ['cls-cap', 'org-cap', 'Capped Class', 1]
    });

    // 10 distinct participants so duplicate-constraint isn't the gating factor.
    const partIds: string[] = [];
    for (let i = 0; i < 10; i++) {
      const pid = `p-${i}`;
      partIds.push(pid);
      await client.execute({
        sql: `INSERT INTO participants (id, organization_id, first_name, last_name, email, status)
              VALUES (?, ?, ?, ?, ?, 'active')`,
        args: [pid, 'org-cap', 'First', String(i), `p${i}@example.com`]
      });
    }

    const classService = new ClassService();
    (classService as any).db = client;

    // Mirror the route's race-safe atomic INSERT-with-capacity-check.
    async function tryEnroll(participantId: string) {
      const cls = await classService.getClass('cls-cap');
      if (!cls) throw new Error('no class');
      const inserted = await classService.enrollParticipantWithCapacity(
        {
          participant_id: participantId,
          class_id: 'cls-cap',
          session_id: undefined,
          enrollment_status: 'pending',
          enrolled_at: new Date().toISOString(),
          notes: ''
        },
        cls.capacity
      );
      if (!inserted) throw new Error('Class capacity reached');
      return inserted;
    }

    const results = await Promise.allSettled(partIds.map(tryEnroll));
    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[];

    expect(fulfilled).toHaveLength(1);
    expect(rejected.length).toBe(9);
    for (const r of rejected) {
      expect(String(r.reason?.message || r.reason)).toMatch(/capacity/i);
    }

    const final = await client.execute({
      sql: `SELECT COUNT(*) AS c FROM enrollments WHERE class_id = ? AND enrollment_status != 'cancelled'`,
      args: ['cls-cap']
    });
    expect(Number((final.rows[0] as any).c)).toBe(1);
  });

  it('duplicate enrollment for the same participant is blocked by unique index', async () => {
    await client.execute({
      sql: `INSERT INTO organizations (id, name, contact_email) VALUES (?, ?, ?)`,
      args: ['org-dup', 'Dup Org', 'dup@example.com']
    });
    await client.execute({
      sql: `INSERT INTO classes (id, organization_id, name, capacity, timezone, status)
            VALUES (?, ?, ?, ?, 'UTC', 'active')`,
      args: ['cls-dup', 'org-dup', 'Dup Class', 100]
    });
    await client.execute({
      sql: `INSERT INTO participants (id, organization_id, first_name, last_name, email, status)
            VALUES (?, ?, ?, ?, ?, 'active')`,
      args: ['p-dup', 'org-dup', 'D', 'U', 'd@example.com']
    });

    const classService = new ClassService();
    (classService as any).db = client;

    const enroll = () => classService.enrollParticipant({
      participant_id: 'p-dup',
      class_id: 'cls-dup',
      session_id: undefined,
      enrollment_status: 'pending',
      enrolled_at: new Date().toISOString(),
      notes: ''
    });

    await enroll();
    await expect(enroll()).rejects.toThrow(/UNIQUE constraint failed/i);
  });
});
