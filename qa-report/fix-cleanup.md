# fix-cleanup.md

## Task 1 — Re-enter test files into type checking

### tsconfig.json
- Removed `**/*.test.ts` and `**/*.test.tsx` from `exclude`. Test files are now type-checked again.

### Files modified to fix resulting TS errors

- **lib/auth-helper.test.ts**
  - Added `afterEach` to vitest imports (was missing).
  - Added `afterEach(() => vi.unstubAllEnvs())`.
  - Replaced `process.env.NODE_ENV = 'development' | 'production'` with `vi.stubEnv('NODE_ENV', ...)`.
  - Fixes: TS2540 (read-only `NODE_ENV`).

- **lib/auth-adapter.test.ts**
  - Changed `id: undefined` -> `id: ''` on createUser payload (Adapter expects `string`). Fixes TS2322.
  - Added non-null assertions (`adapter.createUser!`, `getUserByEmail!`, `createVerificationToken!`, `useVerificationToken!`) since NextAuth Adapter methods are typed `?:`. Fixes TS2722 / TS18048.

- **lib/interfaces/IRegistrationService.test.ts**
  - Added `beforeEach` to vitest imports. Fixes TS2304 ("Cannot find name 'beforeEach'").
  - Added `checkInRegistration` method to `MockRegistrationService` to satisfy current `IRegistrationService` contract. Fixes TS2420 / TS2741 (interface drift).

- **lib/services/EmailService.test.ts**
  - Added `afterEach` import + `afterEach(() => vi.unstubAllEnvs())`.
  - Replaced `process.env.NODE_ENV = 'test' | 'production'` with `vi.stubEnv(...)`. Fixes TS2540.
  - Typed nodemailer mock factory as `vi.fn((..._args: any[]) => ...)` so the spread in the wrapper resolves to a tuple. Fixes TS2556 ("spread argument must have tuple type").

- **lib/services/PaymentProcess.test.ts**
  - Replaced `process.env.NODE_ENV = 'production'` with `vi.stubEnv('NODE_ENV', 'production')`. Fixes TS2540.
  - Added `vi.unstubAllEnvs()` to existing `afterEach`.

- **lib/services/VerificationService.test.ts**
  - Added `afterEach` import + `afterEach(() => vi.unstubAllEnvs())`.
  - Replaced `process.env.NODE_ENV = 'test'` with `vi.stubEnv('NODE_ENV', 'test')`. Fixes TS2540.

## Task 2 — Stale tutorial copies deleted

Verified via `grep -r` across `*.ts|*.tsx|*.js|*.json|*.mjs` — zero references to either path.

Deleted:
- `public/tutorials-compiled/` (contained `context-aware-engine.js`, `tutorial-engine.js`)
- `public/tutorials/public/` (nested duplicate; held `public/tutorials/` with `context-aware-engine.js`, `index.js`, `tutorial-definitions.js`, `tutorial-engine.js`)

## Task 3 — Final verification

- `npx tsc --noEmit` — clean (no output).
- `npm run test -- --run` — 32 files, **373/373 passed**.
- `npm run build` — succeeded; full route manifest emitted.

All three commands green.
