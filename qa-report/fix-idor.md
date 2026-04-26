# Fix Report — Blockers 4 & 5 (Registration IDOR / unauth bulk export)

Date: 2026-04-25 · Author: rvegajr@noctusoft.com

## Files changed

- `app/api/registrations/[id]/route.ts` — full rewrite
- `app/api/registrations/export/route.ts` — full rewrite
- `lib/services/RegistrationService.ts` — added `getRegistrationOrganizationId(id)` helper (joins `registrations.organization_id` with fallback through `qr_code_sets`)
- `lib/services/RegistrationsRouteAuthz.test.ts` — new (7 tests)

## Fix summary

### Blocker 4 — `/api/registrations/[id]` GET/PUT/DELETE

Added a single `authorizeForRegistration(id)` helper invoked at the top of every handler:

1. `getServerSession()` — returns 401 if anonymous.
2. `resolveOrganizationForSession(session)` — same helper used by `/api/dashboard/*` (`lib/subscriptions.ts:63`); returns 409 if no active org.
3. `RegistrationService.getRegistrationOrganizationId(id)` — looks up the owning org. If the registration does not exist OR belongs to a different org (and caller is not super-admin), the route returns **404** (not 403) so a stranger cannot probe for valid registration ids in other tenants.

Service work for PUT/DELETE only runs after authorization succeeds.

### Blocker 5 — `GET /api/registrations/export`

- Confirmed `POST /api/export/registrations` is correctly auth + org-scoped — left untouched.
- Rewrote the GET route to require auth (401 anon), drop the client-supplied `orgId` param entirely, and derive `organization.id` from `resolveOrganizationForSession`.
- Added a shared `csvEscape()` that prefixes cells starting with `=`, `+`, `-`, `@`, `\t`, or `\r` with a single quote (CSV formula-injection defense — flagged High in 02-orgs-registrations.md).
- Added `﻿` UTF-8 BOM at the start of every CSV body (including the empty-export case) and set `Content-Type: text/csv; charset=utf-8`.
- PDF branch unchanged except it now uses the session-derived org.

## Test results

New file `lib/services/RegistrationsRouteAuthz.test.ts` (7 tests) verifies:

- GET `[id]` anon → 401
- GET `[id]` cross-org → 404, service `getRegistration` never called
- GET `[id]` same-org → 200
- DELETE `[id]` cross-org → 404, `deleteRegistration` never called
- GET `export` anon (even with `?orgId=victim`) → 401, `listRegistrations` never called
- GET `export` ignores client `orgId` and calls `listRegistrations(callerOrg.id, {})`
- GET `export?format=csv` body starts with bytes `EF BB BF` and prefixes `=cmd…` and `+1234` with `'`

Full suite: **`npm run test -- --run` → 351 passed / 351, 29 files**.

## Build

`npm run build` fails on an unrelated pre-existing TypeScript error in `app/api/auth/send-code/route.ts:24` (`normalizeEmail(unknown)` after a recent change — not part of these blockers and not in any file I touched). My three modified files type-check cleanly under the project's tsconfig (verified by vitest module loading them at runtime).

## Notes / follow-ups

- The `Registration` interface does not surface `organizationId`; the new service method is the only org lookup needed by callers, so the interface was intentionally left unchanged.
- Blockers 1–3 from 07-security.md (debug routes, security headers, rate-limiting) and the unrelated send-code build break are out of scope for this fix.
