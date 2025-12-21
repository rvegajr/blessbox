# Production Deployment Summary

**Deployment Date:** December 12, 2025  
**Status:** ✅ **DEPLOYED SUCCESSFULLY**

## What Was Deployed

### New Production-Safe QA Endpoints

1. **`/api/test/login`** - Passwordless test login endpoint
   - Issues `authjs.session-token` cookies
   - Requires `PROD_TEST_LOGIN_SECRET` header in production
   - Supports regular users and admin roles

2. **`/api/test/seed-prod`** - Deterministic QA data seeding
   - Creates/updates organization, QR codes, coupons, subscriptions, classes
   - Requires `PROD_TEST_SEED_SECRET` header in production
   - Idempotent (safe to run multiple times)

3. **`/api/test/verification-code`** - Fetch latest onboarding verification code
   - Secret-gated helper for QA automation (no inbox access needed)
   - Requires `PROD_TEST_SEED_SECRET` header in production

### Environment Variables Added

- `PROD_TEST_LOGIN_SECRET` (stored in Vercel production env)
- `PROD_TEST_SEED_SECRET` (stored in Vercel production env)

**Note:** Secrets are stored securely in Vercel/CI (not in git). **Do not write secret values into docs or commit them.**

## Production URLs

- **Main Site:** `https://www.blessbox.org`
- **Vercel Dashboard:** `https://vercel.com/rvegajrs-projects/bless-box`

## How to Use

### Run Full QA Coverage Tests

```bash
# Set secrets locally (retrieve from Vercel dashboard, or use: vercel env pull)
export PROD_TEST_LOGIN_SECRET="<YOUR_PROD_TEST_LOGIN_SECRET>"
export PROD_TEST_SEED_SECRET="<YOUR_PROD_TEST_SEED_SECRET>"

# Run QA tests with full coverage
npm run test:qa:production
```

### Test Login Endpoint (Production)

```bash
curl -X POST https://www.blessbox.org/api/test/login \
  -H "Content-Type: application/json" \
  -H "x-test-login-secret: $PROD_TEST_LOGIN_SECRET" \
  -d '{
    "email": "qa-prod-default@blessbox.app",
    "organizationId": "<org-id>",
    "admin": false,
    "expiresIn": 3600
  }'
```

### Test Seed Endpoint (Production)

```bash
curl -X POST https://www.blessbox.org/api/test/seed-prod \
  -H "Content-Type: application/json" \
  -H "x-test-seed-secret: $PROD_TEST_SEED_SECRET" \
  -d '{
    "seedKey": "qa-prod-default"
  }'
```

### Fetch Latest Verification Code (Production)

```bash
curl -X POST https://www.blessbox.org/api/test/verification-code \
  -H "Content-Type: application/json" \
  -H "x-test-seed-secret: $PROD_TEST_SEED_SECRET" \
  -d '{
    "email": "qa-prod-default@blessbox.app"
  }'
```

## Security Notes

- ✅ Secrets are stored in Vercel/CI (encrypted, not in git)
- ✅ Endpoints require secrets in production
- ✅ No passwords stored anywhere
- ✅ Short-lived sessions (default 1 hour)
- ✅ Idempotent operations
