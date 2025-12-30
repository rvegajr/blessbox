# How to Set PROD_TEST_SEED_SECRET Properly

**Purpose:** `PROD_TEST_SEED_SECRET` protects production QA/testing endpoints (`/api/test/seed-prod`, `/api/test/verification-code`) from unauthorized access.

**Security:** This secret allows creating test data in production, so it must be strong and kept secure.

---

## Step 1: Generate a Strong Secret

**Option A: Using OpenSSL (Recommended)**
```bash
openssl rand -base64 32
```

**Example output:**
```
aBc123XyZ456DeF789GhI012JkL345MnO678PqR901StU234VwX567YzA890=
```

**Option B: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option C: Using Python**
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Requirements:**
- Minimum 32 characters (64+ recommended)
- Random and unpredictable
- Base64 or URL-safe characters only
- **Never commit to git**

---

## Step 2: Set in Vercel Production Environment

### Via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard:**
   - Navigate to: https://vercel.com/dashboard
   - Select your project: **BlessBox**

2. **Open Environment Variables:**
   - Click **Settings** → **Environment Variables**

3. **Add the Secret:**
   - **Key:** `PROD_TEST_SEED_SECRET`
   - **Value:** `<paste-your-generated-secret>`
   - **Environment:** Select **Production** (and optionally Preview/Development if you want)
   - Click **Save**

4. **Verify:**
   - The variable should appear in the list
   - Environment column should show "Production" (or "Production, Preview, Development")

### Via Vercel CLI (Alternative)

```bash
# Set for production only
vercel env add PROD_TEST_SEED_SECRET production

# When prompted, paste your secret and press Enter
# Example: aBc123XyZ456DeF789GhI012JkL345MnO678PqR901StU234VwX567YzA890=
```

**Verify it was added:**
```bash
vercel env ls
# Should show PROD_TEST_SEED_SECRET in the list
```

---

## Step 3: Set in Local Environment (for Running Tests)

**For local E2E tests against production:**

1. **Add to `.env.local`** (create if doesn't exist):
   ```bash
   PROD_TEST_SEED_SECRET=aBc123XyZ456DeF789GhI012JkL345MnO678PqR901StU234VwX567YzA890=
   ```

2. **Verify `.env.local` is in `.gitignore`:**
   ```bash
   grep -q "^\.env\.local$" .gitignore && echo "✅ .env.local is ignored" || echo "❌ Add .env.local to .gitignore"
   ```

3. **Load environment variables:**
   ```bash
   # If using zsh/bash
   source .env.local
   
   # Or run tests with explicit env var
   PROD_TEST_SEED_SECRET=<your-secret> npm run test:e2e:production
   ```

---

## Step 4: Redeploy to Apply Changes

**After setting in Vercel, redeploy:**

```bash
vercel --prod --yes
```

**Or trigger via Vercel Dashboard:**
- Go to **Deployments**
- Click **Redeploy** on latest deployment
- Or push a new commit to trigger auto-deploy

**Note:** Environment variables are available immediately, but redeploy ensures the app picks them up.

---

## Step 5: Verify It Works

### Test 1: Check Environment Variable is Set

**Via API endpoint (if diagnostics secret is also set):**
```bash
curl https://www.blessbox.org/api/system/env-check \
  -H "x-diagnostics-token: <DIAGNOSTICS_SECRET>"
```

**Expected:** Should show `PROD_TEST_SEED_SECRET` is set (but not the value).

### Test 2: Test Seeding Endpoint (Should Work)

```bash
# Replace <your-secret> with actual PROD_TEST_SEED_SECRET
curl -X POST https://www.blessbox.org/api/test/seed-prod \
  -H "Content-Type: application/json" \
  -H "x-qa-seed-token: <your-secret>" \
  -d '{"seedKey": "test-verification"}'
```

**Expected Response:**
```json
{
  "success": true,
  "organizationId": "...",
  "contactEmail": "qa-prod-test-verification@blessbox.app",
  ...
}
```

**If Wrong Secret:**
```json
{
  "success": false,
  "error": "Not found"
}
```
(Returns 404 to avoid information leakage)

### Test 3: Run E2E Tests

```bash
# Set secret in environment
export PROD_TEST_SEED_SECRET=<your-secret>

# Run production E2E tests
npm run test:e2e:production

# Or run specific test that requires seeding
npm run test:e2e:production -- tests/e2e/onboarding-flow.spec.ts
```

**Expected:** Tests that require `PROD_TEST_SEED_SECRET` should pass instead of failing with "Production tests require PROD_TEST_SEED_SECRET".

---

## Step 6: Security Best Practices

### ✅ DO:
- ✅ Use a strong, random secret (32+ characters)
- ✅ Set it only in Vercel Production environment
- ✅ Keep it secret (never commit to git)
- ✅ Rotate it periodically (every 6-12 months)
- ✅ Use different secrets for different environments (prod vs staging)
- ✅ Document who has access (for audit purposes)

### ❌ DON'T:
- ❌ Commit `PROD_TEST_SEED_SECRET` to git
- ❌ Share it in Slack/email (use secure password manager)
- ❌ Use weak secrets (like "test123" or "password")
- ❌ Reuse secrets from other projects
- ❌ Set it in client-side code (it's server-only)

---

## Troubleshooting

### Problem: Tests Still Fail with "Production tests require PROD_TEST_SEED_SECRET"

**Possible Causes:**

1. **Secret not set in Vercel:**
   ```bash
   # Check Vercel dashboard → Settings → Environment Variables
   # Verify PROD_TEST_SEED_SECRET exists and is set to Production
   ```

2. **Secret not set locally (for running tests):**
   ```bash
   # Add to .env.local or export before running tests
   export PROD_TEST_SEED_SECRET=<your-secret>
   ```

3. **Deployment hasn't picked up the env var:**
   ```bash
   # Redeploy after setting env var
   vercel --prod --yes
   ```

4. **Wrong secret value:**
   ```bash
   # Verify secret matches exactly (no extra spaces, correct case)
   # Test with curl (see Step 5 above)
   ```

### Problem: "Not found" (404) When Calling Seed Endpoint

**Cause:** Secret mismatch or missing header.

**Fix:**
```bash
# Verify header name is correct
# Use: x-qa-seed-token (preferred) or x-test-seed-secret

curl -X POST https://www.blessbox.org/api/test/seed-prod \
  -H "x-qa-seed-token: <your-secret>" \
  -d '{"seedKey": "test"}'
```

### Problem: Secret Works Locally But Not in CI/CD

**Cause:** CI/CD environment doesn't have the secret.

**Fix:**
- Add `PROD_TEST_SEED_SECRET` to your CI/CD platform's secrets
- GitHub Actions: Settings → Secrets → Actions → New repository secret
- GitLab CI: Settings → CI/CD → Variables → Add variable
- CircleCI: Project Settings → Environment Variables

---

## Related Secrets

**`PROD_TEST_LOGIN_SECRET`** (Optional, for test login endpoint):
- Similar setup process
- Used by `/api/test/login` for passwordless test authentication
- Set separately if you need test login functionality

**`DIAGNOSTICS_SECRET`** (Optional, for system diagnostics):
- Protects `/api/system/*` endpoints
- Different from `PROD_TEST_SEED_SECRET`
- Set separately if you need diagnostics access

---

## Quick Reference

**Generate Secret:**
```bash
openssl rand -base64 32
```

**Set in Vercel:**
```bash
vercel env add PROD_TEST_SEED_SECRET production
```

**Set Locally:**
```bash
echo "PROD_TEST_SEED_SECRET=<your-secret>" >> .env.local
```

**Test It:**
```bash
curl -X POST https://www.blessbox.org/api/test/seed-prod \
  -H "x-qa-seed-token: <your-secret>" \
  -H "Content-Type: application/json" \
  -d '{"seedKey": "test"}'
```

**Run Tests:**
```bash
PROD_TEST_SEED_SECRET=<your-secret> npm run test:e2e:production
```

---

**Last Updated:** Based on current codebase structure  
**Security Level:** High (protects production data creation endpoints)

