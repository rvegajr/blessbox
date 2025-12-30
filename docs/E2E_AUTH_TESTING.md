# Complete Authentication & Organization E2E Testing

## Overview

This document describes the comprehensive end-to-end testing strategy for BlessBox's authentication, organization management, onboarding flow, and site access.

## Test Coverage

### 1. Authentication Flow Testing

**What We Test:**
- ✅ 6-digit email verification code delivery
- ✅ Code validation and session creation
- ✅ JWT token generation and storage
- ✅ Session persistence across page loads
- ✅ Secure HttpOnly cookie management

**Test File:** `tests/e2e/complete-auth-organization-flow.spec.ts`

### 2. Organization Setup Testing

**What We Test:**
- ✅ Organization creation (pre-authentication)
- ✅ Email-organization linkage via memberships
- ✅ Organization data persistence
- ✅ Active organization selection
- ✅ Multi-organization support

**Flow:**
```
User → Org Setup (no auth) → Email Verify → Session + Membership Created
```

### 3. Complete Onboarding Flow

**What We Test:**
- ✅ Step 1: Organization Setup Form
- ✅ Step 2: Email Verification (6-digit code)
- ✅ Step 3: Form Builder Configuration
- ✅ Step 4: QR Code Generation
- ✅ Navigation between steps
- ✅ Data persistence across steps

### 4. Full Site Access Verification

**What We Test:**
- ✅ Dashboard access
- ✅ Registrations page
- ✅ QR Codes page
- ✅ Classes management
- ✅ Participants management
- ✅ Admin pages
- ✅ Protected route redirection

### 5. Subscription & Payment Integration

**What We Test:**
- ✅ Subscription API access
- ✅ Pricing page display
- ✅ Checkout flow accessibility
- ✅ Organization-subscription linkage
- ✅ Payment integration readiness

---

## Running the Tests

### Local Testing

```bash
# Run all auth tests locally
npm run test:e2e:auth:local

# Run with visible browser (headed mode)
npm run test:e2e:auth:local:headed

# Using the test script
./scripts/test-complete-auth-flow.sh
```

**Prerequisites:**
- Dev server running: `npm run dev` (port 7777)
- Database accessible (Turso connection)
- Email service configured (SendGrid or SMTP)

### Production Testing

```bash
# Run against production
npm run test:e2e:auth:production

# With environment variable
PROD_TEST_SEED_SECRET=<secret> npm run test:e2e:auth:production
```

**Prerequisites:**
- `PROD_TEST_SEED_SECRET` environment variable set
- Production site accessible at https://www.blessbox.org

---

## Test Structure

### Test 1: New User Onboarding

**Scenario:** First-time user creates account via onboarding

**Steps:**
1. Navigate to `/onboarding/organization-setup`
2. Fill organization details (name, email, phone, address)
3. Submit → Navigate to `/onboarding/email-verification`
4. Retrieve 6-digit code via `/api/test/verification-code`
5. Enter code → Verify → Session created
6. Verify session active via `/api/auth/session`
7. Verify organization membership via `/api/me/organizations`
8. Complete form builder and QR configuration
9. Navigate to dashboard

**Expected Results:**
- ✅ User account created
- ✅ Organization created
- ✅ Membership created (user ↔ org)
- ✅ Active session with JWT token
- ✅ Access to dashboard and protected routes

### Test 2: Returning User Login

**Scenario:** Existing user logs in with email

**Steps:**
1. Create test user + organization (via onboarding)
2. Clear cookies (simulate logout)
3. Navigate to `/login`
4. Enter email → Request code
5. Retrieve and enter 6-digit code
6. Verify → Session created
7. If multiple orgs: select organization
8. Redirect to dashboard

**Expected Results:**
- ✅ Login successful with 6-digit code
- ✅ Session restored
- ✅ Organization context preserved
- ✅ Dashboard accessible

### Test 3: Full Site Access

**Scenario:** Authenticated user can access all protected pages

**Steps:**
1. Create authenticated session
2. Test access to each protected route:
   - `/dashboard`
   - `/dashboard/registrations`
   - `/dashboard/qr-codes`
   - `/classes`
   - `/participants`
   - `/admin`
3. Verify no redirects to `/login`
4. Test API access:
   - `/api/auth/session`
   - `/api/me/organizations`

**Expected Results:**
- ✅ All protected routes accessible
- ✅ No unauthorized redirects
- ✅ API endpoints return 200 (not 401)

### Test 4: Subscription Integration

**Scenario:** Verify subscription/payment system works with auth

**Steps:**
1. Create authenticated user
2. Access `/api/subscriptions`
3. Access `/pricing` page
4. Access `/checkout` page
5. Verify subscription data returned

**Expected Results:**
- ✅ Subscription API accessible
- ✅ Pricing page loads
- ✅ Checkout accessible to authenticated users
- ✅ Organization-subscription link works

---

## Test Helper Functions

### getVerificationCode(request, email)

Retrieves the latest 6-digit verification code for an email.

**Usage:**
```typescript
const code = await getVerificationCode(request, 'user@example.com');
await page.fill('input[data-testid="input-code"]', code);
```

**Requirements:**
- Local: No requirements
- Production: `PROD_TEST_SEED_SECRET` environment variable

### hasActiveSession(page)

Checks if user has an active authenticated session.

**Usage:**
```typescript
const isAuthenticated = await hasActiveSession(page);
expect(isAuthenticated).toBe(true);
```

### verifyOrganizationAccess(page)

Verifies user has organization memberships.

**Usage:**
```typescript
const { success, organizations } = await verifyOrganizationAccess(page);
expect(success).toBe(true);
expect(organizations.length).toBeGreaterThan(0);
```

---

## Environment Configuration

### Local Testing (.env.local)

```bash
# Required
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
NEXTAUTH_SECRET=your-secret-key
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=noreply@blessbox.org

# Optional
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
```

### Production Testing

```bash
# Required environment variable
export PROD_TEST_SEED_SECRET=<your-secret>

# Run tests
npm run test:e2e:auth:production
```

---

## Continuous Integration

### GitHub Actions Example

```yaml
name: E2E Auth Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-auth:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run auth E2E tests
        run: npm run test:e2e:auth:production
        env:
          PROD_TEST_SEED_SECRET: ${{ secrets.PROD_TEST_SEED_SECRET }}
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Debugging Failed Tests

### Common Issues

**1. Email Verification Code Not Found**

**Symptoms:** `Failed to get verification code: 404`

**Solutions:**
- Check email service is configured (SendGrid/SMTP)
- Verify `VerificationService` is creating codes
- Check database connection (verification_codes table)
- For production: Ensure `PROD_TEST_SEED_SECRET` is set

**2. Session Not Created**

**Symptoms:** `hasActiveSession() returns false`

**Solutions:**
- Check JWT_SECRET or NEXTAUTH_SECRET is set
- Verify cookies are being set correctly
- Check browser cookie storage
- Verify `/api/auth/verify-code` returns success

**3. Navigation Timeout**

**Symptoms:** `TimeoutError: page.waitForURL: Timeout`

**Solutions:**
- Check network connectivity
- Verify API routes are responding
- Check server logs for errors
- Increase timeout if server is slow

**4. Organization Access Denied**

**Symptoms:** `organizations.length === 0`

**Solutions:**
- Verify membership was created
- Check `memberships` table in database
- Ensure user_id and organization_id are linked
- Check `/api/me/organizations` returns data

### Test Artifacts

When tests fail, Playwright captures:
- **Screenshots:** `test-results/*/test-failed-1.png`
- **Videos:** `test-results/*/video.webm`
- **Traces:** `test-results/*/trace.zip`

**View traces:**
```bash
npx playwright show-trace test-results/*/trace.zip
```

---

## Best Practices

### 1. Test Isolation

Each test should:
- Clear cookies before starting
- Use unique email addresses
- Not depend on previous test state

### 2. Data Cleanup

Tests create real data:
- Prefix with `E2E_TEST_` or `e2e.test.`
- Use timestamp-based names
- Consider cleanup scripts for production

### 3. Timing

- Use `waitForLoadState('networkidle')` for dynamic content
- Use `waitForURL()` for navigation
- Avoid hard-coded `waitForTimeout()` except for email delivery

### 4. Error Handling

- Always check API responses
- Provide clear console output
- Skip tests gracefully when secrets missing

---

## Metrics & Reporting

### Key Metrics to Track

| Metric | Target | Description |
|--------|--------|-------------|
| Test Pass Rate | >95% | Percentage of passing tests |
| Onboarding Completion Time | <30s | Time to complete full onboarding |
| Login Time | <5s | Time from code entry to dashboard |
| Session Persistence | 100% | Sessions persist across page loads |
| Organization Access | 100% | Users can access their organizations |

### Test Results Format

```
🔐 BlessBox Complete Authentication & Organization E2E Tests
====================================================================
📍 Environment: Production
🌐 URL: https://www.blessbox.org
====================================================================

✅ Test 1: New User Onboarding (18.5s)
✅ Test 2: Returning User Login (12.3s)
✅ Test 3: Full Site Access (8.7s)
✅ Test 4: Subscription Integration (6.2s)

4 passed (45.7s)
```

---

## Future Enhancements

### Planned Improvements

1. **Multi-Organization Testing**
   - User with multiple organizations
   - Organization switching
   - Role-based access control

2. **Payment Flow Testing**
   - Complete Square checkout
   - Subscription upgrade/downgrade
   - Coupon application

3. **Performance Testing**
   - Session creation time
   - Database query performance
   - Email delivery latency

4. **Security Testing**
   - CSRF protection
   - XSS prevention
   - Cookie security flags

5. **Mobile Testing**
   - Responsive design verification
   - Touch interactions
   - Mobile-specific flows

---

## Related Documentation

- [AUTH_SPECIFICATION.md](./AUTH_SPECIFICATION.md) - Authentication system architecture
- [AUTHENTICATION.md](./AUTHENTICATION.md) - Authentication API documentation
- [QA_TESTING_GUIDE.md](./QA_TESTING_GUIDE.md) - Manual QA testing procedures
- [TESTING_REQUIREMENTS_CHECKLIST.md](./TESTING_REQUIREMENTS_CHECKLIST.md) - Testing requirements

---

## Support

For issues or questions:
1. Check test output for specific error messages
2. Review logs in `playwright-report/`
3. Check server logs for API errors
4. Verify environment configuration
5. Refer to troubleshooting section above

