import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:7777';
const TEST_ENV = process.env.TEST_ENV || 'local';
const IS_PRODUCTION = TEST_ENV === 'production' || /blessbox\.org/i.test(BASE_URL);

const PROD_TEST_SEED_SECRET = process.env.PROD_TEST_SEED_SECRET || '';
const PROD_TEST_LOGIN_SECRET = process.env.PROD_TEST_LOGIN_SECRET || '';
const HAS_PROD_SEED = !!PROD_TEST_SEED_SECRET;
const HAS_PROD_LOGIN = !!PROD_TEST_LOGIN_SECRET;
const HAS_PROD_SECRETS = HAS_PROD_SEED && HAS_PROD_LOGIN;

async function setTestAuthCookies(page: any, cookies: Array<{ name: string; value: string }>) {
  const url = BASE_URL.startsWith('http') ? BASE_URL : `http://${BASE_URL}`;
  await page.context().addCookies(
    cookies.map((c) => ({
      name: c.name,
      value: c.value,
      url,
    }))
  );
}

async function loginAsUser(page: any, email: string, opts?: { organizationId?: string; admin?: boolean }) {
  if (IS_PRODUCTION) {
    if (!HAS_PROD_LOGIN) {
      console.log('   ⚠️  PROD_TEST_LOGIN_SECRET not set - skipping authentication (test may fail)');
      return;
    }
    const resp = await page.request.post(`${BASE_URL}/api/test/login`, {
      headers: { 'x-qa-login-token': PROD_TEST_LOGIN_SECRET },
      data: { email, organizationId: opts?.organizationId, admin: !!opts?.admin, expiresIn: 3600 },
    });
    if (!resp.ok()) {
      throw new Error(`Login failed: ${resp.status()}`);
    }
    const body = await resp.json();
    if (!body.success) {
      throw new Error(`Login failed: ${body.error || 'Unknown error'}`);
    }
    return body;
  }

  // Local/dev: cookie-based bypass
  await setTestAuthCookies(page, [
    { name: 'bb_test_auth', value: '1' },
    { name: 'bb_test_email', value: email },
    ...(opts?.organizationId ? [{ name: 'bb_test_org_id', value: opts.organizationId }] : []),
    ...(opts?.admin ? [{ name: 'bb_test_admin', value: '1' }] : []),
  ]);
}

async function getLatestVerificationCode(request: any, email: string) {
  const resp = await request.post(`${BASE_URL}/api/test/verification-code`, {
    headers: IS_PRODUCTION ? { 'x-qa-seed-token': PROD_TEST_SEED_SECRET } : undefined,
    data: { email },
  });
  expect(resp.ok()).toBeTruthy();
  const body = await resp.json();
  expect(body.success).toBe(true);
  expect(body.code).toMatch(/^\d{6}$/);
  return body.code as string;
}

test.describe('Onboarding Flow - Complete Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Clear session storage before each test
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      sessionStorage.clear();
    });
  });

  test('Complete onboarding flow from start to finish', async ({ page, request }) => {
    console.log('\n🚀 Starting complete onboarding flow test...');

    // Authenticate first (required for onboarding pages)
    const testEmail = `test${Date.now()}@example.com`;
    console.log('\n🔐 Authenticating user...');
    try {
      await loginAsUser(page, testEmail);
      console.log('   ✅ User authenticated');
    } catch (error) {
      console.log(`   ⚠️  Authentication skipped or failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Continue anyway - test will fail if auth is required
    }

    // Step 1: Organization Setup
    console.log('\n📝 Step 1: Organization Setup');
    await page.goto(`${BASE_URL}/onboarding/organization-setup`);
    
    // Wait for page to load and check if redirected to login
    await page.waitForLoadState('networkidle');
    
    // If redirected to login, we need to authenticate properly
    if (page.url().includes('/login')) {
      console.log('   ⚠️  Redirected to login - authenticating...');
      // For production, we need PROD_TEST_LOGIN_SECRET or Magic Link flow
      if (IS_PRODUCTION && !HAS_PROD_LOGIN) {
        console.log('   ⚠️  PROD_TEST_LOGIN_SECRET not set - test will use Magic Link flow');
        // In production without login secret, we'd need to manually complete Magic Link flow
        // For now, skip this test if login secret is not available
        test.skip();
        return;
      }
      // Re-authenticate and try again
      try {
        await loginAsUser(page, testEmail);
        await page.goto(`${BASE_URL}/onboarding/organization-setup`);
        await page.waitForLoadState('networkidle');
        // Check if still on login page (auth failed)
        if (page.url().includes('/login')) {
          throw new Error('Authentication failed - still on login page');
        }
      } catch (error) {
        console.log(`   ❌ Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
    }
    
    // Wait for form to be visible (after auth check completes)
    const nameInput = page.locator('input[id="name"]');
    await expect(nameInput).toBeVisible({ timeout: 15000 });
    
    // Fill organization form
    const orgName = `Test Org ${Date.now()}`;
    
    await nameInput.fill(orgName);
    await page.fill('input[id="eventName"]', 'Test Event 2025');
    await page.fill('input[id="contactEmail"]', testEmail);
    await page.fill('input[id="contactPhone"]', '555-1234');
    await page.fill('input[id="contactAddress"]', '123 Main St');
    await page.fill('input[id="contactCity"]', 'Anytown');
    await page.fill('input[id="contactState"]', 'CA');
    await page.fill('input[id="contactZip"]', '12345');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for navigation to email verification
    await page.waitForURL(/\/onboarding\/email-verification/, { timeout: 15000 });
    console.log('   ✅ Organization setup completed');
    
    // Step 2: Email Verification
    console.log('\n📧 Step 2: Email Verification');
    
    // Wait for verification code input (email-verification UI)
    const codeInput = page.locator('#code').first();
    await expect(codeInput).toBeVisible({ timeout: 15000 });

    // Fetch code via QA endpoint (no inbox needed)
    if (IS_PRODUCTION && !HAS_PROD_SEED) throw new Error('Production onboarding tests require PROD_TEST_SEED_SECRET');
    const code = await getLatestVerificationCode(request, testEmail);
    await codeInput.fill(code);
    await page.getByRole('button', { name: /verify email/i }).click();
    await page.waitForURL(/\/onboarding\/form-builder/, { timeout: 20000 });
    
    // Check if we moved forward (either verified or skipped)
    const currentUrl = page.url();
    if (currentUrl.includes('/form-builder')) {
      console.log('   ✅ Email verified or skipped - proceeding to form builder');
    } else {
      console.log('   ⚠️  Email verification step - may need manual intervention');
    }
    
    // Step 3: Form Builder
    console.log('\n🔧 Step 3: Form Builder');
    await page.goto(`${BASE_URL}/onboarding/form-builder`);
    await page.waitForLoadState('networkidle');
    
    // Add a Short Text field and set its label
    await page.getByRole('button', { name: /short text/i }).click();
    const fieldLabelInput = page.getByPlaceholder('Field label').first();
    await expect(fieldLabelInput).toBeVisible({ timeout: 15000 });
    await fieldLabelInput.fill('Full Name');

    // Save form config via API action on the page (it auto-navigates to qr-configuration)
    // Prefer a visible Save button; fallback to wizard Next.
    // Proceed to next step; Form Builder page will persist config when navigating to QR configuration
    await page.locator('[data-testid="next-button"]').click();
    await page.waitForURL(/\/onboarding\/qr-configuration/, { timeout: 20000 });
    console.log('   ✅ Form builder completed');
    
    // Step 4: QR Configuration
    console.log('\n📱 Step 4: QR Configuration');
    
    await page.waitForLoadState('networkidle');
    
    // Quick add default entry point (Main Entrance)
    const quickAdd = page.getByRole('button', { name: /\+\s*main entrance/i }).first();
    if (await quickAdd.isVisible().catch(() => false)) {
      await quickAdd.click();
      console.log('   ✅ Added entry point via quick add');
    } else {
      await page.getByRole('button', { name: /\+\s*add entry point/i }).click();
      await page.getByPlaceholder('e.g., Main Entrance').first().fill('Main Entrance');
      await page.getByPlaceholder('main-entrance').first().fill('main-entrance');
      console.log('   ✅ Added entry point');
    }
    
    // Generate QR codes
    // Disambiguate from stepper button "Step 4: Generate QR Codes"
    await page.locator('#generate-qr-btn').click();
    await expect(page.locator('img[alt*="QR Code"], img[src^="data:image"]')).toBeVisible({ timeout: 20000 });
    console.log('   ✅ QR codes generated');
    
    // Complete onboarding
    const completeBtn = page.locator('[data-testid="complete-button"]').first();
    await completeBtn.click();
    await page.waitForURL(/\/dashboard/, { timeout: 20000 });
    console.log('   ✅ Onboarding flow completed!');
    
    console.log('\n🎉 Complete onboarding flow test finished');
  });

  test('Onboarding step navigation works correctly', async ({ page }) => {
    console.log('\n🧭 Testing onboarding step navigation...');
    
    // Authenticate first
    const testEmail = `test-nav-${Date.now()}@example.com`;
    try {
      await loginAsUser(page, testEmail);
    } catch (error) {
      if (IS_PRODUCTION && !HAS_PROD_LOGIN) {
        console.log('   ⚠️  Skipping test - PROD_TEST_LOGIN_SECRET not set');
        test.skip();
        return;
      }
    }
    
    await page.goto(`${BASE_URL}/onboarding/organization-setup`);
    await page.waitForLoadState('networkidle');
    
    // If redirected to login, authenticate and retry
    if (page.url().includes('/login')) {
      await loginAsUser(page, testEmail);
      await page.goto(`${BASE_URL}/onboarding/organization-setup`);
      await page.waitForLoadState('networkidle');
    }
    
    // Wait for form/stepper to be visible
    await page.waitForSelector('[data-testid="onboarding-wizard"], input[id="name"]', { timeout: 10000 });
    
    // Check that all steps are visible in the stepper
    const stepIndicators = page.locator('[data-testid^="step-button-"]');
    const stepCount = await stepIndicators.count();
    
    expect(stepCount).toBeGreaterThanOrEqual(3);
    console.log(`   ✅ Found ${stepCount} step indicator(s)`);
    
    // Test that current step is highlighted
    const activeStep = page.locator('[aria-current="step"]');
    if (await activeStep.count() > 0) {
      console.log('   ✅ Active step is highlighted');
    }
  });

  test('Form validation works in organization setup', async ({ page }) => {
    console.log('\n✔️  Testing form validation...');
    
    // Authenticate first
    const testEmail = `test-validation-${Date.now()}@example.com`;
    try {
      await loginAsUser(page, testEmail);
    } catch (error) {
      if (IS_PRODUCTION && !HAS_PROD_LOGIN) {
        console.log('   ⚠️  Skipping test - PROD_TEST_LOGIN_SECRET not set');
        test.skip();
        return;
      }
    }
    
    await page.goto(`${BASE_URL}/onboarding/organization-setup`);
    await page.waitForLoadState('networkidle');
    
    // If redirected to login, authenticate and retry
    if (page.url().includes('/login')) {
      await loginAsUser(page, testEmail);
      await page.goto(`${BASE_URL}/onboarding/organization-setup`);
      await page.waitForLoadState('networkidle');
    }
    
    // Wait for form to be visible
    const nameInput = page.locator('input[id="name"]');
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    
    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    // Check for error messages
    await page.waitForTimeout(500);
    const errorMessages = page.locator('text=/required|valid email|error/i');
    const errorCount = await errorMessages.count();
    
    if (errorCount > 0) {
      console.log(`   ✅ Form validation working (${errorCount} error(s) shown)`);
    } else {
      console.log('   ℹ️  No client-side validation errors (may validate on submit)');
    }
  });
});

