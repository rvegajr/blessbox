import '@testing-library/jest-dom/vitest';
import { assertNonProductionDatabase } from '../lib/security/dbSafety';

// SECURITY (prod-readiness P3): never let the test suite — or any seed/DB helper
// it imports — run against the production database or the live Square environment.
// .env.test.local has historically pointed at prod. Vitest does not load that file
// by default, but a shell export or CI misconfig could put a prod URL in the
// environment; fail loudly rather than mutating real data. (Same guard used by
// standalone seed scripts — see lib/security/dbSafety.)
assertNonProductionDatabase('the test suite');

// Belt-and-suspenders: force Square sandbox for anything that slips past mocks.
if ((process.env.SQUARE_ENVIRONMENT || '').trim().toLowerCase().startsWith('production')) {
  process.env.SQUARE_ENVIRONMENT = 'sandbox';
}
