# Environment Variable Inventory

**Last updated:** 2026-05-10

## Rule

Store env values without trailing whitespace or quotes. Use `.trim()` when reading `NEXT_PUBLIC_*` variables in client code. Server-side variables use `lib/utils/env.ts` helpers.

---

## Inventory

### Database

| Variable | Required | Surface | Sanitized via | Notes |
|---|---|---|---|---|
| `TURSO_DATABASE_URL` | yes | server | `getEnv` (in `lib/db.ts`) | Turso libSQL URL. |
| `TURSO_AUTH_TOKEN`   | yes | server | `getEnv` | JWT for libSQL auth. |

### Auth

| Variable | Required | Surface | Sanitized via | Notes |
|---|---|---|---|---|
| `NEXTAUTH_SECRET`        | yes | server | `getEnv` | Used to sign `bb_session` JWT. |
| `JWT_SECRET`             | fallback | server | `getEnv` | Legacy alias for `NEXTAUTH_SECRET`. |
| `NEXTAUTH_URL`           | yes | server | `getEnv` | Auth callback base URL. |
| `SUPERADMIN_EMAIL`       | yes | server | `getEnv` | Whitelisted admin email. |
| `SUPERADMIN_PASSWORD_HASH` | yes (for password admin login) | server | direct read in `app/api/auth/admin-login/route.ts` (acceptable: bcrypt-compared, not string-equal) | Bcrypt hash, cost 12. |

### Payments (Square)

| Variable | Required | Surface | Sanitized via | Notes |
|---|---|---|---|---|
| `SQUARE_ACCESS_TOKEN`    | yes | server | `getRequiredEnv` (in `SquarePaymentService`) | Already covered by 2026-01-09 incident. |
| `SQUARE_APPLICATION_ID`  | yes | server | `getEnv` | |
| `SQUARE_LOCATION_ID`     | yes | server | `getEnv` | |
| `SQUARE_ENVIRONMENT`     | yes | server | `getEnv` | `sandbox` / `production`. |
| `NEXT_PUBLIC_SQUARE_APPLICATION_ID` | optional (referenced in roadmap docs) | client | **must use** `sanitizePublicEnv` | |
| `NEXT_PUBLIC_SQUARE_LOCATION_ID`    | optional (referenced in roadmap docs) | client | **must use** `sanitizePublicEnv` | |

### Email

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

### Operations

| Variable | Required | Surface | Sanitized via | Notes |
|---|---|---|---|---|
| `DIAGNOSTICS_SECRET`     | prod | server | `getEnv` | Gates `/api/system/*`. |
| `CRON_SECRET`            | prod | server | `getEnv` | Gates cron endpoints. |
| `PROD_TEST_LOGIN_SECRET` | optional | server | hand-rolled `replace + trim` in tests/fixtures (TODO: migrate to `getEnv`) | Production E2E only. |
| `PROD_TEST_SEED_SECRET`  | optional | server | hand-rolled `replace + trim` in tests/fixtures (TODO: migrate to `getEnv`) | Production E2E only. |
| `NODE_ENV`               | always | both | direct read OK (Next.js inlines as constant string, no whitespace risk) | Used everywhere. |
| `PORT`                   | optional | server | direct in `next.config.js` | Default 7777. |

### QA / Traklet

| Variable | Required | Surface | Sanitized via | Notes |
|---|---|---|---|---|
| `TRAKLET_PAT`                 | qa-only | server | `getEnv` (in `app/api/dev/traklet-proxy/route.ts`) | Never inlined to client. Fed into a server proxy that adds the GitHub `Authorization` header. |
| `NEXT_PUBLIC_TRAKLET_ENABLED` | qa-only | **client** | **`getPublicEnvBoolean`** (mandatory) | The string-equality bug that caused this doc to exist. |

### Public URLs

| Variable | Required | Surface | Sanitized via | Notes |
|---|---|---|---|---|
| `PUBLIC_APP_URL`        | yes | server | `getEnv` | Used in emails / server links. |
| `NEXT_PUBLIC_APP_URL`   | yes | client | **must use** `sanitizePublicEnv` | Keep in sync with `PUBLIC_APP_URL`. |

