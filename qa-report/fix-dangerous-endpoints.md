# Fix Report — Dangerous Diagnostic / Test Endpoints

Date: 2026-04-25 · Author: rvegajr@noctusoft.com

Closes Blockers 6, 7, 8 from `qa-report/05-dashboard-admin.md` and `qa-report/07-security.md`.

## 1. Shared helper

New: `lib/security/diagnosticsAuth.ts`

Exports `requireDiagnosticsSecret(req)` and `hasValidDiagnosticsSecret(req)`.

- Requires `Authorization: Bearer <DIAGNOSTICS_SECRET>` (or `CRON_SECRET` fallback) in **all** environments.
- Bearer scheme is case-insensitive.
- On failure in `NODE_ENV === 'production'` returns **HTTP 404** ("Not Found") to hide endpoint existence from anonymous probes.
- On failure in non-prod returns **HTTP 401** with a JSON error so devs see the cause.
- Rejects when `DIAGNOSTICS_SECRET` is unset, even if a bearer header is present (prevents silent allow).

Unit tests: `lib/security/diagnosticsAuth.test.ts` (8 tests, all green) — covers prod-404-anon, prod-200-with-secret, dev-401-anon, CRON_SECRET fallback, no-secret-configured, case-insensitive scheme.

## 2. Blocker 6 — `POST /api/system/clear-database`

Removed the `NODE_ENV !== 'production'` early-return. Now always requires:
1. `requireDiagnosticsSecret(req)` (bearer secret).
2. `x-confirm: WIPE` header (returns 400 if absent/wrong).
3. In production additionally: `process.env.ALLOW_DB_CLEAR === 'true'` (returns 403 otherwise).

File: `app/api/system/clear-database/route.ts`.

## 3. Blocker 7 — Debug / test endpoints (info-disclosure)

All gated behind `requireDiagnosticsSecret` (404 in prod when secret absent):

| File | Change |
|---|---|
| `app/api/debug-db-info/route.ts` | Rewritten. Returns ONLY `{ driver, healthy, tableCount }`. **No URL, no token, no env values.** |
| `app/api/debug-email-config/route.ts` | Replaced ad-hoc prod-only gate with shared helper. |
| `app/api/debug-form-config/route.ts` | Helper added at top of GET. |
| `app/api/debug/session-org-data/route.ts` | Helper added before session lookup. |
| `app/api/debug-auth-url/route.ts` | Rewritten to take `NextRequest` and gate. |
| `app/api/test-registration-service/route.ts` | Helper added. |
| `app/api/test/magic-link-url/route.ts` | Helper added. |

## 4. Blocker 8 — Open SendGrid relays

Files: `app/api/test-email-send/route.ts`, `app/api/test-production-email/route.ts`. Both rewritten:

- `requireDiagnosticsSecret` gate at top (404 in prod when missing/invalid).
- `from` is hardcoded to `process.env.SENDGRID_FROM_EMAIL` via `fromEmailOverride` — **client `fromEmail` is dropped**.
- `to` MUST equal `process.env.DIAGNOSTICS_TEST_RECIPIENT` (server-controlled allowlist). Returns 500 if env unset, 403 if mismatch.
- `replyTo`:
  - `test-email-send`: ignored entirely.
  - `test-production-email`: accepted only if it matches `^[^\s@]+@blessbox\.org$`; otherwise dropped.

## 5. Verification

- `npm run test -- --run lib/security` → **8 / 8 pass**.
- Full suite: 336 passing. The 6 failing tests in `lib/services/RegistrationsRouteAuthz.test.ts` are **pre-existing** (verified by re-running on stashed worktree — same 6 failures with or without these changes) and unrelated to this work (they concern `/api/registrations/export` IDOR, a separate finding).
- `npx tsc --noEmit` produces no new errors in any of the changed files.
- `npm run build` fails on a **pre-existing** type error in `app/api/auth/send-code/route.ts` (`normalizeEmail(email)` — `email` typed as `unknown`). Confirmed unchanged from `HEAD` (`git diff HEAD -- app/api/auth/send-code/route.ts` is empty). Not introduced by this fix.

## 6. Operational notes for deploy

Set in production (Vercel / staging) before this deploys:

- `DIAGNOSTICS_SECRET` — high-entropy random string. Must be set or every diagnostic endpoint returns 404 (intended behavior).
- `DIAGNOSTICS_TEST_RECIPIENT` — single email address that the two test-email endpoints are allowed to send to (e.g. `qa@blessbox.org`).
- `ALLOW_DB_CLEAR` — leave **unset** in production. Only set to `"true"` for the brief window when a deliberate wipe is required, then unset.
- `SENDGRID_FROM_EMAIL` — already required; now also enforced as the only allowed `from` for test endpoints.

## 7. Files touched

- `lib/security/diagnosticsAuth.ts` (new)
- `lib/security/diagnosticsAuth.test.ts` (new, 8 tests)
- `app/api/system/clear-database/route.ts`
- `app/api/debug-db-info/route.ts`
- `app/api/debug-email-config/route.ts`
- `app/api/debug-form-config/route.ts`
- `app/api/debug/session-org-data/route.ts`
- `app/api/debug-auth-url/route.ts`
- `app/api/test-registration-service/route.ts`
- `app/api/test/magic-link-url/route.ts`
- `app/api/test-email-send/route.ts`
- `app/api/test-production-email/route.ts`
