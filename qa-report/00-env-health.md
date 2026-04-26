# QA Section 0 — Environment & Health

**Date:** 2026-04-25
**Target:** http://localhost:7777 (dev)
**Tester:** rvegajr@noctusoft.com

---

## Step 1 — `.env` vs `env.template` — BLOCKED (informational)

**Severity:** Low (downstream tests still functional)

`.env` does not exist. However, `.env.local`, `.env.production`, `.env.sandbox`, `.env.current.prod`, `.env.qa.production.local` are present. Next.js loads `.env.local` automatically, so the system is operational.

**Vars in `env.template` but missing from `.env.local`:**

```
EMAIL_FROM
EMAIL_FROM_NAME
EMAIL_REPLY_TO
ENABLE_DEBUG_LOGGING
GMAIL_PASS
GMAIL_USER
JWT_SECRET
NEXT_PUBLIC_APP_URL
NODE_ENV
TURSO_AUTH_TOKEN
TURSO_DATABASE_URL
```

Notes: Gmail vars unused (provider=sendgrid). `TURSO_*` missing yet DB works (95 rows returned) — likely sourced elsewhere (Vercel/shell env or hardcoded fallback). `JWT_SECRET` and `NEXT_PUBLIC_APP_URL` absence is suspect.

---

## Step 2 — System health endpoints — PASS

| Endpoint | Status | Body summary |
|---|---|---|
| `/api/system/health-check` | 200 | `{success:true, status:"ok"}` |
| `/api/system/email-health` | 200 | provider=sendgrid, configured=true, hasApiKey=true, smtpPort `"587\n"` (trailing newline anomaly) |
| `/api/system/square-health` | 200 | env=sandbox, merchant ML4RTBG4FP64G, location LJWT6C2KX3YZV, ok=true |
| `/api/system/payment-diagnostics` | 200 | accessToken present (masked `EAAAl4PVSA...22SC`), `applicationId` flagged `format:"invalid"` (value `sandbox-sq0idb-wmodH19wX_VVwhJOkrunbw`) |

**Findings:**
- LOW: `SMTP_PORT` env value contains trailing `\n` (visible as `"587\n"`).
- MEDIUM: Square `applicationId` validation fails despite working merchant/location — validator is likely wrong (sandbox IDs do start with `sandbox-sq0idb-`).

---

## Step 3 — Anonymous debug endpoints — FAIL (security)

All 6 endpoints respond 200 to unauthenticated callers.

| Endpoint | Status | Secret leak? | Evidence |
|---|---|---|---|
| `/api/test-db` | 200 | No | `{count:95}` only |
| `/api/debug-email-config` | 200 | **LOW leak** | Reveals provider, from-email `contact@yolovibecodebootcamp.com`, SMTP host, masks user as `***set***` |
| `/api/debug-form-config` | 200 | No | error: org not found |
| `/api/debug-db-info` | 200 | No | reports `TURSO_DATABASE_URL: "not set"` (misleading; DB works) |
| `/api/debug/session-org-data` | 200 | No | `{authenticated:false}` |
| `/api/debug-auth-url` | 200 | **LOW leak** | Reveals `nextAuthUrl: "https://bless-box.vercel.app\n"`, magic-link base, NODE_ENV |

**Severity: MEDIUM** — No raw API keys/tokens/DB-with-auth strings exposed, but unauthenticated debug surface area is wide. Endpoints disclose provider config, infrastructure URLs, and internal state useful for reconnaissance. `\n` newline in `nextAuthUrl` is a config bug (would corrupt magic-link redirects).

**Recommendation:** Gate all `/api/debug*` and `/api/test-*` routes behind auth + non-production check, or remove from production builds.

---

## Step 4 — `npm run test -- --run` — PASS

```
Test Files  26 passed (26)
Tests       327 passed (327)
Duration    4.27s
```

Stderr noise from `SendGridTransport.test.ts` (`API key does not start with "SG."`, CORS warning) is expected mocked-error output; tests still pass.

---

## Step 5 — `npm run build` — PASS

Next.js build completed. Full route manifest emitted (~120 routes, mix of static `○` and dynamic `ƒ`). No errors. No type or lint failures surfaced in tail output.

---

## Step 6 — Playwright e2e — SKIPPED (per scope, prod target)

---

## Summary

| Step | Result | Severity |
|---|---|---|
| 1. env diff | BLOCKED-info | Low |
| 2. health endpoints | PASS | Low (smtp `\n`), Medium (Square appId validator) |
| 3. debug endpoints anon | FAIL | **Medium** (info disclosure) |
| 4. vitest | PASS | — |
| 5. build | PASS | — |
| 6. e2e | SKIPPED | — |

**Top issues to fix:**
1. (MED) Lock down `/api/debug*` and `/api/test-*` endpoints in production.
2. (MED) Trailing `\n` in `SMTP_PORT` and `NEXTAUTH_URL` env values — strip or fix `.env.local` lines.
3. (MED) `payment-diagnostics` falsely flags valid sandbox `applicationId` as invalid.
4. (LOW) Create canonical `.env` or document that `.env.local` is the source of truth; reconcile missing template vars.
