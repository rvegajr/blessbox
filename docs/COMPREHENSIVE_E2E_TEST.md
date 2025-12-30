# Comprehensive End-to-End Test Documentation

## Overview

We now have a complete end-to-end test suite that tests the entire application flow from onboarding to check-in, verifying all the services we implemented following TDD and ISP principles.

## Test Files

Our E2E test suite consists of **3 focused test files** covering different aspects:

### 1. `tests/e2e/complete-application-flow.spec.ts` ⭐ **PRIMARY COMPREHENSIVE TEST**
This is the main comprehensive E2E test that tests the complete application flow via API calls:

**Test Flow:**
1. ✅ **Legacy Email Verification Codes (Test Harness)** - Sends and verifies 6-digit codes (legacy/back-compat)
2. ✅ **Organization Creation** - Creates organization via API (OrganizationService)
3. ✅ **Form Configuration** - Creates registration form configuration (FormConfigService)
4. ✅ **QR Code Generation** - Generates QR codes for the organization (QRCodeService)
5. ✅ **Registration Submission** - Submits a test registration (RegistrationService)
6. ✅ **Check-In** - Checks in the registration (RegistrationService)
7. ✅ **Dashboard APIs** - Verifies dashboard endpoints
8. ✅ **QR Code APIs** - Verifies QR code management
9. ✅ **Registration APIs** - Verifies registration management
10. ✅ **Rate Limiting** - Tests rate limiting on legacy verification codes (if enabled)
11. ✅ **Input Validation** - Tests validation (invalid email, missing fields, duplicates)
12. ✅ **API Endpoints** - Comprehensive API health check

### 2. `tests/e2e/complete-user-experience.spec.ts` 🎨 **UI/UX TEST**
This test focuses on UI navigation and page accessibility:
- Landing page navigation
- Pricing page
- Dashboard UI pages
- Mobile responsiveness
- Visual elements and user flow

### 3. `tests/e2e/onboarding-flow.spec.ts` 🔄 **ONBOARDING WORKFLOW TEST**
This test focuses specifically on the onboarding user interface:
- Organization setup form
- Email verification UI
- Form builder interface
- QR configuration interface
- Step navigation
- Form validation

## Test Organization Summary

| Test File | Focus | Type | Priority |
|-----------|-------|------|----------|
| `complete-application-flow.spec.ts` | Full API flow from onboarding to check-in | API Integration | ⭐ High |
| `complete-user-experience.spec.ts` | UI navigation and page accessibility | UI/UX | Medium |
| `onboarding-flow.spec.ts` | Onboarding form workflow | UI Forms | Medium |

**Removed Duplicates:**
- ❌ `blessbox-business-flow.spec.ts` - Merged into `complete-application-flow.spec.ts`
- ❌ `blessbox-full-flow.spec.ts` - Merged into `complete-application-flow.spec.ts`
- ❌ `api-endpoints.spec.ts` - Merged into `complete-application-flow.spec.ts`

## Running the Tests

### Prerequisites
1. Ensure the development server is running:
   ```bash
   npm run dev
   ```

2. Set the base URL (optional, defaults to localhost:7777):
   ```bash
   export BASE_URL=http://localhost:7777
   ```

### Run All E2E Tests
```bash
npm run test:e2e
```

### Run Specific Test Files
```bash
# Primary comprehensive test (recommended for CI/CD)
npx playwright test tests/e2e/complete-application-flow.spec.ts

# UI/UX test
npx playwright test tests/e2e/complete-user-experience.spec.ts

# Onboarding workflow test
npx playwright test tests/e2e/onboarding-flow.spec.ts
```

### Run in UI Mode (Interactive)
```bash
npx playwright test --ui
```

### Run in Debug Mode
```bash
npx playwright test --debug tests/e2e/complete-application-flow.spec.ts
```

## What the Test Verifies

### Services Tested
- ✅ **OrganizationService** - Organization creation, validation, email uniqueness
- ✅ **VerificationService** - Email verification, rate limiting, code validation
- ✅ **FormConfigService** - Form configuration creation and validation
- ✅ **QRCodeService** - QR code generation and management
- ✅ **RegistrationService** - Registration submission and check-in
- ✅ **NotificationService** - Email notifications (implicitly via registration)

### API Endpoints Tested
- ✅ `/api/onboarding/send-verification` - Send verification code (legacy/back-compat)
- ✅ `/api/onboarding/verify-code` - Verify email code
- ✅ `/api/onboarding/save-organization` - Create organization
- ✅ `/api/onboarding/save-form-config` - Create form configuration
- ✅ `/api/onboarding/generate-qr` - Generate QR codes
- ✅ `/api/registrations/submit` - Submit registration
- ✅ `/api/registrations/{id}/check-in` - Check-in registration
- ✅ `/api/dashboard/stats` - Dashboard statistics
- ✅ `/api/dashboard/analytics` - Dashboard analytics
- ✅ `/api/qr-codes` - QR code management
- ✅ `/api/registrations` - Registration management

### Security & Validation Tested
- ✅ Rate limiting on verification codes
- ✅ Input validation (email format, required fields)
- ✅ Duplicate email prevention
- ✅ SQL injection protection (via parameterized queries)
- ✅ Authentication requirements

## Test Output

The test provides detailed console output showing:
- ✅ Success indicators for each step
- ⚠️ Warnings for optional/skipped steps
- ❌ Errors for failed steps
- 📊 Summary with IDs and test data

## Expected Results

### Successful Test Run
- All 12 steps should complete successfully
- Organization created with unique ID
- Form configuration created
- Registration submitted and checked in
- All API endpoints respond correctly (200, 401, or 403 as expected)

### Common Issues

1. **401 Unauthorized** - Expected for protected endpoints without authentication
2. **404 Not Found** - May occur if test data doesn't exist
3. **429 Rate Limited** - Expected when testing rate limiting
4. **400 Bad Request** - Expected for validation tests

## Integration with CI/CD

The test can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run E2E Tests
  run: |
    npm run dev &
    sleep 10
    npm run test:e2e
```

## Test Data

The test uses:
- Unique email addresses: `e2e-test-{timestamp}@example.com`
- Unique organization names: `E2E Test Organization {timestamp}`
- Test data is isolated and won't conflict with other tests

## Next Steps

1. **Add Authentication Tests** - Test login/logout flows
2. **Add Payment Tests** - Test subscription and payment flows
3. **Add Export Tests** - Test CSV/PDF export functionality
4. **Add Performance Tests** - Test response times and load
5. **Add Visual Regression Tests** - Test UI consistency

## Maintenance

- Update test data as new fields are added
- Add new test steps as features are implemented
- Keep test IDs and selectors updated with UI changes
- Monitor test execution time and optimize slow tests

## Troubleshooting

### Tests Fail with Connection Errors
- Ensure dev server is running on correct port
- Check BASE_URL environment variable
- Verify network connectivity

### Tests Fail with Timeout Errors
- Increase timeout in playwright.config.ts
- Check server response times
- Verify database is accessible

### Tests Fail with 500 Errors
- Check server logs for errors
- Verify database schema is up to date
- Check environment variables are set correctly

## Related Documentation

- [Test Coverage Analysis](./TEST_COVERAGE_ANALYSIS.md)
- [Testing Requirements Checklist](./TESTING_REQUIREMENTS_CHECKLIST.md)
- [Architecture Analysis](./COMPREHENSIVE_ARCHITECTURE_ANALYSIS.md)
