# Production E2E Testing Guide

## Overview

This guide explains how to run end-to-end tests against the production deployment to verify all client issue fixes are working correctly.

## Quick Start

### Run All Production Verification Tests

```bash
npm run test:e2e:production:verify
```

### Run Tests with Browser Visible (Headed Mode)

```bash
npm run test:e2e:production:verify:headed
```

### Run Against Custom Production URL

```bash
PRODUCTION_URL=https://your-production-url.vercel.app BASE_URL=https://your-production-url.vercel.app npx playwright test tests/e2e/production-verification.spec.ts
```

## What Gets Tested

The `production-verification.spec.ts` test suite verifies all client issue fixes:

### ✅ Fix 1: Payment Authentication
- Verifies email input field is present on checkout page
- Tests that payment API rejects requests without email
- Tests that payment API accepts requests with email
- Verifies email persists after coupon application

### ✅ Fix 2: Form Persistence
- Verifies onboarding state persistence behaves correctly
- Confirms onboarding flow progresses correctly (6-digit code auth)

### ✅ Fix 3: QR Dashboard Safety
- Verifies QR code URL slugs are immutable (read-only)
- Tests that only display name (description) can be edited
- Confirms URL slug doesn't change after editing description
- Verifies immutable slug warning is displayed

### ✅ Fix 4: QR Code Form Resolution
- Tests backward-compatible QR code matching
- Verifies form loads correctly when scanning QR code
- Confirms dropdown options are preserved in form config
- Tests that registration form displays dropdown options correctly

### ✅ Fix 5: Dropdown Options Preservation
- Verifies dropdown options are saved correctly
- Tests that options survive form config serialization
- Confirms options are retrieved correctly from API

### ✅ Comprehensive: Full Onboarding Flow
- Tests complete onboarding flow end-to-end
- Verifies all steps work together correctly
- Confirms QR codes are generated and forms are accessible

## Test Configuration

### Environment Variables

- `BASE_URL` - The production URL to test against (default: `https://www.blessbox.org`)
- `PRODUCTION_URL` - Same as BASE_URL, used to detect production mode
- `E2E_TEST_EMAIL` - Optional email to use for tests (default: auto-generated)

### Example: Test Against Vercel Preview Deployment

```bash
PRODUCTION_URL=https://bless-1ud6x1bee-rvegajrs-projects.vercel.app \
BASE_URL=https://bless-1ud6x1bee-rvegajrs-projects.vercel.app \
npx playwright test tests/e2e/production-verification.spec.ts
```

## Test Output

The tests output detailed console logs showing:
- ✅ What passed
- ⚠️ What was skipped (due to auth requirements, etc.)
- ❌ What failed

Example output:
```
🔍 Testing Fix 1: Payment Authentication...
   ✅ Email input field is visible
   ✅ Email filled: test@example.com
   ✅ FREE100 coupon applied
   ✅ Email persists after coupon application
   ✅ API correctly rejects payment without email
   ✅ API accepts payment with email
✅ Fix 1 Verification Complete
```

## Authentication Requirements

Some tests require authentication (e.g., QR dashboard tests). These tests will:
- Skip gracefully if not authenticated
- Log a warning message
- Continue with other tests

To test authenticated flows:
1. Log in to production manually
2. Run tests in headed mode: `npm run test:e2e:production:verify:headed`
3. Tests will use your existing session

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Production E2E Tests

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  e2e-production:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e:production:verify
        env:
          BASE_URL: https://www.blessbox.org
          PRODUCTION_URL: https://www.blessbox.org
```

## Troubleshooting

### Tests Skip Authentication-Required Steps

**Solution**: Run tests in headed mode and log in manually before tests start:
```bash
npm run test:e2e:production:verify:headed
```

### Tests Fail with "Form unavailable"

**Possible Causes**:
1. QR code not generated correctly
2. Organization slug mismatch
3. QR label doesn't match stored data

**Solution**: Check test logs for the exact orgSlug and qrLabel being used, then verify in production database.

### 6-digit code Tokens Are Not Accessible (Expected)

**Cause**: 6-digit code authentication tokens are handled by NextAuth and are not exposed for security.

**Solution**:
- Production tests should **not** depend on reading 6-digit code tokens.
- Use **headed mode** for manual login (session reuse), or use secret-gated QA helpers where applicable.

## Best Practices

1. **Run tests after every production deployment** to catch regressions early
2. **Use headed mode** when debugging to see what's happening
3. **Check test logs** for detailed information about what passed/failed
4. **Run locally first** with `TEST_ENV=local` before testing production
5. **Keep test data clean** - tests use timestamped emails/orgs to avoid conflicts

## Related Documentation

- [Production Testing Guide](./PRODUCTION_TESTING_GUIDE.md)
- [E2E Test Suite Overview](../tests/e2e/README.md)
- [Client Issue Fixes Summary](./CLIENT_ISSUES_FIXED.md)
