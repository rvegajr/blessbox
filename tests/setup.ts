import '@testing-library/jest-dom/vitest';

// SECURITY (prod-readiness P3): never let the test suite — or any seed/DB helper
// it imports — run against the production database or the live Square environment.
// .env.test.local has historically pointed at prod. Vitest does not load that file
// by default, but a shell export or CI misconfig could put a prod URL in the
// environment; fail loudly rather than mutating real data.
const testDbUrl = process.env.TURSO_DATABASE_URL || '';
if (/prod/i.test(testDbUrl)) {
  throw new Error(
    `[tests/setup] Refusing to run the test suite against a production-looking database ` +
      `(TURSO_DATABASE_URL contains "prod"). Point the test environment at a throwaway DB ` +
      `(file:./test.db or :memory:) — never the production Turso database.`,
  );
}
// Belt-and-suspenders: force Square sandbox for anything that slips past mocks.
if ((process.env.SQUARE_ENVIRONMENT || '').trim().toLowerCase().startsWith('production')) {
  process.env.SQUARE_ENVIRONMENT = 'sandbox';
}
