# Production Email Diagnosis (Sanitized)

This document is **sanitized** to avoid committing secrets.

## Diagnostic Steps

### 1) Check Vercel Logs

- Vercel Dashboard → Project → **Logs**
- Trigger a verification email:
  - `POST /api/onboarding/send-verification`
- Look for:
  - Success logs (SendGrid accepted / status 202)
  - Errors (Unauthorized, missing config, etc.)

### 2) Check SendGrid Activity

- SendGrid Dashboard → Activity → Email Activity
- Confirm the message appears and see delivery status.

### 3) Verify Vercel Environment Variables

- Confirm `SENDGRID_API_KEY` is set for **Production**
- Confirm `SENDGRID_FROM_EMAIL` is set (if your integration requires it)
- Redeploy after any env change:

```bash
vercel --prod
```

## Common Root Causes

- API key not set for Production environment
- API key revoked/rotated
- API key missing "Mail Send" permission
- Missing sender identity/domain verification in SendGrid

## Important

- Never commit API keys.
- Store secrets only in Vercel/CI secret storage.
