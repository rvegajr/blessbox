# Production Test Quick Start

## ✅ What We Have

Unified Playwright tests that work for **both local AND production** with a simple parameter change:

```bash
# Test locally (11/11 passing ✅)
./run-verification-tests.sh local

# Test production (3/11 passing ⚠️ - needs one secret)
./run-verification-tests.sh production
```

## ⚠️ What's Blocking Full Production Tests

The `PROD_TEST_LOGIN_SECRET` is empty in Vercel. Only 3/11 tests work (the ones that don't need login).

## 🔧 Fix (2 minutes)

1. **Generate a token**:
   ```bash
   openssl rand -hex 32
   ```

2. **Set it in Vercel**:
   ```bash
   vercel env add PROD_TEST_LOGIN_SECRET production
   # Paste the generated token
   ```

3. **Pull it locally**:
   ```bash
   vercel env pull .env.production.local --environment production
   ```

4. **Run full production tests**:
   ```bash
   ./run-verification-tests.sh production
   # Expected: 11/11 passing ✅
   ```

## 📊 Current Results

### Local (✅ Perfect)
- 11/11 tests passing
- No manual steps
- Fully automated

### Production (⚠️ Partial)
- 3/11 tests passing:
  - ✅ Health endpoint
  - ✅ Diagnostics redirect  
  - ✅ Landing page (logged out)
- 8/11 tests failing:
  - ❌ All authenticated flows (need `PROD_TEST_LOGIN_SECRET`)

## 📖 Full Documentation

See `docs/AUTOMATED_PRODUCTION_VERIFICATION.md` for complete details.
