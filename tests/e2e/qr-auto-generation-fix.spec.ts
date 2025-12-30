/**
 * E2E test for auto-QR generation fix
 * Verifies that QR codes are automatically generated when form config is saved
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:7777';
const PROD_TEST_SEED_SECRET = process.env.PROD_TEST_SEED_SECRET;

// Helper to get verification code for testing
async function getVerificationCode(request: any, email: string): Promise<string> {
  if (!PROD_TEST_SEED_SECRET) {
    throw new Error('PROD_TEST_SEED_SECRET not set');
  }

  const response = await request.post(`${BASE_URL}/api/test/verification-code`, {
    data: { email },
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  if (!data.success || !data.code) {
    throw new Error(`Failed to get verification code: ${data.error || 'Unknown error'}`);
  }

  return data.code;
}

test.describe('QR Auto-Generation Fix', () => {
  test('should auto-generate QR code when form config is saved', async ({ page, request }) => {
    const timestamp = Date.now();
    const testEmail = `qr-fix-test-${timestamp}@example.com`;
    const orgName = `QR Fix Test ${timestamp}`;

    console.log(`\n🧪 Testing QR Auto-Generation Fix`);
    console.log(`   Email: ${testEmail}`);
    console.log(`   Org: ${orgName}\n`);

    try {
      // Step 1: Start onboarding
      console.log('📝 Step 1: Starting onboarding - organization setup...');
      await page.goto(`${BASE_URL}/onboarding/organization-setup`);
      
      await page.waitForSelector('input[data-testid="input-org-name"]', { timeout: 10000 });
      await page.fill('input[data-testid="input-org-name"]', orgName);
      await page.fill('input[data-testid="input-contact-email"]', testEmail);
      await page.click('button[data-testid="btn-submit-org-setup"]');
      console.log('   ✅ Organization setup submitted');

      // Step 2: Email verification
      console.log('📝 Step 2: Email verification...');
      await page.waitForURL('**/onboarding/email-verification', { timeout: 10000 });
      
      // Wait a bit for the verification email to be "sent"
      await page.waitForTimeout(2000);

      // Get verification code via test API
      const code = await getVerificationCode(request, testEmail);
      console.log(`   ✅ Got verification code: ${code}`);

      // Enter code and verify
      await page.fill('input[data-testid="input-verification-code"]', code);
      await page.click('button[data-testid="btn-verify-code"]');
      console.log('   ✅ Email verified');

      // Step 3: Form builder - this should auto-generate QR code
      console.log('📝 Step 3: Form builder - saving will auto-generate QR...');
      await page.waitForURL('**/onboarding/form-builder', { timeout: 10000 });
      
      // Wait for form builder to load
      await page.waitForSelector('button[data-testid="btn-save-form"]', { timeout: 10000 });
      
      // Click save - this should trigger auto-QR generation in the API
      await page.click('button[data-testid="btn-save-form"]');
      console.log('   ✅ Form saved (auto-generating QR code in background)');

      // Wait for navigation to QR configuration
      await page.waitForURL('**/onboarding/qr-configuration', { timeout: 10000 });
      console.log('   ✅ Navigated to QR configuration page');

      // Step 4: Verify auto-generated QR code works
      console.log('📝 Step 4: Testing auto-generated QR code...');
      
      const orgSlug = orgName.toLowerCase().replace(/\s+/g, '-');
      const registrationUrl = `${BASE_URL}/register/${orgSlug}/main-entrance`;
      
      console.log(`   Testing URL: ${registrationUrl}`);
      await page.goto(registrationUrl);

      // Check for error message (should NOT exist)
      await page.waitForLoadState('networkidle', { timeout: 10000 });
      const errorCount = await page.locator('[data-testid="error-public-registration"]').count();
      
      if (errorCount > 0) {
        const errorText = await page.locator('[data-testid="error-public-registration"]').textContent();
        throw new Error(`Registration page showed error: ${errorText}`);
      }

      // Check for form (should exist)
      const formVisible = await page.locator('[data-testid="form-public-registration"]').isVisible();
      expect(formVisible).toBe(true);
      
      console.log('   ✅ Registration page loads correctly!');
      console.log('   ✅ Auto-generated QR code works!');

      // Step 5: Verify form submission works
      console.log('📝 Step 5: Testing form submission...');
      
      // Fill the first input field
      const firstInput = page.locator('[data-testid^="input-"]').first();
      await firstInput.fill('Test User');
      
      // Submit
      await page.click('button[data-testid="btn-submit-registration"]');
      
      // Wait for success
      await page.waitForSelector('text=/Registration submitted/i', { timeout: 10000 });
      console.log('   ✅ Registration submitted successfully!');

      console.log('\n🎉 QR AUTO-GENERATION FIX VERIFIED!\n');
      console.log('Summary:');
      console.log('  ✅ Form config saved');
      console.log('  ✅ QR code auto-generated');
      console.log('  ✅ Registration page works');
      console.log('  ✅ Form submission successful\n');

    } catch (error) {
      console.error('\n❌ Test failed:', error);
      throw error;
    }
  });
});
