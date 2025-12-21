# 🧪 Tech Smoke Tests (Email + Payments)

This repo includes a **single script** to validate the two external systems that most often break deployments:

- **Email**: SendGrid configuration + (optional) real send
- **Payments**: Square configuration + **non-charging** credential validation

It works for both **sandbox** and **production** by loading a specific `.env` file directly.

---

## ✅ Quick Start

### 1) Test provider credentials from an env file (no deployment required)

```bash
./scripts/test-tech.sh --env-file .env.sandbox
```

### 2) Test a deployed environment too (recommended for production)

```bash
./scripts/test-tech.sh --env-file .env.production --base-url https://www.blessbox.org
```

### 3) Send a real test email (optional)

```bash
./scripts/test-tech.sh \
  --env-file .env.production \
  --base-url https://www.blessbox.org \
  --email-to you@example.com \
  --send-test-email
```

---

## What it validates

### Email (SendGrid)
- Validates the API key (calls `GET https://api.sendgrid.com/v3/user/profile`)
- Attempts to read:
  - `GET /v3/senders` (may fail if API key lacks permission)
  - `GET /v3/whitelabel/domains` (may fail if API key lacks permission)
- Optional real send via `POST /v3/mail/send` when `--send-test-email` is used

### Payments (Square)
- **Never charges a card**
- Validates credentials via:
  - `GET /v2/merchants/me` (token validity)
  - `GET /v2/locations/{locationId}` (optional, if `SQUARE_LOCATION_ID` is set)

### Deployed app checks (when `--base-url` is set)
- `GET /api/system/health-check`
- `GET /api/system/email-health` *(protected in production)*
- `GET /api/system/square-health` *(protected in production)*
- Optional: `POST /api/test-production-email` *(protected in production)*

---

## Required env vars

### SendGrid
- `SENDGRID_API_KEY`
- `SENDGRID_FROM_EMAIL` (required only if you send a test email)
- `SENDGRID_FROM_NAME` (optional)
- `EMAIL_REPLY_TO` (optional)

### Square
- `SQUARE_ACCESS_TOKEN`
- `SQUARE_ENVIRONMENT` (`sandbox` | `production`)
- `SQUARE_LOCATION_ID` (recommended)

### Production-only diagnostics auth
To access protected endpoints on production deployments, include one of:
- `DIAGNOSTICS_SECRET` *(preferred)*, or
- `CRON_SECRET`

---

## Related endpoints
- `/api/system/health-check` — DB + server basic health
- `/api/system/email-health` — email provider + template/log diagnostics (auth in prod)
- `/api/system/square-health` — Square credential diagnostics (auth in prod; non-charging)
- `/api/test-production-email` — send a real test email (auth in prod)

