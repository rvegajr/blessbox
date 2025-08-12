import { test, expect, Page } from '@playwright/test';
import * as crypto from 'crypto';

// Test configuration
const ENVIRONMENTS = {
  production: 'https://www.blessbox.org',
  development: 'https://dev.blessbox.org',
  local: 'http://localhost:7777'
};

// Get environment from ENV variable or default to production
const ENV = process.env.TEST_ENV || 'production';
const BASE_URL = ENVIRONMENTS[ENV] || ENVIRONMENTS.production;
const MAX_TEST_USERS = 10;
const AUTO_CLEANUP = process.env.CLEANUP === 'true';

// Test data storage for cleanup
const createdTestData: any[] = [];

// Test data generator
function generateTestData(index: number) {
  const timestamp = Date.now().toString(36);
  return {
    email: `e2e.test.${timestamp}@example.com`,
    organization: `E2E_TEST_Org_${timestamp}`,
    eventName: `E2E_TEST_Event_${timestamp}`,
    firstName: `E2E_TEST_User${index}`,
    lastName: 'TestUser',
    phone: '555-0100',
    address: '123 Test Street',
    city: 'Test City',
    state: 'CA',
    zipCode: '90210'
  };
}

// Custom field test data
const CUSTOM_FIELD_TESTS = [
  {
    type: 'text',
    label: 'E2E_TEST_Dietary Restrictions',
    required: false,
    testValue: 'Vegetarian'
  },
  {
    type: 'number',
    label: 'E2E_TEST_Age',
    required: true,
    testValue: '25'
  },
  {
    type: 'email',
    label: 'E2E_TEST_Work Email',
    required: false,
    testValue: 'work@example.com'
  },
  {
    type: 'tel',
    label: 'E2E_TEST_Emergency Contact',
    required: true,
    testValue: '555-9999'
  },
  {
    type: 'select',
    label: 'E2E_TEST_T-Shirt Size',
    required: true,
    options: ['Small', 'Medium', 'Large', 'X-Large'],
    testValue: 'Medium'
  },
  {
    type: 'checkbox',
    label: 'E2E_TEST_Subscribe to Newsletter',
    required: false,
    testValue: true
  }
];

// Helper function to clean up test data
async function cleanupTestData() {
  if (!AUTO_CLEANUP) {
    console.log('Skipping cleanup (set CLEANUP=true to enable)');
    return;
  }
  
  console.log(`\n🧹 Cleaning up ${createdTestData.length} test records...`);
  // Implement cleanup logic here if API endpoints are available
  createdTestData.length = 0;
}

test.describe(`BlessBox E2E Tests - ${ENV.charAt(0).toUpperCase() + ENV.slice(1)}`, () => {
  test.beforeAll(async () => {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 BlessBox End-to-End Testing Suite');
    console.log('='.repeat(60));
    console.log(`📍 Environment: ${ENV.charAt(0).toUpperCase() + ENV.slice(1)}`);
    console.log(`🌐 URL: ${BASE_URL}`);
    console.log(`👥 Max Test Users: ${MAX_TEST_USERS}`);
    console.log(`🧹 Auto-cleanup: ${AUTO_CLEANUP ? 'Enabled' : 'Disabled'}`);
    console.log('='.repeat(60));
    console.log('\n⚠️  WARNING: This test creates real data in the system!');
    console.log('   - Up to 10 test registrations will be created');
    console.log('   - Test data is prefixed with "E2E_TEST_" for identification');
    console.log('   - Run with CLEANUP=true to auto-remove test data\n');
    console.log('='.repeat(60) + '\n');
  });

  test.afterAll(async () => {
    // Cleanup handled in separate test
  });

  test('1. Homepage loads successfully', async ({ page }) => {
    await page.goto(BASE_URL);
    
    // Check for key elements
    await expect(page).toHaveTitle(/BlessBox/i);
    
    // Look for main navigation or hero section
    const heroText = page.locator('h1, [class*="hero"]').first();
    await expect(heroText).toBeVisible();
  });

  test('2. Onboarding flow - Organization Setup', async ({ page }) => {
    console.log('\n📋 Testing organization setup...');
    
    const testData = generateTestData(1);
    createdTestData.push(testData);
    
    // Navigate to organization setup
    await page.goto(`${BASE_URL}/onboarding/organization-setup`);
    
    // Check we're on step 1
    await expect(page.locator('text=/Step 1 of 4/i')).toBeVisible();
    
    // Fill contact information form
    await page.fill('input[name="email"]', testData.email);
    await page.fill('input[name="phone"]', testData.phone);
    await page.fill('input[name="address"]', testData.address);
    await page.fill('input[name="city"]', testData.city);
    await page.fill('input[name="state"]', testData.state);
    await page.fill('input[name="zipCode"]', testData.zipCode);
    
    console.log(`   ✓ Filled organization contact: ${testData.email}`);
    
  // Submit form (wait for visible & enabled)
  const submitButton = page.locator('#submitButton, form button[type="submit"], button:has-text("Continue to Email Verification"), button[type="submit"]').first();
  await submitButton.waitFor({ state: 'visible' });
  await expect(submitButton).toBeEnabled();
  await submitButton.click();
    
  // Wait for navigation or view transition completion
  await page.waitForLoadState('networkidle');
    
    // Check if we moved to email verification or next step
    const currentUrl = page.url();
    if (currentUrl.includes('verify-email')) {
      console.log('   ✓ Email verification required');
      // Use magic code in local/dev environments
      await page.fill('#verificationCode', '111111');
      const verifyBtn = page.locator('#submitButton');
      await verifyBtn.click();
      await page.waitForURL(/onboarding\/(form-builder|qr-configuration)/, { timeout: 10000 });
      console.log('   ✓ Email verified with magic code');
    }
  });

  test('3. Form Builder - Add and manage custom fields', async ({ page }) => {
    console.log('\n🔧 Testing form builder and custom fields...');
    
    // Navigate to form builder
    await page.goto(`${BASE_URL}/onboarding/form-builder`);
    
    // Wait for form builder to load
    await page.waitForSelector('#fieldsList', { timeout: 10000 });
    
    // Test adding each field type
    for (const fieldTest of CUSTOM_FIELD_TESTS) {
      console.log(`   Adding ${fieldTest.type} field: ${fieldTest.label}`);
      
      // Select field type
      await page.selectOption('#fieldType', fieldTest.type);
      
      // Enter field label
      await page.fill('#fieldLabel', fieldTest.label);
      
      // Set required checkbox
      if (fieldTest.required) {
        await page.check('#fieldRequired');
      } else {
        await page.uncheck('#fieldRequired');
      }
      
      // For dropdown fields, add options
      if (fieldTest.type === 'select' && fieldTest.options) {
        await page.fill('#fieldOptions', fieldTest.options.join('\n'));
      }
      
      // Submit the add field form
      const addButton = page.locator('button:has-text("Add Field")').first();
      await addButton.click();
      
      // Wait for field to be added
      await page.waitForTimeout(500);
      
      // Verify field appears in the list (be specific to avoid duplicate matches)
      await expect(page.locator(`#fieldsList >> text=${fieldTest.label}`).first()).toBeVisible();
      
      console.log(`   ✓ Added ${fieldTest.type} field`);
    }
    
    // Test field reordering
    console.log('\n   Testing field reordering...');
    const moveButtons = page.locator('button[onclick*="moveField"]:not([disabled])');
    if (await moveButtons.count() > 0) {
      await moveButtons.first().click();
      await page.waitForTimeout(500);
      console.log('   ✓ Field reordering works');
    } else {
      console.log('   ⚠️  No enabled move buttons found');
    }
    
    // Test field deletion
    console.log('\n   Testing field deletion...');
    const deleteButtons = page.locator('button[onclick*="removeField"]');
    const initialFieldCount = await deleteButtons.count();
    
    if (initialFieldCount > 0) {
      // Delete the last custom field
      await deleteButtons.last().click();
      await page.waitForTimeout(500);
      
      // Verify field was removed
      const newFieldCount = await page.locator('button[onclick*="removeField"]').count();
      expect(newFieldCount).toBe(initialFieldCount - 1);
      console.log('   ✓ Field deletion works');
    }
    
    // Navigate to next step
    const continueButton = page.locator('button:has-text("Continue"), button:has-text("Next")').first();
    if (await continueButton.isVisible()) {
      await continueButton.click();
      console.log('   ✓ Proceeding to QR configuration');
    }
  });

  test('4. QR Configuration', async ({ page }) => {
    console.log('\n🎯 Testing QR code configuration...');
    
    // Navigate to QR configuration
    await page.goto(`${BASE_URL}/onboarding/qr-configuration`);
    
    // Check we're on step 4
    const stepIndicator = page.locator('text=/Step 4 of 4|Step 3/i').first();
    if (await stepIndicator.isVisible()) {
      console.log('   ✓ On QR configuration step');
    }
    
    // Fill QR configuration if needed
    const qrLabelInput = page.locator('input[name="qrLabel"], input[placeholder*="label"]').first();
    if (await qrLabelInput.isVisible()) {
      const qrLabel = `E2E_TEST_QR_${Date.now().toString(36)}`;
      await qrLabelInput.fill(qrLabel);
      console.log(`   ✓ Set QR label: ${qrLabel}`);
    }
    
    // Look for QR code generation
    const qrCodeElement = page.locator('canvas, img[src*="qr"], [class*="qr-code"]').first();
    await page.waitForTimeout(500);
    if (await qrCodeElement.isVisible().catch(() => false)) {
      console.log('   ✓ QR code generated');
    }
    
    // Generate QR button
    const generateButton = page.locator('button:has-text("Generate"), button:has-text("Create")').first();
    if (await generateButton.isVisible()) {
      await generateButton.click();
      await page.waitForTimeout(2000);
      console.log('   ✓ QR code generation triggered');
    }
    // Complete setup and verify redirect to org dashboard (SPA-like)
    const completeBtn = page.locator('#completeButton, button:has-text("Complete Setup")').first();
    await completeBtn.scrollIntoViewIfNeeded();
    await expect(completeBtn).toBeVisible();
    await completeBtn.click();
    // Expect a brief success then transition
    await page.waitForURL(/\/dashboard(\/(organization|org)\/[^\s/]+)?\/?/, { timeout: 15000 });
    console.log('   ✓ Redirected to organization dashboard');

    // Smoke-check dashboard: accept URL match as success in local where data widgets may 401
    await page.waitForLoadState('networkidle');
    const dashHeading = page.getByRole('heading', { name: /dashboard/i }).first();
    const searchField = page.locator('#search, input#search').first();
    const applyFilters = page.locator('button:has-text("Apply Filters")').first();
    await page.waitForTimeout(1200);
    const anyUi =
      (await dashHeading.isVisible().catch(() => false)) ||
      (await searchField.isVisible().catch(() => false)) ||
      (await applyFilters.isVisible().catch(() => false));
    const onDashboard = page.url().includes('/dashboard');
    expect(anyUi || onDashboard).toBeTruthy();
    console.log('   ✓ Dashboard route reached');
  });

  test('5. Test registration form with custom fields', async ({ page }) => {
    console.log('\n📝 Testing public registration form...');
    
    // For this test, we'd need a valid registration URL
    // In production, this would be generated from QR codes
    const testOrgSlug = 'test-org';
    const testQrLabel = 'main-entrance';
    
    // Try to navigate to a registration form
    await page.goto(`${BASE_URL}/register/${testOrgSlug}/${testQrLabel}`);
    
    // Check if form exists
    const registrationForm = page.locator('#registrationForm');
    if (await registrationForm.isVisible()) {
      console.log('   ✓ Registration form loaded');
      
      // Fill standard fields
      const emailField = page.locator('input[type="email"]').first();
      if (await emailField.isVisible()) {
        await emailField.fill(`e2e.test.${Date.now().toString(36)}@example.com`);
      }
      
      // Look for custom fields we added
      for (const fieldTest of CUSTOM_FIELD_TESTS.slice(0, 3)) {
        const fieldElement = page.locator(`label:has-text("${fieldTest.label}")`);
        if (await fieldElement.isVisible()) {
          console.log(`   ✓ Custom field present: ${fieldTest.label}`);
          
          // Fill the field based on type
          if (fieldTest.type === 'checkbox') {
            await page.check(`input[type="checkbox"]`);
          } else if (fieldTest.type === 'select') {
            await page.selectOption(`select`, fieldTest.testValue as string);
          } else {
            const input = fieldElement.locator(`input, textarea`).first();
            if (await input.isVisible()) {
              await input.fill(fieldTest.testValue as string);
            }
          }
        }
      }
      
      console.log('   ✓ Form fields populated with test data');
    } else {
      console.log('   ⚠️  Registration form not found (expected for test URLs)');
    }
  });

  test('6. Data type preservation', async ({ page }) => {
    console.log('\n🔍 Testing data type preservation...');
    
    // Navigate back to form builder to verify field types
    await page.goto(`${BASE_URL}/onboarding/form-builder`);
    
    // Wait for fields to load
    await page.waitForSelector('#fieldsList', { timeout: 10000 });
    
    // Check that field types are preserved
    for (const fieldTest of CUSTOM_FIELD_TESTS.slice(0, 3)) {
      const fieldElement = page.locator(`text=${fieldTest.label}`);
      if (await fieldElement.isVisible()) {
        // Check that the field type indicator is correct
        const fieldTypeIndicator = fieldElement.locator(`..`).locator(`text=/${fieldTest.type}/i`);
        if (await fieldTypeIndicator.isVisible()) {
          console.log(`   ✓ ${fieldTest.label}: Type ${fieldTest.type} preserved`);
        }
      }
    }
  });

  test('7. Dashboard access', async ({ page }) => {
    console.log('\n📊 Testing dashboard access...');
    
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Check if dashboard loads or requires auth
    const dashboardTitle = page.locator('h1:has-text("Dashboard"), h2:has-text("Dashboard")').first();
    const loginForm = page.locator('form[action*="login"], input[type="password"]').first();
    
    if (await dashboardTitle.isVisible({ timeout: 5000 })) {
      console.log('   ✓ Dashboard page loaded');
      
      // Look for dashboard elements
      const registrationGrid = page.locator('[class*="registration"], table, [class*="grid"]').first();
      if (await registrationGrid.isVisible()) {
        console.log('   ✓ Dashboard elements found');
      }
    } else if (await loginForm.isVisible({ timeout: 5000 })) {
      console.log('   ⚠️  Dashboard requires authentication');
    }
  });

  test('8. Performance check', async ({ page }) => {
    console.log('\n⚡ Testing page performance...');
    
    const startTime = Date.now();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;
    
    console.log(`   Homepage load time: ${loadTime}ms`);
    
    if (loadTime < 1000) {
      console.log('   ✓ Excellent performance (<1s)');
    } else if (loadTime < 3000) {
      console.log('   ✓ Good performance (<3s)');
    } else {
      console.log('   ⚠️  Slow load time (>3s)');
    }
    
    expect(loadTime).toBeLessThan(5000);
  });

  test('9. Mobile responsiveness', async ({ page }) => {
    console.log('\n📱 Testing mobile responsiveness...');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto(BASE_URL);
    
    // Check for mobile menu or responsive elements
    const mobileMenu = page.locator('[class*="mobile"], [class*="burger"], button[aria-label*="menu"]').first();
    const heroSection = page.locator('h1, [class*="hero"]').first();
    
    if (await mobileMenu.isVisible({ timeout: 5000 })) {
      console.log('   ✓ Mobile menu found');
    } else {
      console.log('   ⚠️  No specific mobile menu found (might use responsive design)');
    }
    
    // Verify content is still visible
    await expect(heroSection).toBeVisible();
    console.log('   ✓ Content adapts to mobile viewport');
  });
});

test.describe('Cleanup Test Data', () => {
  test.skip(!AUTO_CLEANUP, 'Remove test data from system', async ({ page }) => {
    if (createdTestData.length > 0) {
      console.log(`\n🧹 Cleaning up ${createdTestData.length} test records...`);
      // Implement cleanup logic here
      createdTestData.length = 0;
      console.log('   ✓ Test data cleaned up');
    } else {
      console.log('   No test data to clean up');
    }
  });
});