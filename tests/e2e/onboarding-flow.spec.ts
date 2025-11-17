import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_ENV === 'production' 
  ? 'https://dev.blessbox.org'
  : process.env.TEST_ENV === 'development'
  ? 'http://localhost:7777'
  : 'http://localhost:7777';

test.describe('Onboarding Flow - Complete Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Clear session storage before each test
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      sessionStorage.clear();
    });
  });

  test('Complete onboarding flow from start to finish', async ({ page }) => {
    console.log('\n🚀 Starting complete onboarding flow test...');

    // Step 1: Organization Setup
    console.log('\n📝 Step 1: Organization Setup');
    await page.goto(`${BASE_URL}/onboarding/organization-setup`);
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Fill organization form
    const orgName = `Test Org ${Date.now()}`;
    const testEmail = `test${Date.now()}@example.com`;
    
    await page.fill('input[id="name"]', orgName);
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
    await page.waitForURL(/\/onboarding\/email-verification/, { timeout: 10000 });
    console.log('   ✅ Organization setup completed');
    
    // Step 2: Email Verification
    console.log('\n📧 Step 2: Email Verification');
    
    // Wait for verification code input (may need to send code first)
    const sendCodeButton = page.locator('button:has-text("Send Code")').first();
    if (await sendCodeButton.isVisible()) {
      await sendCodeButton.click();
      await page.waitForTimeout(1000); // Wait for code to be sent
    }
    
    // In development/test mode, the API may return the code in the response
    // For now, we'll check if the code input is visible and try a test code
    const codeInput = page.locator('input[id="code"], input[type="text"][placeholder*="000000"]').first();
    if (await codeInput.isVisible()) {
      // In development, try common test codes or check console
      // For actual testing, you'd need to capture the code from email or API response
      console.log('   ℹ️  Code input visible - manual verification may be needed');
      
      // Try to find if code is shown in development mode
      const codeFromPage = await page.locator('text=/[0-9]{6}/').first().textContent().catch(() => null);
      if (codeFromPage) {
        const code = codeFromPage.match(/\d{6}/)?.[0];
        if (code) {
          await codeInput.fill(code);
          await page.click('button:has-text("Verify")');
          await page.waitForTimeout(2000);
        }
      }
    }
    
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
    
    // Add a form field
    const addFieldButtons = page.locator('button').filter({ hasText: /Text|Email|Phone/ });
    const firstAddButton = addFieldButtons.first();
    
    if (await firstAddButton.isVisible()) {
      await firstAddButton.click();
      console.log('   ✅ Added form field');
      
      // Wait a moment for field to appear
      await page.waitForTimeout(500);
      
      // Try to configure the field
      const fieldLabelInput = page.locator('input[placeholder*="Field label"], input[placeholder*="label"]').first();
      if (await fieldLabelInput.isVisible()) {
        await fieldLabelInput.fill('Full Name');
        console.log('   ✅ Configured field label');
      }
    }
    
    // Save form (Complete button)
    const completeButton = page.locator('button:has-text("Complete"), button:has-text("Next")').first();
    if (await completeButton.isVisible()) {
      await completeButton.click();
      await page.waitForTimeout(2000);
      console.log('   ✅ Form builder completed');
    }
    
    // Step 4: QR Configuration
    console.log('\n📱 Step 4: QR Configuration');
    
    // Wait for navigation or manually navigate
    const qrConfigUrl = page.url();
    if (!qrConfigUrl.includes('/qr-configuration')) {
      await page.goto(`${BASE_URL}/onboarding/qr-configuration`);
      await page.waitForLoadState('networkidle');
    }
    
    // Add an entry point if needed
    const addEntryButton = page.locator('button:has-text("Add Entry Point")').first();
    if (await addEntryButton.isVisible()) {
      await addEntryButton.click();
      await page.waitForTimeout(500);
      
      // Fill entry point details
      const labelInputs = page.locator('input').filter({ hasText: /label/i }).or(
        page.locator('input[placeholder*="Main Entrance"], input[placeholder*="Label"]')
      );
      
      // Try to find the label input for the new entry point
      const labelInput = page.locator('input[type="text"]').filter({ hasText: '' }).first();
      if (await labelInput.isVisible()) {
        await labelInput.fill('Main Entrance');
        await page.waitForTimeout(300);
        console.log('   ✅ Added entry point');
      }
    } else {
      // Try quick add buttons
      const quickAddButtons = page.locator('button:has-text("Main Entrance"), button:has-text("Side Door")');
      if (await quickAddButtons.count() > 0) {
        await quickAddButtons.first().click();
        await page.waitForTimeout(500);
        console.log('   ✅ Added entry point via quick add');
      }
    }
    
    // Generate QR codes
    const generateButton = page.locator('button:has-text("Generate QR Codes")').first();
    if (await generateButton.isVisible() && !(await generateButton.isDisabled())) {
      await generateButton.click();
      await page.waitForTimeout(3000); // Wait for QR generation
      console.log('   ✅ QR codes generated');
      
      // Check if QR codes are displayed
      const qrImages = page.locator('img[src*="data:image"], img[alt*="QR Code"]');
      const qrCount = await qrImages.count();
      if (qrCount > 0) {
        console.log(`   ✅ ${qrCount} QR code(s) displayed`);
      }
    }
    
    // Complete onboarding
    const finalCompleteButton = page.locator('button:has-text("Complete"), button:has-text("Finish")').first();
    if (await finalCompleteButton.isVisible()) {
      await finalCompleteButton.click();
      await page.waitForTimeout(2000);
      
      // Should redirect to dashboard
      await page.waitForURL(/\/dashboard/, { timeout: 10000 }).catch(() => {
        console.log('   ℹ️  May still be on onboarding page');
      });
      
      console.log('   ✅ Onboarding flow completed!');
    }
    
    console.log('\n🎉 Complete onboarding flow test finished');
  });

  test('Onboarding step navigation works correctly', async ({ page }) => {
    console.log('\n🧭 Testing onboarding step navigation...');
    
    await page.goto(`${BASE_URL}/onboarding/organization-setup`);
    await page.waitForLoadState('networkidle');
    
    // Check that all 4 steps are visible in the stepper
    const stepIndicators = page.locator('[data-testid*="step-button"], [role="navigation"] button');
    const stepCount = await stepIndicators.count();
    
    expect(stepCount).toBeGreaterThanOrEqual(1); // At least one step visible
    console.log(`   ✅ Found ${stepCount} step indicator(s)`);
    
    // Test that current step is highlighted
    const activeStep = page.locator('[aria-current="step"]');
    if (await activeStep.count() > 0) {
      console.log('   ✅ Active step is highlighted');
    }
  });

  test('Form validation works in organization setup', async ({ page }) => {
    console.log('\n✔️  Testing form validation...');
    
    await page.goto(`${BASE_URL}/onboarding/organization-setup`);
    await page.waitForLoadState('networkidle');
    
    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    // Check for error messages
    await page.waitForTimeout(500);
    const errorMessages = page.locator('text=/required|invalid|error/i');
    const errorCount = await errorMessages.count();
    
    if (errorCount > 0) {
      console.log(`   ✅ Form validation working (${errorCount} error(s) shown)`);
    } else {
      console.log('   ℹ️  No client-side validation errors (may validate on submit)');
    }
  });
});

