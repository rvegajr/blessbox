# Section 14 — Security QA

Audit date: 2026-04-25 · Auditor: rvegajr@noctusoft.com · Target: BlessBox `main` @ 68c33a4

---

## BLOCKER FINDINGS (ship-stoppers)

These will hurt you in production. Fix before any further deploy.

### B1. Unguarded `/api/debug-*` and `/api/test-*` endpoints leak data / mutate DB in prod
The convention "test/debug routes are gated by `NODE_ENV !== 'production'`" is **not enforced consistently**. The following routes have **no production guard and no auth** — they are reachable on https://blessbox.org by an anonymous attacker:

| Route | Method | What it exposes / does | Severity |
|---|---|---|---|
| `/api/debug-auth-url` | GET | Leaks `NEXTAUTH_URL`, `PUBLIC_APP_URL`, `NODE_ENV`, magic-link base URL | High (info disc.) |
| `/api/debug-db-info` | GET | Leaks `TURSO_DATABASE_URL`, `DATABASE_URL`, `NODE_ENV` (full DB connection string!) | **Critical** |
| `/api/debug-form-config` | GET | Reads org/QR/form config from prod DB; logs queries; `console.log`s rows | Medium |
| `/api/debug/session-org-data` | GET | Dumps current session + org memberships (auth-gated by `getServerSession` only — anyone signed in can call; cross-tenant safe but verbose) | Low |
| `/api/test-db` | GET | Hardcoded "OK" in prod, fine | — |
| `/api/test-email-send` | POST | **No prod guard.** Will send arbitrary email via SendGrid to any address. Open email-spam relay. | **Critical** |
| `/api/test-production-email` | POST | Same — no prod guard, sends email with attacker-controlled `fromEmail`/`replyTo`. Phishing relay. | **Critical** |
| `/api/test-registration-service` | GET | Hardcoded org slug `hopefoodbank`, returns form config; low risk but unnecessary | Low |

`/api/debug-db-info` leaking `TURSO_DATABASE_URL` plus `/api/test-email-send` accepting arbitrary recipients is enough to (a) target the DB and (b) phish customers using your domain reputation. **Pull or guard these today.**

Properly guarded (good): `/api/test/auth`, `/api/test/seed`, `/api/test/create-registration`, `/api/migration/migrate-onboarding` (all return 404 in prod), and `/api/test/login`, `/api/test/seed-prod`, `/api/test/verification-code`, `/api/admin/seed-test-coupons`, `/api/system/clear-database`, `/api/system/payment-diagnostics`, `/api/debug-email-config` (secret-gated).

### B2. No security headers (CSP, HSTS, X-Frame-Options, etc.)
`src/next.config.js` has **no `headers()` function**. Site responds with zero security headers. Missing:
- `Content-Security-Policy` (XSS defense-in-depth)
- `Strict-Transport-Security` (HSTS — protocol downgrade)
- `X-Frame-Options` / CSP `frame-ancestors` (clickjacking — registration/payment pages can be iframed)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy`
- `Permissions-Policy`

Also: `typescript.ignoreBuildErrors: true` masks type-level security regressions across builds.

### B3. No rate limiting anywhere in the app code
`grep` for `rate-limit`, `ratelimit`, `@upstash/ratelimit`, `express-rate-limit`, or any custom limiter returns **zero** matches in `app/`, `lib/`, `middleware*`. The only "rate limit" hits are the string `'rate limit'` in tests + a comment in `lib/services/VerificationService.ts`. Endpoints below are open to brute-force / abuse:

| Endpoint | Risk |
|---|---|
| `POST /api/auth/send-code` | Email-bombing victims; SendGrid quota exhaustion |
| `POST /api/auth/verify-code` | Brute-force the 6-digit OTP (10⁶ space, no lockout visible) |
| `POST /api/onboarding/send-verification` | Same as send-code |
| `POST /api/onboarding/verify-code` | Same as verify-code |
| `POST /api/payment/process` | Card-tester / fraud probing against Square |
| `POST /api/payment/create-intent` | Cheap to call, returns `pi_<random>` — low risk but spammable |
| `POST /api/registrations`, `POST /api/registrations/submit` | Public, no auth — attacker can flood DB with rows |
| `POST /api/registrations/send-qr` | Sends email per call. Email-bombing relay. |
| `POST /api/report-bug` | Creates a GitHub issue per call with attachments. **Will exhaust GitHub API quota and pollute the public repo within minutes**. Critical. |
| `POST /api/coupons/apply`, `POST /api/coupons/validate` | Coupon-code enumeration |

Recommend `@upstash/ratelimit` keyed on IP + email at the edge, or a simple Redis token bucket. **`/api/report-bug` and `/api/auth/verify-code` are the most urgent.**

### B4. `/api/test/login` issues real session cookies in production with only a header secret
`app/api/test/login/route.ts` — in prod it requires `x-test-login-secret` matching `PROD_TEST_LOGIN_SECRET`. If that env var is empty, the `if (!secret || token !== secret)` check still rejects (good) — but the existence of a header-only path that mints `authjs.session-token` cookies for **arbitrary email + admin=true** is a single-secret-leak away from full account takeover. Strongly recommend gating by **both** secret and IP allowlist, or removing from prod entirely. Same concern for `/api/test/seed-prod` (mints orgs + subscriptions).

---

## 1. Authz Matrix (76 routes)

Legend: P=Public, A=Authed (session required), AD=Admin (super-admin email), S=Secret/header-gated, D=Dev-only (404 in prod). `Enforced?` = source actually checks.

| Route | Intent | Source enforces | Notes |
|---|---|---|---|
| `auth/logout`, `auth/session`, `auth/send-code`, `auth/verify-code` | P | yes | Public by design |
| `me/active-organization`, `me/organizations` | A | yes (session) | OK |
| `admin/organizations`, `admin/subscriptions`, `admin/coupons*`, `admin/stats` | AD | yes (`isSuperAdminEmail`) | OK |
| `admin/seed-test-coupons` | S | yes | `x-seed-secret` |
| `dashboard/*`, `usage`, `subscriptions`, `subscription/cancel`, `subscription/upgrade` | A | yes (session+org) | OK |
| `classes*`, `enrollments`, `participants`, `qr-codes*`, `qr-code-sets`, `check-in/search` | A | yes (session, org-scoped) | Spot-checked — uses `resolveOrganizationForSession` |
| `registrations` (POST), `registrations/submit` | P | yes (public registration is intent) | **No rate limit** |
| `registrations/[id]`, `[id]/check-in`, `[id]/undo-check-in` | A | needs verify | spot-check OK (session + org scope on org match) |
| `registrations/by-token/[token]` | P | by token | OK if token is unguessable |
| `registrations/form-config`, `registrations/send-qr` | P | yes/none | send-qr has **no rate limit + no ownership check on `registrationId`** — attacker can email QR to any registrant by guessing IDs (uuids ok, but token also returned) |
| `registrations/export` (GET) | **MISMATCH** | ❌ takes `orgId` from query string with **no auth** | Anyone can export any org's registrations as CSV/PDF by guessing `orgId`. **Critical.** |
| `export/registrations` (POST) | A | yes (session + org) | Correct twin of above; deprecate the GET version |
| `payment/create-intent`, `payment/process` | A (loose) | partial — accepts session OR `body.email` | Payment flow uses email from body if no session. Low risk because Square does the actual capture, but lets unauthenticated callers create subscription rows tied to arbitrary emails |
| `payment/validate-coupon`, `coupons/apply`, `coupons/validate` | P | yes | Enumeration risk (rate-limit) |
| `square/config` | P | yes (returns app id only) | OK |
| `qr/download` | P | yes | takes user-supplied data URLs — DoS via huge payload (no size cap visible) |
| `report-bug` | P | yes | **Open relay to GitHub Issues** — see B3 |
| `cron/finalize-cancellations` | S | yes (`CRON_SECRET`) | OK |
| `system/health-check`, `system/email-health`, `system/square-health` | P | yes | Returns ok/error only |
| `system/clear-database`, `system/payment-diagnostics` | S | yes (`DIAGNOSTICS_SECRET`) | OK |
| `onboarding/*` | P/A mixed | spot-check OK | `send-verification` lacks rate limit |
| `migration/migrate-onboarding` | D | yes (404 prod) | OK |
| `test/*` (auth, seed, create-registration, magic-link-url) | D | yes | OK |
| `test/login`, `test/seed-prod`, `test/verification-code` | S | yes | See B4 |
| `test-db`, `test-email-send`, `test-production-email`, `test-registration-service` | **MISMATCH** | ❌ no prod guard | See B1 |
| `debug-auth-url`, `debug-db-info`, `debug-form-config` | **MISMATCH** | ❌ no prod guard | See B1 |
| `debug-email-config` | S | yes | OK |
| `debug/session-org-data` | A | yes (session) | OK |

**Mismatches flagged: 8 routes (B1) + `registrations/export` GET (critical IDOR-by-orgId).**

---

## 2. Rate Limiting
See B3. **Zero rate-limiting code exists.** Highest-priority targets: `report-bug`, `auth/verify-code`, `onboarding/verify-code`, `auth/send-code`, `registrations/submit`, `registrations/send-qr`, `payment/process`.

## 3. Security Headers
`src/next.config.js` has no `async headers()` block. **Every header listed in B2 is missing.** Add a baseline now:
```js
async headers() { return [{ source: '/(.*)', headers: [
  {key:'Strict-Transport-Security',value:'max-age=63072000; includeSubDomains; preload'},
  {key:'X-Content-Type-Options',value:'nosniff'},
  {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
  {key:'X-Frame-Options',value:'DENY'},
  {key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'},
]}]; }
```
CSP needs per-route work because of Square JS SDK + inline scripts; ship report-only first.

## 4. Input Validation (5 spot-checks)
| Route | Library | Verdict |
|---|---|---|
| `auth/send-code` | none | manual `normalizeEmail` only |
| `auth/verify-code` | none | manual checks |
| `registrations` POST | none | typeof checks only; `formData` is passed straight to service |
| `payment/process` | none | raw `body` destructure; `paymentToken` not validated |
| `report-bug` | none | typed interface but no runtime validation; accepts arbitrary base64 image data with no size cap |

**`zod`/`yup`/`joi` is not used in any `app/api` route.** Recommend introducing `zod` for at least auth, payment, registrations, report-bug, and onboarding.

## 5. Stored XSS Surface
`grep dangerouslySetInnerHTML` across `.tsx`/`.ts`: **only matches are inside Playwright test specs** (`tests/e2e/production-real-data-test.spec.ts`, `complete-application-flow.spec.ts`). No production component uses `dangerouslySetInnerHTML`. React's default escaping is intact for displayed registration data. ✅

(Caveat: PDF export and email templates were not deeply audited — verify `EmailService` / `SendGridTransport` HTML templates escape user names.)

## 6. Secrets in Client Bundle
`grep -r 'SQUARE_ACCESS_TOKEN\|SENDGRID_API_KEY\|TURSO_AUTH_TOKEN\|JWT_SECRET' .next/static` → **no matches.** ✅
`grep -r 'process.env\.' components/**/*.tsx` (excluding `NEXT_PUBLIC_`) → **no matches.** ✅
Server-only env access is properly walled off.

## 7. Test/Debug Prod Gating
See **B1**. 8 routes unguarded — listed above.

## 8. SSRF Surface
`grep "fetch(" app/api lib` for user-controlled URLs:
- `app/api/system/email-health`, `app/api/system/square-health`: `fetch(url, ...)` — `url` is **hard-coded** internal config, not user input. ✅
- `app/api/report-bug`: posts to `https://api.github.com` (constant). ✅
- No route accepts a URL from request body and re-fetches it.

**SSRF surface: clean.** ✅

---

## Priority Fix List
1. **Today**: remove or auth-gate `debug-db-info`, `test-email-send`, `test-production-email`, `debug-auth-url`, `debug-form-config` (B1).
2. **Today**: add session+org check to `GET /api/registrations/export` (IDOR).
3. **This week**: rate-limit `report-bug`, `auth/verify-code`, `onboarding/verify-code`, `auth/send-code`, `registrations/send-qr` (B3).
4. **This week**: add baseline security headers in `next.config.js` (B2).
5. **This sprint**: introduce `zod` schemas for auth, payment, registration, onboarding, report-bug.
6. **Hardening**: add IP allowlist to `/api/test/login` and `/api/test/seed-prod` (B4); remove `typescript.ignoreBuildErrors`.

Files of interest:
- `/Users/admin/Dev/YOLOProjects/BlessBox/src/next.config.js`
- `/Users/admin/Dev/YOLOProjects/BlessBox/app/api/debug-db-info/route.ts`
- `/Users/admin/Dev/YOLOProjects/BlessBox/app/api/test-email-send/route.ts`
- `/Users/admin/Dev/YOLOProjects/BlessBox/app/api/test-production-email/route.ts`
- `/Users/admin/Dev/YOLOProjects/BlessBox/app/api/registrations/export/route.ts`
- `/Users/admin/Dev/YOLOProjects/BlessBox/app/api/report-bug/route.ts`
- `/Users/admin/Dev/YOLOProjects/BlessBox/app/api/test/login/route.ts`
