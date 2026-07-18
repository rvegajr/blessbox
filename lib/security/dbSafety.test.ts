import { describe, it, expect, afterEach } from 'vitest';
import { looksLikeProductionDb, assertNonProductionDatabase } from './dbSafety';

const orig = process.env.TURSO_DATABASE_URL;
afterEach(() => {
  if (orig === undefined) delete process.env.TURSO_DATABASE_URL;
  else process.env.TURSO_DATABASE_URL = orig;
});

describe('dbSafety', () => {
  it('flags prod-looking URLs and clears safe ones', () => {
    expect(looksLikeProductionDb('libsql://blessbox-prod-rvegajr.turso.io')).toBe(true);
    expect(looksLikeProductionDb('file:./test.db')).toBe(false);
    expect(looksLikeProductionDb(':memory:')).toBe(false);
    expect(looksLikeProductionDb('')).toBe(false);
    expect(looksLikeProductionDb(undefined)).toBe(false);
  });

  it('throws when the active DB URL looks like production', () => {
    process.env.TURSO_DATABASE_URL = 'libsql://blessbox-prod-x.turso.io';
    expect(() => assertNonProductionDatabase('seeding')).toThrow(/production-looking/i);
  });

  it('does not throw for a throwaway DB', () => {
    process.env.TURSO_DATABASE_URL = 'file:./test.db';
    expect(() => assertNonProductionDatabase('seeding')).not.toThrow();
  });
});
