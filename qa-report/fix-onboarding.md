# Fix: Blocker 9 — `/api/onboarding/verify-code` 500 + raw SQLite leak

Date: 2026-04-25  Author: rvegajr@noctusoft.com

## Root cause

`app/api/onboarding/verify-code/route.ts` called
`INSERT INTO memberships (... organization_id ...)` whenever the request
body included an `organizationId`, with no check that the parent
`organizations` row existed. When the wizard calls verify-code BEFORE
create-organization (the spec-allowed order), the FK fires
`SQLITE_CONSTRAINT_FOREIGNKEY: FOREIGN KEY constraint failed`, which the
catch block then echoed back to the client via `error.message` — so the
response was both a wrong status (500) and a leak of the DB engine.

## Fix

1. New shared helper `lib/api/errorResponse.ts`:
   - `safeParseJson(req)` -> `{ok, body} | {ok:false, response: 400 "Bad request"}` (no parser text leaked).
   - `badRequestResponse(msg, extra)` -> 400 with `{success:false, error}`.
   - `internalErrorResponse(err, prefix)` -> logs full error server-side, returns generic `{success:false, error:"Internal error"}` 500.
   - `isSensitive()` filter blocks SQLITE / libsql / FK / parser strings from ever reaching the client.
2. `app/api/onboarding/verify-code/route.ts`:
   - Parse JSON via `safeParseJson` (malformed body -> 400, not 500).
   - Wrap all DB work in a single try/catch routed through `internalErrorResponse`.
   - Before the membership INSERT, `SELECT id FROM organizations WHERE id = ?`. If absent, return `400 "Invalid organization"` and skip the membership write entirely. The user upsert still succeeds, matching `docs/AUTH_SPECIFICATION.md` (verify-code may run pre-org).
3. Same clean-error pattern applied across:
   - `app/api/auth/send-code/route.ts`
   - `app/api/auth/verify-code/route.ts`
   - `app/api/onboarding/send-verification/route.ts`
   - `app/api/onboarding/create-organization/route.ts`
   - `app/api/onboarding/save-organization/route.ts`
   - `app/api/onboarding/save-form-config/route.ts` (also: `Order must be...` validation now returns 400, fixing item 2.19)
   - `app/api/onboarding/generate-qr/route.ts`

## Tests

`lib/api/errorResponse.test.ts` (8 tests, all passing):
- helper unit tests (parse, 400/500 shape, no leaks).
- **Regression for Blocker 9**: mocks DB so `organizations` lookup returns no rows; asserts the route returns 400, body `error: "Invalid organization"`, body contains no `SQLITE` / `FOREIGN KEY` text, and the membership INSERT is never executed.
- Malformed-JSON regression: 400, no `Unexpected token` text in body.

## Verification

- `npm run test -- --run`: **351 passed / 0 failed** (29 files).
- `npm run build`: **success** (Next 16, Turbopack, all routes compiled).

## Files changed

- `lib/api/errorResponse.ts` (new)
- `lib/api/errorResponse.test.ts` (new)
- `app/api/onboarding/verify-code/route.ts`
- `app/api/onboarding/send-verification/route.ts`
- `app/api/onboarding/create-organization/route.ts`
- `app/api/onboarding/save-organization/route.ts`
- `app/api/onboarding/save-form-config/route.ts`
- `app/api/onboarding/generate-qr/route.ts`
- `app/api/auth/send-code/route.ts`
- `app/api/auth/verify-code/route.ts`
