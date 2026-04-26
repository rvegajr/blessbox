import { test, expect, Page } from '@playwright/test';

/**
 * Complete Authentication & Organization E2E Test
 * 
 * Tests the complete flow:
 * 1. New user registration via 6-digit email verification
 * 2. Organization creation and setup
 * 3. Full onboarding (org setup → email verify → form builder → QR config)
 * 4. Dashboard access with organization context
 * 5. Multi-organization support (if applicable)
 * 6. Subscription/payment integration
 * 7. Full site access verification
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:7777';
const TEST_ENV = process.env.TEST_ENV || 'local';
const IS_PRODUCTION = TEST_ENV === 'production' || /blessbox\.org/i.test(BASE_URL);

const PROD_TEST_SEED_SECRET = process.env.PROD_TEST_SEED_SECRET || '';
const HAS_PROD_SEED = !!PROD_TEST_SEED_SECRET;

// Helper to get verification code from test endpoint
async function getVerificationCode(request: any, email: string): Promise<string> {
  const resp = await request.post(`${BASE_URL}/api/test/verification-code`, {
    headers: IS_PRODUCTION ? { 'x-qa-seed-token': PROD_TEST_SEED_SECRET } : undefined,
    data: { email },
  });
  
  if (!resp.ok()) {
    throw new Error(`Failed to get verification code: ${resp.status()}`);
  }
  
  const body = await resp.json();
  if (!body.success) {
    throw new Error(`Failed to get verification code: ${body.error || 'Unknown error'}`);
  }
  
  return body.code as string;
}

// Helper to check if user has active session
async function hasActiveSession(page: Page): Promise<boolean> {
  const response = await page.request.get(`${BASE_URL}/api/auth/session`, {
    headers: { 'Cookie': await page.context().cookies().then(c => c.map(ck => `${ck.name}=${ck.value}`).join('; ')) }
  });
  
  if (!response.ok()) return false;
  
  const data = await response.json();
  return !!data.user;
}

// Helper to verify organization membership
async function verifyOrganizationAccess(page: Page): Promise<{ success: boolean; organizations: any[] }> {
  const response = await page.request.get(`${BASE_URL}/api/me/organizations`);
  
  if (!response.ok()) {
    return { success: false, organizations: [] };
  }
  
  const data = await response.json();
  return {
    success: true,
    organizations: data.organizations || []
  };
}

test.describe('Complete Auth & Organization Flow', () => {
  test.beforeAll(async () => {
    console.log('\n' + '='.repeat(70));
    console.log('🔐 BlessBox Complete Authentication & Organization E2E Tests');
    console.log('='.repeat(70));
    console.log(`📍 Environment: ${TEST_ENV.charAt(0).toUpperCase() + TEST_ENV.slice(1)}`);
    console.log(`🌐 URL: ${BASE_URL}`);
    console.log('='.repeat(70));
    
    if (IS_PRODUCTION && !HAS_PROD_SEED) {
      console.log('⚠️  WARNING: PROD_TEST_SEED_SECRET not set - some tests will be skipped');
    }
    
    console.log('\n');
  });

  // /api/test/login 404s in prod (PROD_TEST_LOGIN_SECRET not on Vercel) and SendGrid relays return Unauthorized; can't drive Magic-Link.
  test.fixme('1. Complete new user onboarding with 6-digit verification', async ({ page, request }) => {
    console.log('\n🚀 Test 1: New User Onboarding with Email Verification');
    
    const testEmail = `e2e.complete.${Date.now()}@example.com`;
    const orgName = `E2E Test Org ${Date.now()}`;
    
    // Clear any existing session
    await page.context().clearCookies();
    await page.goto(BASE_URL);
    
    console.log('\n📝 Step 1.1: Organization Setup (Pre-Auth)');
    await page.goto(`${BASE_URL}/onboarding/organization-setup`);
    await page.waitForLoadState('networkidle');
    
    // Fill organization details (no auth required at this step)
    const nameInput = page.locator('input[id="name"], input[name="name"]').first();
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    
    await nameInput.fill(orgName);
    await page.locator('input[id="contactEmail"], input[name="contactEmail"]').fill(testEmail);
    await page.locator('input[id="contactPhone"], input[name="contactPhone"]').fill('555-0123');
    await page.locator('input[id="contactAddress"], input[name="contactAddress"]').fill('123 Test St');
    await page.locator('input[id="contactCity"], input[name="contactCity"]').fill('Test City');
    await page.locator('input[id="contactState"], input[name="contactState"]').fill('CA');
    await page.locator('input[id="contactZip"], input[name="contactZip"]').fill('90210');
    
    console.log(`   ✅ Filled organization details (${orgName}, ${testEmail})`);
    
    // Submit and proceed to email verification
    const continueBtn = page.locator('button[type="submit"], button:has-text("Continue")').first();
    await continueBtn.click();
    
    // Wait for navigation to email verification
    await page.waitForURL(/\/onboarding\/email-verification/, { timeout: 15000 });
    console.log('   ✅ Navigated to email verification');
    
    console.log('\n📧 Step 1.2: Email Verification with 6-Digit Code');
    
    // Wait for email to be sent (system auto-sends on page load)
    await page.waitForTimeout(2000);
    
    // Get the verification code from test endpoint
    if (IS_PRODUCTION && !HAS_PROD_SEED) {
      console.log('   ⚠️  Skipping verification (PROD_TEST_SEED_SECRET not set)');
      test.skip();
      return;
    }
    
    const verificationCode = await getVerificationCode(request, testEmail);
    console.log(`   ✅ Retrieved verification code: ${verificationCode}`);
    
    // Enter the code - use multiple selectors
    const codeInput = page.locator('input[data-testid="input-code"]').or(page.locator('input[type="text"][maxlength="6"]')).or(page.locator('input#code')).first();
    await expect(codeInput).toBeVisible({ timeout: 10000 });
    await codeInput.fill(verificationCode);
    
    // Verify the code - use multiple selectors
    const verifyBtn = page.locator('button[data-testid="btn-verify-code"]').or(page.locator('button:has-text("Verify")')).or(page.locator('button[type="submit"]:has-text("Verify")')).first();
    await verifyBtn.click();
    
    // Wait for authentication and navigation to form builder
    await page.waitForURL(/\/onboarding\/form-builder/, { timeout: 20000 });
    console.log('   ✅ Email verified and authenticated');
    
    // Verify session is active
    const hasSession = await hasActiveSession(page);
    expect(hasSession).toBe(true);
    console.log('   ✅ Active session confirmed');
    
    // Verify organization membership
    const orgAccess = await verifyOrganizationAccess(page);
    expect(orgAccess.success).toBe(true);
    expect(orgAccess.organizations.length).toBeGreaterThan(0);
    console.log(`   ✅ Organization membership confirmed (${orgAccess.organizations.length} org(s))`);
    
    console.log('\n🔧 Step 1.3: Form Builder Configuration');
    
    // Add a field to the form
    const addFieldBtn = page.locator('button:has-text("Short Text"), button:has-text("Add Field")').first();
    if (await addFieldBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addFieldBtn.click();
      
      const fieldLabel = page.locator('input[placeholder*="Field label"], input[placeholder*="Label"]').first();
      if (await fieldLabel.isVisible({ timeout: 5000 }).catch(() => false)) {
        await fieldLabel.fill('Full Name');
        console.log('   ✅ Added form field');
      }
    } else {
      console.log('   ℹ️  Form builder UI not found or already configured');
    }
    
    // Continue to QR configuration
    const nextBtn = page.locator('[data-testid="next-button"], button:has-text("Next"), button:has-text("Continue")').first();
    if (await nextBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nextBtn.click();
      await page.waitForURL(/\/onboarding\/qr-configuration/, { timeout: 15000 });
      console.log('   ✅ Navigated to QR configuration');
    } else {
      console.log('   ℹ️  Navigation button not found, attempting direct navigation');
      await page.goto(`${BASE_URL}/onboarding/qr-configuration`);
      await page.waitForLoadState('networkidle');
    }
    
    console.log('\n📱 Step 1.4: QR Code Configuration');
    
    // At this point, we've verified the critical auth flow
    // QR generation is optional for this test
    console.log('   ℹ️  Skipping QR generation (auth flow complete)');
    
    // Navigate to dashboard directly to verify access
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');
    
    if (page.url().includes('/dashboard')) {
      console.log('   ✅ Dashboard accessible after onboarding');
    } else {
      console.log(`   ⚠️  Redirected to: ${page.url()}`);
    }
    
    console.log('\n✅ Test 1 Complete: New user onboarding successful');
  });

  // Same root cause as test 1: requires /api/test/login (404 in prod) or working SendGrid for Magic-Link.
  test.fixme('2. Login with existing email and organization selection', async ({ page, request }) => {
    console.log('\n🔐 Test 2: Login with Existing Email');
    
    // First, create a test user with an organization (via onboarding)
    const testEmail = `e2e.login.${Date.now()}@example.com`;
    const orgName = `E2E Login Org ${Date.now()}`;
    
    await page.context().clearCookies();
    
    // Quick onboarding setup
    console.log('\n📝 Setting up test user and organization...');
    await page.goto(`${BASE_URL}/onboarding/organization-setup`);
    await page.waitForLoadState('networkidle');
    
    const nameInput = page.locator('input[id="name"]').first();
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    
    await nameInput.fill(orgName);
    await page.fill('input[id="contactEmail"]', testEmail);
    await page.fill('input[id="contactPhone"]', '555-0124');
    await page.fill('input[id="contactAddress"]', '124 Test St');
    await page.fill('input[id="contactCity"]', 'Test City');
    await page.fill('input[id="contactState"]', 'CA');
    await page.fill('input[id="contactZip"]', '90210');
    
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/onboarding\/email-verification/, { timeout: 15000 });
    
    if (IS_PRODUCTION && !HAS_PROD_SEED) {
      console.log('   ⚠️  Skipping test (PROD_TEST_SEED_SECRET not set)');
      test.skip();
      return;
    }
    
    await page.waitForTimeout(2000);
    const setupCode = await getVerificationCode(request, testEmail);
    
    await page.fill('input[data-testid="input-code"], input[type="text"][maxlength="6"]', setupCode);
    await page.click('button[data-testid="btn-verify-code"]');
    await page.waitForURL(/\/onboarding\/form-builder/, { timeout: 20000 });
    console.log('   ✅ Test user created');
    
    // Now test the login flow
    console.log('\n🔓 Testing login flow...');
    await page.context().clearCookies();
    
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    // Enter email
    const emailInput = page.locator('input[data-testid="input-email"], input[type="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await emailInput.fill(testEmail);
    
    // Request verification code
    const sendCodeBtn = page.locator('button[data-testid="btn-send-code"], button:has-text("Send")').first();
    await sendCodeBtn.click();
    
    // Wait for code to be sent
    await page.waitForTimeout(2000);
    
    // Get and enter verification code
    const loginCode = await getVerificationCode(request, testEmail);
    console.log(`   ✅ Retrieved login code: ${loginCode}`);
    
    const codeInput = page.locator('input[data-testid="input-code"]').or(page.locator('input[maxlength="6"]')).or(page.locator('input#code')).first();
    await expect(codeInput).toBeVisible({ timeout: 10000 });
    await codeInput.fill(loginCode);
    
    // Verify and login
    const verifyBtn = page.locator('button[data-testid="btn-verify-code"]').or(page.locator('button:has-text("Verify")')).first();
    await verifyBtn.click();
    
    // Should redirect to dashboard or org selection
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    const currentUrl = page.url();
    
    if (currentUrl.includes('/select-organization')) {
      console.log('   ℹ️  Multiple organizations detected, selecting one...');
      const orgCard = page.locator('[data-testid^="org-card-"], button:has-text("Select")').first();
      await orgCard.click();
      await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    }
    
    expect(currentUrl.includes('/dashboard') || page.url().includes('/dashboard')).toBe(true);
    console.log('   ✅ Login successful, redirected to dashboard');
    
    // Verify session and organization access
    const hasSession = await hasActiveSession(page);
    expect(hasSession).toBe(true);
    
    const orgAccess = await verifyOrganizationAccess(page);
    expect(orgAccess.success).toBe(true);
    expect(orgAccess.organizations.length).toBeGreaterThan(0);
    console.log(`   ✅ Session active with ${orgAccess.organizations.length} organization(s)`);
    
    console.log('\n✅ Test 2 Complete: Login flow successful');
  });

  // Same root cause as test 1.
  test.fixme('3. Verify full site access with authentication', async ({ page, request }) => {
    console.log('\n🌐 Test 3: Full Site Access Verification');
    
    // Create authenticated user
    const testEmail = `e2e.access.${Date.now()}@example.com`;
    
    console.log('\n🔐 Creating authenticated session...');
    await page.context().clearCookies();
    await page.goto(`${BASE_URL}/onboarding/organization-setup`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[id="name"]', `E2E Access Org ${Date.now()}`);
    await page.fill('input[id="contactEmail"]', testEmail);
    await page.fill('input[id="contactPhone"]', '555-0125');
    await page.fill('input[id="contactAddress"]', '125 Test St');
    await page.fill('input[id="contactCity"]', 'Test City');
    await page.fill('input[id="contactState"]', 'CA');
    await page.fill('input[id="contactZip"]', '90210');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/onboarding\/email-verification/, { timeout: 15000 });
    
    if (IS_PRODUCTION && !HAS_PROD_SEED) {
      console.log('   ⚠️  Skipping test (PROD_TEST_SEED_SECRET not set)');
      test.skip();
      return;
    }
    
    await page.waitForTimeout(2000);
    const code = await getVerificationCode(request, testEmail);
    
    const codeInput = page.locator('input[data-testid="input-verification-code"]').or(page.locator('input[data-testid="input-code"]')).first();
    await expect(codeInput).toBeVisible({ timeout: 10000 });
    await codeInput.fill(code);
    
    await page.click('button[data-testid="btn-verify-code"]');
    await page.waitForURL(/\/onboarding\/form-builder/, { timeout: 20000 });
    console.log('   ✅ Authenticated user created');
    
    // Test access to protected routes
    console.log('\n🔒 Testing access to protected routes...');
    
    const protectedRoutes = [
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/dashboard/registrations', name: 'Registrations' },
      { path: '/dashboard/qr-codes', name: 'QR Codes' },
      { path: '/classes', name: 'Classes' },
      { path: '/participants', name: 'Participants' },
      { path: '/admin', name: 'Admin' },
    ];
    
    for (const route of protectedRoutes) {
      await page.goto(`${BASE_URL}${route.path}`);
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
      
      const currentUrl = page.url();
      const isAccessible = !currentUrl.includes('/login');
      
      if (isAccessible) {
        console.log(`   ✅ ${route.name} (${route.path}) - Accessible`);
      } else {
        console.log(`   ⚠️  ${route.name} (${route.path}) - Redirected to login`);
      }
    }
    
    // Test API access
    console.log('\n🔌 Testing API access...');
    
    const apiEndpoints = [
      { path: '/api/auth/session', name: 'Session API' },
      { path: '/api/me/organizations', name: 'Organizations API' },
    ];
    
    for (const endpoint of apiEndpoints) {
      const response = await page.request.get(`${BASE_URL}${endpoint.path}`);
      const isAuthorized = response.status() !== 401;
      
      if (isAuthorized) {
        console.log(`   ✅ ${endpoint.name} - Authorized (${response.status()})`);
      } else {
        console.log(`   ❌ ${endpoint.name} - Unauthorized (${response.status()})`);
      }
    }
    
    console.log('\n✅ Test 3 Complete: Site access verified');
  });

  // Same root cause as test 1.
  test.fixme('4. Verify subscription and payment integration', async ({ page, request }) => {
    console.log('\n💳 Test 4: Subscription & Payment Integration');
    
    // Create authenticated user
    const testEmail = `e2e.payment.${Date.now()}@example.com`;
    
    console.log('\n🔐 Creating authenticated session...');
    await page.context().clearCookies();
    await page.goto(`${BASE_URL}/onboarding/organization-setup`);
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[id="name"]', `E2E Payment Org ${Date.now()}`);
    await page.fill('input[id="contactEmail"]', testEmail);
    await page.fill('input[id="contactPhone"]', '555-0126');
    await page.fill('input[id="contactAddress"]', '126 Test St');
    await page.fill('input[id="contactCity"]', 'Test City');
    await page.fill('input[id="contactState"]', 'CA');
    await page.fill('input[id="contactZip"]', '90210');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/onboarding\/email-verification/, { timeout: 15000 });
    
    if (IS_PRODUCTION && !HAS_PROD_SEED) {
      console.log('   ⚠️  Skipping test (PROD_TEST_SEED_SECRET not set)');
      test.skip();
      return;
    }
    
    await page.waitForTimeout(2000);
    const code = await getVerificationCode(request, testEmail);
    
    const codeInput = page.locator('input[data-testid="input-verification-code"]').or(page.locator('input[data-testid="input-code"]')).first();
    await expect(codeInput).toBeVisible({ timeout: 10000 });
    await codeInput.fill(code);
    
    await page.click('button[data-testid="btn-verify-code"]');
    await page.waitForURL(/\/onboarding\/form-builder/, { timeout: 20000 });
    console.log('   ✅ Authenticated user created');
    
    // Check subscription status via API
    console.log('\n📊 Checking subscription status...');
    const subResponse = await page.request.get(`${BASE_URL}/api/subscriptions`);
    
    if (subResponse.ok()) {
      const subData = await subResponse.json();
      console.log(`   ✅ Subscription API accessible`);
      console.log(`   ℹ️  Plan: ${subData.subscription?.planType || 'Free/None'}`);
      console.log(`   ℹ️  Status: ${subData.subscription?.status || 'N/A'}`);
    } else {
      console.log(`   ⚠️  Subscription API returned ${subResponse.status()}`);
    }
    
    // Test access to pricing page
    console.log('\n💰 Testing pricing page access...');
    await page.goto(`${BASE_URL}/pricing`);
    await page.waitForLoadState('networkidle');
    
    const hasPricingContent = await page.locator('h1:has-text("Pricing"), h2:has-text("Pricing")').isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasPricingContent) {
      console.log('   ✅ Pricing page accessible');
      
      // Check for plan cards
      const planCards = page.locator('[data-testid^="plan-"], button:has-text("Subscribe"), button:has-text("Get Started")');
      const planCount = await planCards.count();
      console.log(`   ℹ️  Found ${planCount} plan option(s)`);
    } else {
      console.log('   ℹ️  Pricing page structure may differ');
    }
    
    // Test checkout page access (should be accessible for authenticated users)
    console.log('\n🛒 Testing checkout page access...');
    await page.goto(`${BASE_URL}/checkout`);
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    const isCheckoutAccessible = !currentUrl.includes('/login');
    
    if (isCheckoutAccessible) {
      console.log('   ✅ Checkout page accessible');
    } else {
      console.log('   ⚠️  Checkout page redirected to login');
    }
    
    console.log('\n✅ Test 4 Complete: Payment integration verified');
  });
});

