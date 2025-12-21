# 🧪 Production Testing Guide

Quick reference for running E2E tests against production.

---

## 🚀 Quick Start

### Run All Production Tests
```bash
npm run test:e2e:production
```

### Run Specific Test Suite
```bash
# Tutorial system tests
BASE_URL=https://www.blessbox.org npx playwright test tests/e2e/tutorial-system-comprehensive.spec.ts

# API endpoint tests
BASE_URL=https://www.blessbox.org npx playwright test tests/e2e/api-endpoints.spec.ts

# Complete application flow
BASE_URL=https://www.blessbox.org npx playwright test tests/e2e/complete-application-flow.spec.ts

# Production real data tests
BASE_URL=https://www.blessbox.org npx playwright test tests/e2e/production-real-data-test.spec.ts
```

### Run with HTML Report
```bash
npm run test:e2e:production:all
# Then open: npx playwright show-report
```

---

## 📋 Available Test Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Production Tests** | `npm run test:e2e:production` | Run all tests against production |
| **Production (HTML)** | `npm run test:e2e:production:all` | Run with HTML report |
| **Default E2E** | `npm run test:e2e` | Run against production (default) |
| **Development** | `npm run test:e2e:dev` | Run against dev environment |
| **Local** | `npm run test:e2e:local` | Run against local dev server |
| **Headed Mode** | `npm run test:e2e:headed` | Run with browser visible |
| **Debug Mode** | `npm run test:e2e:debug` | Run in debug mode |

### Tech smoke tests (Email + Payments)
Use `scripts/test-tech.sh` to validate **SendGrid + Square** quickly (sandbox or production) by loading an env file directly:

```bash
# Credentials-only checks (no email send, no Square charges)
./scripts/test-tech.sh --env-file .env.production --base-url https://www.blessbox.org
```

More: `docs/TECH_SMOKE_TESTS.md`

---

## 🎯 Test Suites

### 1. Tutorial System Tests ✅
**File**: `tests/e2e/tutorial-system-comprehensive.spec.ts`
- Tests tutorial system foundation
- Tests all 13 tutorials
- Tests context-aware triggers
- **Status**: Fully tested

### 2. API Endpoint Tests ✅
**File**: `tests/e2e/api-endpoints.spec.ts`
- Tests all API endpoints
- Tests export functionality
- Tests OData queries
- **Status**: Comprehensive

### 3. Complete Application Flow ✅
**File**: `tests/e2e/complete-application-flow.spec.ts`
- Tests full onboarding flow
- Tests registration submission
- Tests check-in process
- **Status**: Complete

### 4. Production Real Data Tests ✅
**File**: `tests/e2e/production-real-data-test.spec.ts`
- Tests with real production data
- Tests coupon validation
- Tests organization creation
- **Status**: Working

### 5. Tutorial Individual Tests ✅
**File**: `tests/e2e/tutorial-individual-tests.spec.ts`
- Tests each tutorial individually
- Tests tutorial interactions
- **Status**: Complete

### 6. Tutorial Context Triggers ✅
**File**: `tests/e2e/tutorial-context-triggers.spec.ts`
- Tests all 10 context triggers
- Tests trigger conditions
- **Status**: Complete

### 7. Tutorial Reliability Tests ✅
**File**: `tests/e2e/tutorial-reliability-test.spec.ts`
- Tests tutorial system reliability
- Tests multiple iterations
- **Status**: Complete

### 8. Business Flow Tests ✅
**File**: `tests/e2e/blessbox-business-flow.spec.ts`
- Tests business workflows
- Tests user journeys
- **Status**: Complete

### 9. Full Flow Tests ✅
**File**: `tests/e2e/blessbox-full-flow.spec.ts`
- Tests complete user flows
- Tests end-to-end scenarios
- **Status**: Complete

### 10. User Experience Tests ✅
**File**: `tests/e2e/complete-user-experience.spec.ts`
- Tests UI/UX flows
- Tests navigation
- **Status**: Complete

### 11. Onboarding Flow Tests ✅
**File**: `tests/e2e/onboarding-flow.spec.ts`
- Tests onboarding UI
- Tests form validation
- **Status**: Complete

---

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `https://www.blessbox.org` | Production URL |
| `TEST_ENV` | `production` | Test environment |

### Playwright Configuration

Located in: `playwright.config.ts`

- **Base URL**: Configurable via `BASE_URL` env var
- **Default**: Production (`https://www.blessbox.org`)
- **Timeout**: 30 seconds per test
- **Workers**: 1 (sequential execution)
- **Retries**: 2 in CI, 0 locally

---

## 🔍 Test Coverage

### What's Tested ✅
- ✅ Tutorial system (100%)
- ✅ Onboarding flow (100%)
- ✅ Registration flow (100%)
- ✅ API endpoints (33%)
- ✅ User experience flows
- ✅ Business workflows

### What's Missing ❌
- ❌ QR code management E2E tests
- ❌ Dashboard analytics E2E tests (authenticated)
- ❌ Classes & enrollments E2E tests
- ❌ Admin panel E2E tests
- ❌ Payment flow E2E tests (full)
- ❌ Registration detail page E2E tests

See `TEST_COVERAGE_ANALYSIS.md` for detailed coverage report.

---

## 🐛 Troubleshooting

### Tests Failing in Production

1. **Check BASE_URL**
   ```bash
   echo $BASE_URL
   # Should be: https://www.blessbox.org
   ```

2. **Verify Network Access**
   ```bash
   curl https://www.blessbox.org/api/dashboard/stats
   # Should return 401 (unauthorized) or 200 (if authenticated)
   ```

3. **Check Test Timeouts**
   - Increase timeout in `playwright.config.ts` if needed
   - Some tests may need longer timeouts for production

4. **Run in Headed Mode**
   ```bash
   npm run test:e2e:headed
   # Watch the browser to see what's happening
   ```

### Common Issues

**Issue**: Tests timeout
- **Solution**: Increase timeout or check network connectivity

**Issue**: Tests fail with 401 errors
- **Solution**: Expected for unauthenticated endpoints. Tests should handle this.

**Issue**: Tests create real data
- **Solution**: Use test email addresses with timestamps. Clean up test data manually if needed.

---

## 📊 Test Results

### View HTML Report
```bash
npm run test:report
```

### View Test Results in CI
- Tests run automatically on deployment
- Results available in GitHub Actions (if configured)

---

## 🔄 Continuous Integration

### Recommended CI Setup

Add to `.github/workflows/e2e-production.yml`:
```yaml
name: E2E Production Tests

on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: BASE_URL=https://www.blessbox.org npx playwright test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 📝 Best Practices

1. **Always use BASE_URL env var** - Don't hardcode URLs
2. **Use test data with timestamps** - Avoid conflicts
3. **Clean up test data** - Remove test organizations after tests
4. **Run tests sequentially** - Avoid data conflicts
5. **Check test results** - Review HTML reports regularly

---

## 🎯 Next Steps

1. ✅ Production tests are configured and working
2. ⏳ Add missing E2E tests (see `TEST_COVERAGE_ANALYSIS.md`)
3. ⏳ Add CI/CD integration
4. ⏳ Add test coverage reporting
5. ⏳ Add performance tests

---

**Last Updated**: 2025-11-17

