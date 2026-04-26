# QA Report — Sections 3 (Orgs) & 4 (Registrations)

Tested against `http://localhost:7777` on 2026-04-25 (NODE_ENV=development, local SQLite present — no `.env`, but DB queries succeed).

## 3. Organizations

### `GET /api/me/organizations`
- **Anon →** `401 {"error":"Unauthorized"}` ✓ (auth gate first, file `app/api/me/organizations/route.ts:9`).
- Cookie path: not exercised (no test session); code path returns memberships joined to `organizations` and includes `activeOrganizationId` from session. Looks correct.

### `/api/me/active-organization`
- **GET →** `405` (no GET handler exported). The QA spec requested `GET`; route only implements `POST`. **Bug or spec mismatch** — UI in `select-organization-client.tsx` posts; review whether a GET reader is wanted.
- **POST anon →** `401` (verified via code; same pattern as above).
- POST validates membership and sets `bb_active_org_id` cookie (httpOnly, sameSite=lax, secure only in prod). Dev `bb_test_auth=1` bypass present and explicitly gated by `NODE_ENV !== 'production'` ✓.

### `GET /api/admin/organizations` (super-admin only)
- **Anon →** `403 {"error":"Forbidden"}` ✓.
- Authz uses `isSuperAdminEmail(session.user.email)`; member/admin matrix collapses to a single super-admin gate. There is no member-level read endpoint here — non-super members get 403 even if signed-in. Acceptable but worth confirming product intent.
- N+1 query: per-org `COUNT(*)` loops in `Promise.all` (route.ts:35-57) — performance smell at scale.

## 4. Registrations

### `GET /api/registrations/form-config`
- Missing params → `400` ✓.
- Valid-shape but unknown org/qr → `404 "Form configuration not found"` ✓.

### `POST /api/registrations/submit`
| Case | Status | Body |
|---|---|---|
| Missing fields | 400 | "Missing required fields…" ✓ |
| Happy path (`demo`/`A`) | 500 | "Internal server error" — alias route swallows `Form configuration not found` and returns generic 500. **Inconsistent with `/api/registrations`** (canonical) which maps that error to 404. See `app/api/registrations/submit/route.ts:32-35`. |
| XSS `<script>alert(1)</script>` | 500 | Same swallow. Could not verify HTML-escape on echo (no successful submit without seeded data). Note: response is JSON (`Content-Type: application/json`), so reflected XSS in the API response is non-executing by default. UI escaping must be checked separately. |
| SQLi `' OR 1=1--` in orgSlug | 500 | Parameterised queries used throughout (`db.execute({sql, args})`) — no injection observed. ✓ |
| Unicode/emoji + RTL Arabic | 500 | Same swallow at alias; payload accepted by JSON parser. |
| Oversized 1 MB body | 500 | Accepted (no body-size guard observed). Recommend adding a payload-size limit. |
| Duplicate submission | n/a | Couldn't reach success path; service contains no idempotency key — duplicates likely create N rows. **Flag.** |

### `GET /api/registrations/by-token/[token]`
- Invalid → `404` ✓. URL-encoded SQLi token → `404` (parameterised) ✓.
- Public endpoint by design; token is the auth. No constant-time compare, but DB lookup is parameterised so timing leak is minimal.

### `GET/PUT/DELETE /api/registrations/[id]`
- **Cross-org access: NO AUTHZ CHECK.** `app/api/registrations/[id]/route.ts` GET/PUT/DELETE all call the service directly with no `getServerSession`, no membership check, no `organization_id` scoping. Anyone who knows/guesses an `id` (UUID) can read, mutate `deliveryStatus`, or delete a registration in any org. **Critical finding.**
- Unknown id → `404` ✓.

### `POST /api/registrations/send-qr`
- Missing fields → `400` ✓.
- **No auth required** (route.ts has no session check). Anyone with a valid `registrationId` + `checkInToken` pair can trigger an email to the registrant via your SendGrid quota — abuse / email-bombing vector. Recommend either auth or rate-limit + token-binding.

### CSV Export
- `GET /api/registrations/export?orgId=…&format=csv` → 200; **no auth check** at all (just an `orgId` query param). Same cross-org exposure as `[id]`. **Critical.**
- `POST /api/export/registrations` → `401` anon ✓; resolves org from session.
- CSV escaping (commas / quotes / newlines) implemented correctly with doubled quotes (`route.ts:90-92`). ✓
- **No UTF-8 BOM** prepended — Excel on Windows will mojibake non-ASCII. Empty-export branch returns plain-text "No registrations to export" with `text/csv` (verified via xxd: starts with `4e 6f` not `EF BB BF`). Recommend prepending `﻿`.
- **CSV-injection risk:** values starting with `=`, `+`, `-`, `@` are not prefixed with `'` — formula-injection if opened in Excel.

### Test / Debug routes — production gating audit
| Route | Prod guard | Notes |
|---|---|---|
| `/api/test-registration-service` | **none** | Hardcoded `getFormConfig('hopefoodbank','main-entrance')`. Returned 200 in dev. **No NODE_ENV check.** |
| `/api/test/create-registration` | yes (`NODE_ENV==='production'` → 404) | ✓ |
| `/api/test/seed` | yes → 404 | ✓ |
| `/api/test/seed-prod` | header-secret in prod, **open in dev** | Expected per design; verified 200 dev response with no secret. |
| `/api/test/login` | header-secret in prod | OK |
| `/api/test/auth` | yes → 404 | ✓ |
| `/api/test/verification-code` | header-secret in prod | OK |
| `/api/test/magic-link-url` | **none** | Returns env vars (`NEXTAUTH_URL`, `PUBLIC_APP_URL`). Info-leak in prod. |
| `/api/test-db` | soft-disabled in prod | OK |
| `/api/test-email-send` | yes (403 in prod) | ✓ |
| `/api/test-production-email` | diagnostics secret in prod | OK |
| `/api/debug/session-org-data` | **none** | Auth-gated by session presence, but exposes membership/QR/registration counts to any signed-in user; no super-admin check. |
| `/api/debug-auth-url` | **none** | Leaks NEXTAUTH_URL / PUBLIC_APP_URL / NODE_ENV publicly. |
| `/api/debug-db-info` | **none** | Leaks `TURSO_DATABASE_URL`, `DATABASE_URL`, `NODE_ENV` publicly (verified 200 in dev with values; in prod would dump connection URL). **Critical.** |
| `/api/debug-email-config` | diagnostics secret in prod | ✓ |
| `/api/debug-form-config` | **none** | Leaks org rows + parsed QR config (`hopefoodbank` hardcoded) publicly. |

## Summary of high-priority findings
1. **`/api/registrations/[id]` (GET/PUT/DELETE) — no auth, no org scoping.** Cross-org read/update/delete possible.
2. **`GET /api/registrations/export` — no auth** on `orgId` param. Bulk PII exfil.
3. **`/api/debug-db-info`, `/api/debug-auth-url`, `/api/debug-form-config`, `/api/test-registration-service`, `/api/test/magic-link-url`** lack production gating — env / config leakage.
4. **`/api/registrations/send-qr` — no auth, no rate-limit.** Email-abuse vector.
5. **CSV export missing UTF-8 BOM** and **no formula-injection prefix**.
6. `/api/registrations/submit` alias swallows specific error types into generic 500 (UX/observability regression vs. canonical `/api/registrations`).
7. `GET /api/me/active-organization` not implemented (405) — confirm if intentional.
8. Admin org listing has N+1 count queries.

## Files referenced
- `/Users/admin/Dev/YOLOProjects/BlessBox/app/api/me/organizations/route.ts`
- `/Users/admin/Dev/YOLOProjects/BlessBox/app/api/me/active-organization/route.ts`
- `/Users/admin/Dev/YOLOProjects/BlessBox/app/api/admin/organizations/route.ts`
- `/Users/admin/Dev/YOLOProjects/BlessBox/app/api/registrations/route.ts`
- `/Users/admin/Dev/YOLOProjects/BlessBox/app/api/registrations/submit/route.ts`
- `/Users/admin/Dev/YOLOProjects/BlessBox/app/api/registrations/form-config/route.ts`
- `/Users/admin/Dev/YOLOProjects/BlessBox/app/api/registrations/by-token/[token]/route.ts`
- `/Users/admin/Dev/YOLOProjects/BlessBox/app/api/registrations/[id]/route.ts`
- `/Users/admin/Dev/YOLOProjects/BlessBox/app/api/registrations/send-qr/route.ts`
- `/Users/admin/Dev/YOLOProjects/BlessBox/app/api/registrations/export/route.ts`
- `/Users/admin/Dev/YOLOProjects/BlessBox/app/api/export/registrations/route.ts`
- `/Users/admin/Dev/YOLOProjects/BlessBox/app/api/test/*`, `/api/test-*`, `/api/debug*` (see table)
