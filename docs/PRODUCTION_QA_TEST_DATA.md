# Production QA Test Data Documentation

This document describes the deterministic test data seeded in production for QA testing. **No passwords or secrets are documented here** - authentication uses passwordless, secret-gated endpoints.

## Overview

Production QA testing uses two secret-gated endpoints:
1. **`/api/test/login`** - Passwordless test login (issues `authjs.session-token` cookie)
2. **`/api/test/seed-prod`** - Deterministic QA data seeding

Both endpoints require environment secrets stored in Vercel/CI (not in git):
- `PROD_TEST_LOGIN_SECRET` - Secret for test login endpoint
- `PROD_TEST_SEED_SECRET` - Secret for seed endpoint

## Seeded Data Structure

### Organization

**Default Seed Key**: `qa-prod-default` (or custom via `seedKey` parameter)

**Organization Details**:
- **Name**: `QA Production Org ({seedKey})`
- **Slug**: `qa-prod-{seedKey}` (derived from name)
- **Contact Email**: `qa-prod-{seedKey}@blessbox.app`
- **Contact Phone**: `555-1234`
- **Address**: `123 Test St, Test City, TS 12345`
- **Email Verified**: `true`

**Note**: If an organization with the same slug or email already exists, it will be updated rather than creating a duplicate.

### QR Code Set

**Name**: `QA Production Registration QR Codes`

**Form Fields** (default):
- `firstName` (text, required)
- `lastName` (text, required)
- `email` (email, required)
- `phone` (phone, optional)
- `address` (textarea, optional)
- `dateOfBirth` (date, optional)

**Entry Points** (default):
- `main-entrance` - "Main Entrance"
- `side-door` - "Side Door"

**QR Code URLs**: `{BASE_URL}/register/{orgSlug}/{entryPointSlug}`

### Test Coupons

The following coupon codes are seeded (matching QA Testing Guide requirements):

| Code | Type | Value | Max Uses | Expires | Applicable Plans |
|------|------|-------|----------|---------|------------------|
| `FREE100` | Percentage | 100% | None | None | standard, enterprise |
| `WELCOME50` | Percentage | 50% | None | None | standard, enterprise |
| `SAVE20` | Fixed | $20.00 | None | None | standard, enterprise |
| `FIRST10` | Fixed | $10.00 | None | None | standard, enterprise |
| `EXPIRED` | Percentage | 10% | None | Past date | standard, enterprise |
| `MAXEDOUT` | Percentage | 10% | 1 | None | standard, enterprise |

**Note**: `MAXEDOUT` is pre-exhausted (current_uses = max_uses) to test limit enforcement.

### Subscription (Optional)

**Default**: Created unless `seedSubscription: false`

- **Plan Type**: `standard`
- **Billing Cycle**: `monthly`
- **Currency**: `USD`
- **Status**: `active`

### Class Management (Optional)

**Default**: Created unless `seedClasses: false`

**Class**:
- **Name**: `Yoga Basics`
- **Description**: `Introduction to yoga for beginners`
- **Capacity**: `20`
- **Timezone**: `UTC`
- **Status**: `active`

**Session**:
- **Date**: 7 days in the future (from seed time)
- **Time**: `10:00`
- **Duration**: `60` minutes
- **Location**: `Main Studio`
- **Instructor**: `Jane Smith`
- **Status**: `scheduled`

**Participant**:
- **Name**: `Alice Johnson`
- **Email**: `alice-{seedKey}@blessbox.app`
- **Phone**: `(555) 111-2222`
- **Status**: `active`

**Enrollment**:
- **Status**: `confirmed`
- **Notes**: `QA Production seed enrollment`

## API Endpoints

### POST `/api/test/login`

**Headers**:
- `x-test-login-secret`: `{PROD_TEST_LOGIN_SECRET}` (required in production)

**Body**:
```json
{
  "email": "qa-prod-default@blessbox.app",
  "organizationId": "{orgId}",
  "admin": false,
  "expiresIn": 3600
}
```

**Response**:
```json
{
  "success": true,
  "email": "qa-prod-default@blessbox.app",
  "expiresAt": "2024-12-13T12:00:00.000Z",
  "role": "user",
  "organizationId": "{orgId}"
}
```

**Cookie Set**: `authjs.session-token` (or `__Secure-authjs.session-token` in production)

### POST `/api/test/seed-prod`

**Headers**:
- `x-test-seed-secret`: `{PROD_TEST_SEED_SECRET}` (required in production)

**Body**:
```json
{
  "seedKey": "qa-prod-default",
  "organizationName": "QA Production Org",
  "contactEmail": "qa-prod-default@blessbox.app",
  "seedSubscription": true,
  "seedClasses": true,
  "formFields": [...],
  "entryPoints": [...]
}
```

**Response**:
```json
{
  "success": true,
  "organizationId": "{uuid}",
  "orgSlug": "qa-prod-default",
  "contactEmail": "qa-prod-default@blessbox.app",
  "qrCodeSetId": "{uuid}",
  "qrCodes": [...],
  "subscriptionId": "{uuid}",
  "classId": "{uuid}",
  "sessionId": "{uuid}",
  "participantId": "{uuid}",
  "enrollmentId": "{uuid}",
  "note": "Seeded with production secret gate"
}
```

## Test User Accounts

**No passwords are stored or required**. Test authentication uses:

1. **Regular User**: Email from seeded organization (`qa-prod-{seedKey}@blessbox.app`)
2. **Super Admin**: `admin@blessbox.app` (set `admin: true` in login request)

Both are authenticated via passwordless, secret-gated login endpoint that issues NextAuth session tokens.

## Environment Variables

Required in Vercel/CI (not in git):

- `PROD_TEST_LOGIN_SECRET` - Secret for `/api/test/login` endpoint
- `PROD_TEST_SEED_SECRET` - Secret for `/api/test/seed-prod` endpoint
- `NEXTAUTH_SECRET` - Used to sign session tokens (already required)

## Usage in CI/CD

```bash
# Set secrets in Vercel
vercel env add PROD_TEST_LOGIN_SECRET production
vercel env add PROD_TEST_SEED_SECRET production

# Run QA tests with secrets
PROD_TEST_LOGIN_SECRET=... PROD_TEST_SEED_SECRET=... npm run test:qa:production
```

## Security Notes

- **No passwords**: All test authentication is passwordless
- **Secret-gated**: Endpoints require environment secrets (not in git)
- **Short-lived sessions**: Default 1-hour expiration
- **Production-only**: Secrets are only required in production; non-production allows access without secrets for local/dev recovery
- **Idempotent**: Seeding can be run multiple times safely (updates existing orgs/data)

## QA Coverage

When secrets are provided, the QA test suite (`tests/e2e/qa-testing-guide-coverage.spec.ts`) runs **100% coverage** including:
- ✅ Pricing + coupons + checkout totals
- ✅ Registration creation, viewing, check-in, undo, export (CSV/PDF)
- ✅ Class management (create class, add session, add participant, enroll with capacity enforcement)
- ✅ Admin panel (stats, orgs, subscriptions, coupons)

Without secrets, production tests run in **read-only mode** (public pages only).
