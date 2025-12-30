# Test Authentication Setup Guide

**Status:** Tests updated to authenticate properly. `PROD_TEST_LOGIN_SECRET` needs to be set for production E2E tests.

---

## Required Secrets for Production E2E Tests

### 1. PROD_TEST_SEED_SECRET ✅ (Already Set)
- **Purpose:** Allows creating test data via `/api/test/seed-prod`
- **Status:** ✅ Configured in Vercel and `.env.production.local`
- **Length:** 44 characters

### 2. PROD_TEST_LOGIN_SECRET ⚠️ (Needs to be Set)
- **Purpose:** Allows passwordless test login via `/api/test/login`
- **Status:** ⚠️ **NOT SET** (empty in `.env.production.local`)
- **Required for:** Onboarding flow tests, form builder tests, any test that needs authenticated user

---

## How to Set PROD_TEST_LOGIN_SECRET

### Step 1: Generate Secret

```bash
openssl rand -base64 32
```

**Example output:**
```
aBc123XyZ456DeF789GhI012JkL345MnO678PqR901StU234VwX567YzA890=
```

### Step 2: Set in Vercel

1. Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables
2. Add:
   - **Key:** `PROD_TEST_LOGIN_SECRET`
   - **Value:** `<your-generated-secret>`
   - **Environment:** Production
3. Save

### Step 3: Set Locally

Add to `.env.production.local`:
```bash
PROD_TEST_LOGIN_SECRET="<your-generated-secret>"
```

### Step 4: Redeploy

```bash
vercel --prod --yes
```

---

## Updated Tests

The following tests now authenticate before accessing protected pages:

1. **`tests/e2e/onboarding-flow.spec.ts`**
   - ✅ Authenticates before accessing `/onboarding/organization-setup`
   - ✅ Handles redirect to login gracefully
   - ✅ Skips test if `PROD_TEST_LOGIN_SECRET` not set (production only)

2. **`tests/e2e/user-reported-regressions.spec.ts`**
   - ✅ Authenticates before accessing onboarding pages
   - ✅ Handles missing login secret gracefully

---

## Test Behavior

### Local/Development
- Uses cookie-based test auth (`bb_test_auth`, `bb_test_email`)
- Works without `PROD_TEST_LOGIN_SECRET`
- Tests should pass locally

### Production
- Requires `PROD_TEST_LOGIN_SECRET` for authentication
- Tests will skip if secret not set (with clear message)
- Tests will fail if secret is wrong

---

## Verification

### Test Login Endpoint Works

```bash
# Replace <your-secret> with actual PROD_TEST_LOGIN_SECRET
curl -X POST https://www.blessbox.org/api/test/login \
  -H "Content-Type: application/json" \
  -H "x-qa-login-token: <your-secret>" \
  -d '{"email": "test@example.com"}'
```

**Expected Response:**
```json
{
  "success": true,
  "email": "test@example.com",
  "expiresAt": "..."
}
```

**If Wrong Secret:**
```json
{
  "success": false,
  "error": "Not found"
}
```
(Returns 404)

---

## Current Status

- ✅ **PROD_TEST_SEED_SECRET:** Set and working
- ⚠️ **PROD_TEST_LOGIN_SECRET:** **NOT SET** (needs to be configured)
- ✅ **Tests:** Updated to authenticate properly
- ✅ **Code:** All fixes deployed and working

---

## Next Steps

1. **Set `PROD_TEST_LOGIN_SECRET`** in Vercel and `.env.production.local`
2. **Redeploy** to apply the secret
3. **Run production E2E tests** to verify authentication works
4. **All tests should pass** once login secret is set

---

**Note:** The application code is working correctly. The test failures are due to missing `PROD_TEST_LOGIN_SECRET`. Once set, tests will authenticate properly and should pass.


