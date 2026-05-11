# Environment Variable Inventory & Sanitization Policy

**Owner:** Platform / DevOps
**Last updated:** 2026-05-10
**Source of truth:** `lib/utils/env.ts` (sanitizers) + `env.template` (defaults)

---

## 1. Why this exists

We have repeatedly been bitten by **hidden whitespace, surrounding quotes, or
trailing newlines** in env vars sourced from `.env*` files or pasted into the
Vercel UI. The most recent regression: `NEXT_PUBLIC_TRAKLET_ENABLED` was
inlined into the client bundle as the literal string `"true\n"`, so the
comparison `process.env.NEXT_PUBLIC_TRAKLET_ENABLED === 'true'` returned
`false` and the QA widget never rendered on `blessbox.org`.

**Rule of thumb:** *never* compare or use `process.env.X` directly. Always
route through one of the helpers in `lib/utils/env.ts`. Sanitization is
runtime-cheap; the lost hours from a silent string mismatch are not.

---

## 2. The sanitizer (`lib/utils/env.ts`)

| Helper | Use where | Notes |
|---|---|---|
| `sanitizeEnvValue(raw)` | Pure string cleanup | Strips trailing/leading whitespace, surrounding `" ' \``  ``, literal `\n` / `\r`, real newlines / carriage returns. |
| `getEnv(key, default?)` | **Server-only** (Node runtime, route handlers, services) | Dynamic `process.env[key]` lookup. Logs once per dirty value. |
| `getRequiredEnv(key, msg?)` | Server-only, hard requirement | Throws on empty-after-sanitize. |
| `getEnvNumber(key, default)` | Server-only numeric | `parseInt` after sanitize. |
| `getEnvBoolean(key, default?)` | Server-only boolean | Truthy: `true`, `1`, `yes`, `on` (case-insensitive). |
| `sanitizePublicEnv(rawValue, key)` | **Client / `NEXT_PUBLIC_*`** | Caller passes the literal `process.env.NEXT_PUBLIC_X` so the bundler can inline it. |
| `getPublicEnvBoolean(rawValue, key, default?)` | **Client / `NEXT_PUBLIC_*`** | Same shape as above, returns `boolean`. |
| `logEnvIssue(key, raw, sanitized)` | Internal | Emits one structured `console.warn('[env] sanitized KEY ...')` per key. Does *not* log the value itself. |

### 2.1 Why the split between `getEnv` and `sanitizePublicEnv`

In the browser bundle, Next.js / Turbopack only inlines a literal reference
like `process.env.NEXT_PUBLIC_FOO`. A dynamic `process.env[key]` lookup is
not inlined and resolves to `undefined`. So:

```ts
// ✅ CLIENT — keep the literal, hand it to the helper
const enabled = getPublicEnvBoolean(
  process.env.NEXT_PUBLIC_TRAKLET_ENABLED,
  'NEXT_PUBLIC_TRAKLET_ENABLED',
);

// ✅ SERVER — dynamic lookup is fine
const apiKey = getRequiredEnv('SENDGRID_API_KEY');

// ❌ NEVER — silent failures, no sanitization, no logging
const enabled = process.env.NEXT_PUBLIC_TRAKLET_ENABLED === 'true';
```

### 2.2 Structured logging

`logEnvIssue` writes a single `console.warn` per offending key:

```
[env] sanitized NEXT_PUBLIC_TRAKLET_ENABLED (lenRaw=5 -> 4) {
  key: 'NEXT_PUBLIC_TRAKLET_ENABLED',
  rawLength: 5,
  sanitizedLength: 4,
  hasNewline: true,
  hasCarriageReturn: false,
  hasSurroundingWhitespace: true,
  hasSurroundingQuotes: false,
}
```

- **Never** logs the actual value (covered by the `does not log the actual env value` unit test).
- De-duplicates per `key` so we don't spam logs on every render / request.
- Visible both in Vercel logs (server) and the browser DevTools console (client).

---

## 3. Full env-var inventory

### 3.1 Database / persistence

| Variable | Required | Surface | Sanitized via | Notes |
|---|---|---|---|---|
| `TURSO_DATABASE_URL` | yes | server | `getEnv` (in `lib/db.ts`) | Turso libSQL URL. |
| `TURSO_AUTH_TOKEN`   | yes | server | `getEnv` | JWT for libSQL auth. |

### 3.2 Auth / sessions

| Variable | Required | Surface | Sanitized via | Notes |
|---|---|---|---|---|
| `NEXTAUTH_SECRET`        | yes | server | `getEnv` | Used to sign `bb_session` JWT. |
| `JWT_SECRET`             | fallback | server | `getEnv` | Legacy alias for `NEXTAUTH_SECRET`. |
| `NEXTAUTH_URL`           | yes | server | `getEnv` | Auth callback base URL. |
| `SUPERADMIN_EMAIL`       | yes | server | `getEnv` | Whitelisted admin email. |
| `SUPERADMIN_PASSWORD_HASH` | yes (for password admin login) | server | direct read in `app/api/auth/admin-login/route.ts` (acceptable: bcrypt-compared, not string-equal) | Bcrypt hash, cost 12. |

### 3.3 Payments (Square)

| Variable | Required | Surface | Sanitized via | Notes |
|---|---|---|---|---|
| `SQUARE_ACCESS_TOKEN`    | yes | server | `getRequiredEnv` (in `SquarePaymentService`) | Already covered by 2026-01-09 incident. |
| `SQUARE_APPLICATION_ID`  | yes | server | `getEnv` | |
| `SQUARE_LOCATION_ID`     | yes | server | `getEnv` | |
| `SQUARE_ENVIRONMENT`     | yes | server | `getEnv` | `sandbox` / `production`. |
| `NEXT_PUBLIC_SQUARE_APPLICATION_ID` | optional (referenced in roadmap docs) | client | **must use** `sanitizePublicEnv` | |
| `NEXT_PUBLIC_SQUARE_LOCATION_ID`    | optional (referenced in roadmap docs) | client | **must use** `sanitizePublicEnv` | |

### 3.4 Email

| Variable | Required | Surface | Sanitized via | Notes |
|---|---|---|---|---|
| `EMAIL_PROVIDER`            | yes | server | `getEnv` | `sendgrid` / `gmail` / `smtp`. |
| `SENDGRID_API_KEY`          | sendgrid | server | `getRequiredEnv` | |
| `SENDGRID_FROM_EMAIL`       | sendgrid | server | `getRequiredEnv` | |
| `SENDGRID_FROM_NAME`        | optional | server | `getEnv` (default `BlessBox`) | |
| `SENDGRID_API_URL`          | optional | server | `getEnv` | Custom proxy. |
| `EMAIL_REPLY_TO`            | optional | server | `getEnv` | |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | smtp | server | `getEnv` | Vercel UI is known to inject literal `\n` here — sanitizer mandatory. |
| `GMAIL_USER` / `GMAIL_PASS` | gmail | server | `getEnv` | |

### 3.5 Operations / diagnostics

| Variable | Required | Surface | Sanitized via | Notes |
|---|---|---|---|---|
| `DIAGNOSTICS_SECRET`     | prod | server | `getEnv` | Gates `/api/system/*`. |
| `CRON_SECRET`            | prod | server | `getEnv` | Gates cron endpoints. |
| `PROD_TEST_LOGIN_SECRET` | optional | server | hand-rolled `replace + trim` in tests/fixtures (TODO: migrate to `getEnv`) | Production E2E only. |
| `PROD_TEST_SEED_SECRET`  | optional | server | hand-rolled `replace + trim` in tests/fixtures (TODO: migrate to `getEnv`) | Production E2E only. |
| `NODE_ENV`               | always | both | direct read OK (Next.js inlines as constant string, no whitespace risk) | Used everywhere. |
| `PORT`                   | optional | server | direct in `next.config.js` | Default 7777. |

### 3.6 QA / Traklet (the case that triggered this doc)

| Variable | Required | Surface | Sanitized via | Notes |
|---|---|---|---|---|
| `TRAKLET_PAT`                 | qa-only | server | `getEnv` (in `app/api/dev/traklet-proxy/route.ts`) | Never inlined to client. Fed into a server proxy that adds the GitHub `Authorization` header. |
| `NEXT_PUBLIC_TRAKLET_ENABLED` | qa-only | **client** | **`getPublicEnvBoolean`** (mandatory) | The string-equality bug that caused this doc to exist. |

### 3.7 Public app URL

| Variable | Required | Surface | Sanitized via | Notes |
|---|---|---|---|---|
| `PUBLIC_APP_URL`        | yes | server | `getEnv` | Used in emails / server links. |
| `NEXT_PUBLIC_APP_URL`   | yes | client | **must use** `sanitizePublicEnv` | Keep in sync with `PUBLIC_APP_URL`. |

---

## 4. Mandatory rules going forward

1. **Never** write `process.env.X === 'something'` outside `lib/utils/env.ts`.
2. **Server-side reads:** use `getEnv` / `getRequiredEnv` / `getEnvBoolean` / `getEnvNumber`.
3. **Client-side `NEXT_PUBLIC_*`:** pass the *literal* `process.env.NEXT_PUBLIC_FOO`
   into `sanitizePublicEnv` or `getPublicEnvBoolean`, with the key name as a string.
4. **Logging:** structured `[env] sanitized KEY` warnings are intentional. Treat
   them as bugs — they mean someone shipped a dirty env var. Fix the source,
   not the consumer.
5. **`.env*` files:** keep the **last line free of trailing whitespace**.
   Vercel UI: paste values without a trailing newline. Verify with
   `xxd path/to/.env | tail -2`.
6. **New env var checklist:**
   - [ ] Added to `env.template`.
   - [ ] Added to this inventory.
   - [ ] Read through `lib/utils/env.ts` helper (server) or `getPublicEnvBoolean` /
         `sanitizePublicEnv` (client).
   - [ ] Tests updated where behavior depends on the value.

---

## 5. Diagnostic surfaces

- **`/test-traklet`** — live page that displays the raw vs. sanitized value of
  `NEXT_PUBLIC_TRAKLET_ENABLED` and confirms the helper output. Use as a
  template for debugging any new client-side env var.
- **`[env]` warnings** — search Vercel logs and browser console for
  `[env] sanitized` to find dirty env vars in production.
- **`lib/utils/env.test.ts`** — TDD coverage for every helper. Includes
  regression tests for the literal `"true\n"` case from this incident.

---

## 6. Incident log (for future me)

| Date | Variable | Symptom | Root cause | Fix |
|---|---|---|---|---|
| 2026-01-09 | `SQUARE_ACCESS_TOKEN` | All payments 401 | Vercel UI stored value with trailing `\n` and surrounding `"` | Introduced `lib/utils/env.ts` + `getEnv`. |
| 2026-05-10 | `NEXT_PUBLIC_TRAKLET_ENABLED` | QA widget never appeared on `blessbox.org` despite `=true` | Inlined client value was `"true\n"` (POSIX trailing newline in `.env.production`); raw `===` comparison returned `false` | Added `sanitizePublicEnv` / `getPublicEnvBoolean` + structured `logEnvIssue`; rewrote `.env.production` without a trailing newline; routed `app/layout.tsx` and `components/dev/TrakletDevWidget.tsx` through the helper. |
