# BlessBox QA — Master Summary

Local dev run against http://localhost:7777 with `.env.local` (Turso + Square sandbox + SendGrid live). Production run is **pending** — see "Production Plan" at bottom.

## Verdict: 🛑 NOT SHIPPABLE — multiple Blockers

| Section | Status | Blockers | Highs |
|---|---|---|---|
| 0. Env & Health | 🟡 | 0 | 2 (debug routes open; env trailing `\n`) |
| 1. Auth & Onboarding | 🟡 | 1 | 4 |
| 2. Orgs & Registrations | 🔴 | 4 | 3 |
| 3. QR / Check-in / Classes | 🟡 | 0 | 3 (race conditions, missing handlers) |
| 4. Payments | 🔴 | 5 | 2 |
| 5. Dashboard & Admin | 🔴 | 1 | 1 |
| 6. Tutorials & Components | 🟡 | 0 | 3 (Traklet PAT exposure, dead React tutorial code, modal a11y) |
| 7. Security | 🔴 | 6 | many |
| 8. Regression & DB | 🟡 | 0 | 2 (schema drift, no migrations history, no backup) |
| 9. CI/CD & MCP | 🟡 | 1 | 3 |

Vitest: **327/327 PASS**. Build: **PASS**. Playwright e2e: skipped (configured against prod).

## 🚨 BLOCKERS (fix before any deploy)

1. **`/api/payment/process` trusts client `amount`** — POST `{planType:'enterprise', amount:1}` charges 1¢. (`04-payments.md`)
2. **`/api/payment/process` auth-bypass via `body.email`** — provisions org for any email; combined with #1 = free Enterprise. (`04-payments.md`)
3. **`/api/subscription/upgrade` self-grants any plan** with no payment check. (`04-payments.md`)
4. **`/api/registrations/[id]` GET/PUT/DELETE** — no auth, cross-org PII read/update/delete by UUID. (`02-orgs-registrations.md`, `07-security.md`)
5. **`GET /api/registrations/export?orgId=…`** — unauthenticated bulk PII CSV export. (`02`, `07`)
6. **`POST /api/system/clear-database`** in dev/staging: returns 200 with no auth, no env flag, no confirmation. (`05-dashboard-admin.md`)
7. **`/api/debug-db-info`** leaks full `TURSO_DATABASE_URL` (with auth) to anonymous in any env. (`07-security.md`)
8. **`/api/test-email-send` & `/api/test-production-email`** open SendGrid relays with attacker-controlled `from`/`replyTo` — phishing-from-blessbox.org. (`07`)
9. **`/api/onboarding/verify-code` 500s** with raw `SQLITE_CONSTRAINT_FOREIGNKEY` — primary onboarding path broken + DB internals leaked. (`01-auth-onboarding.md`)
10. **MCP `run-test` tool** — shell injection via unsanitised `testFile`/`testName` to `execAsync`. (`09-cicd-mcp.md`)

## HIGH (ship-blocking on second pass)

- Zero rate limiting anywhere (`/api/auth/*`, `/api/report-bug`, `/api/registrations/send-qr`, `/api/payment/*`).
- Zero security headers in `next.config.js` (no CSP/HSTS/X-Frame-Options/nosniff/Referrer-Policy).
- Zero schema validation (no zod/yup/joi) on any user-input route.
- `next.config.js` has `typescript.ignoreBuildErrors: true`.
- `/api/report-bug` accepts XSS payloads & 2MB bodies; no rate limit; open relay to GitHub Issues.
- Traklet dev widget is mounted in `app/layout.tsx` gated only by `NEXT_PUBLIC_TRAKLET_ENABLED` — and the PAT is `NEXT_PUBLIC_*`, so if enabled in prod the GitHub PAT ships to every browser.
- Race conditions: `RegistrationService.checkInRegistration` (no transaction, no `WHERE checked_in_at IS NULL` guard) → double check-in possible under concurrency. Same pattern on `/api/enrollments` capacity check.
- `/api/registrations/send-qr` unauthenticated — email-bombing relay.
- `/api/admin/seed-test-coupons` 200s unauthenticated in dev/staging (env-gated only).
- CSV export missing UTF-8 BOM and CSV-formula-injection escaping.
- Tutorials: spec says 13, code ships **19** with two parallel implementations + incompatible localStorage schemas; React `TutorialManager.tsx` is dead (never mounted).
- CI runs **only `npm run build`** — no vitest, no playwright, no eslint, no `tsc --noEmit`. The "lint" step greps the build log.
- Root `vercel.json` missing — cron schedule for `finalize-cancellations` is not in repo.
- Drizzle: no `drizzle/migrations/` directory; **schema drift** — live DB has 24 tables, `lib/schema.ts` defines 17.
- No backup/restore script for `blessbox.db`; destructive `clear-production-database*` scripts ship without paired backup.
- Modals (`CancelModal`, `UpgradeModal`) lack `role="dialog"`, focus trap, Esc handling.

## MEDIUM / LOW

- Trailing `\n` in `.env.local` for `SMTP_PORT` and `NEXTAUTH_URL`.
- `payment-diagnostics` falsely flags valid sandbox app IDs.
- Anonymous debug routes don't leak raw secrets but disclose infra (provider names, masked tokens, config presence).
- Coupon validation divergence: canonical `/api/coupons/validate` returns invalid for WELCOME25/SAVE10/NGO50/FIXED500 (no DB seed); deprecated `/api/payment/validate-coupon` still returns valid → delete the deprecated one or seed.
- `POST /api/qr-codes` & `POST /api/qr-code-sets` return 405 despite header comments promising create handlers.
- `GET /api/me/active-organization` returns 405 (only POST defined).
- `PUT/DELETE /api/classes/[id]` missing.
- Admin org list does N+1 count queries.
- `/pricing` uses hard-coded plan amounts — single source of truth needed vs DB plan limits.
- Coupon PUT mass-assignment risk.
- `verify-code` regex rejects whitespace-padded codes (paste UX).

## What was NOT covered (needs human / live env)

- Real phone QR scan (camera).
- Real Square sandbox card flow end-to-end (3DS, AVS, CVV decline matrix).
- Real SendGrid inbox verification (codes, receipts, send-qr, bug-report email).
- Multi-browser matrix (Safari, FF, mobile).
- Lighthouse mobile scores per page.
- Network-level tests (slow 3G, offline behaviour).
- Vercel cron firing in actual Vercel runtime.
- Multi-device "real-time UI update" verification on check-in.

## Per-section reports

- [00-env-health.md](00-env-health.md)
- [01-auth-onboarding.md](01-auth-onboarding.md)
- [02-orgs-registrations.md](02-orgs-registrations.md)
- [03-qr-checkin-classes.md](03-qr-checkin-classes.md)
- [04-payments.md](04-payments.md)
- [05-dashboard-admin.md](05-dashboard-admin.md)
- [06-tutorials-components.md](06-tutorials-components.md)
- [07-security.md](07-security.md)
- [08-regression-db.md](08-regression-db.md)
- [09-cicd-mcp.md](09-cicd-mcp.md)

---

# Production Plan (when local is green)

**DO NOT run the full suite against `https://www.blessbox.org` until Blockers 1–10 are fixed.** Several local findings are catastrophic if exercised in prod (`/api/payment/process` amount tampering, `/api/registrations/export` IDOR, `/api/system/clear-database`, `/api/test-email-send` phishing relay). A naive "run all tests on prod" would charge real cards for 1¢, dump real PII, send real emails from `@blessbox.org`, and could wipe the DB.

## Two-phase production validation

### Phase A — Read-only / safe (run anytime against prod)
Anonymous GETs only. No mutations.
- `/api/system/health-check`, `/email-health`, `/square-health`, `/payment-diagnostics`
- Confirm `/api/debug*` and `/api/test*` and `/api/test-email-send` and `/api/test-production-email` and `/api/system/clear-database` and `/api/admin/seed-test-coupons` and `/api/registrations/export` all return **404 or 401** in prod (these are the Blocker URLs — proving they're closed in prod is the test).
- `/pricing`, `/`, `/login` render 200; security headers present; no `NEXT_PUBLIC_TRAKLET_*` referenced in shipped JS.
- Lighthouse mobile on `/`, `/pricing`, `/login`.
- `playwright test tests/e2e/production-verification.spec.ts` (already exists per `package.json`).

### Phase B — Authenticated / mutating (only after Blockers fixed AND with a dedicated QA tenant)
Requires a sandboxed prod org (clearly tagged "QA — DO NOT BILL"), a real test email inbox, and Square sandbox keys pointed at a separate sub-account.
- Auth, onboarding, registrations, check-in, classes — full happy paths.
- Square sandbox card matrix (`4111…`, `4000…0002`, 3DS).
- Coupon redemption + cron finalize-cancellations (manually triggered with `CRON_SECRET`).
- Cleanup script must wipe the QA tenant after.

I can author the prod runner as a Playwright spec or a shell harness once you give the green light on Blocker fixes. Recommend fixing Blockers 1–10 first; running Phase A in parallel today is safe.

## Suggested next move

Want me to (a) open PRs for the Blockers, (b) build the Phase-A prod read-only test runner now (safe), or (c) both in parallel?
