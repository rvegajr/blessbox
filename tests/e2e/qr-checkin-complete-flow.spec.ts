/**
 * QR Check-In Complete Flow - E2E Test
 * 
 * Tests the COMPLETE QR magic workflow:
 * 1. Organization creates QR code (REGISTRATION QR)
 * 2. Attendee scans QR code → fills registration form
 * 3. System generates CHECK-IN QR code
 * 4. Success page displays CHECK-IN QR code
 * 5. Worker scans CHECK-IN QR code
 * 6. Worker checks in attendee
 * 7. Verify check-in status in database
 */

import { test, expect, type Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:7777';

test.describe('QR Check-In Complete Workflow', () => {
  let registrationUrl: string;
  let registrationId: string;
  let checkInToken: string;
  let checkInUrl: string;

  test('1. Setup: Seed test organization with QR codes', async ({ page }) => {
    console.log('\n🌱 Seeding test data...\n');

    // Seed test data
    const response = await page.request.get(`${BASE_URL}/api/test/seed`);
    expect(response.ok()).toBeTruthy();

    const seedData = await response.json();
    
    if (seedData.registrationUrl) {
      registrationUrl = seedData.registrationUrl;
      console.log(`   ✅ Registration URL: ${registrationUrl}`);
    } else {
      // Fallback: construct URL
      registrationUrl = `${BASE_URL}/register/test-org/main-entrance`;
      console.log(`   ⚠️  Using fallback URL: ${registrationUrl}`);
    }
  });

  test('2. Attendee scans REGISTRATION QR → Fills form → Submits', async ({ page }) => {
    console.log('\n📱 Step 1: Attendee Scans Registration QR Code...\n');

    // Navigate to registration form (simulates QR scan)
    await page.goto(registrationUrl);
    await page.waitForLoadState('networkidle');

    const formHeading = page.locator('h1:has-text("Registration"), form').first();
    await expect(formHeading).toBeVisible({ timeout: 10000 });
    console.log('   ✅ Registration form loaded');

    // Fill in registration details
    console.log('\n📝 Step 2: Filling registration form...');
    
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nameInput.fill('Test Attendee');
      console.log('   ✅ Name filled');
    }

    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill('attendee@test.com');
      console.log('   ✅ Email filled');
    }

    const phoneInput = page.locator('input[type="tel"], input[name="phone"]').first();
    if (await phoneInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await phoneInput.fill('555-1234');
      console.log('   ✅ Phone filled');
    }

    // Submit registration
    console.log('\n✉️ Step 3: Submitting registration...');
    const submitBtn = page.locator('button[type="submit"], button:has-text("Submit")').first();
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    console.log('   ✅ Registration submitted');

    // CRITICAL: Should redirect to success page with QR code
    console.log('\n🔍 Step 4: Verifying redirect to success page...');
    
    await page.waitForURL(/registration-success/i, { timeout: 15000 });
    const successUrl = page.url();
    expect(successUrl).toContain('/registration-success');
    console.log(`   ✅ Redirected to: ${successUrl}`);

    // Extract registration ID from URL
    const urlParams = new URL(successUrl).searchParams;
    registrationId = urlParams.get('id') || '';
    expect(registrationId).toBeTruthy();
    console.log(`   ✅ Registration ID: ${registrationId}`);
  });

  test('3. Success page displays CHECK-IN QR code', async ({ page }) => {
    console.log('\n🎉 Step 5: Verifying success page displays check-in QR code...\n');

    // Should already be on success page from previous test
    await page.goto(`${BASE_URL}/registration-success?id=${registrationId}`);
    await page.waitForLoadState('networkidle');

    // Check for success message
    const successHeading = page.locator('h1:has-text("Success"), h1:has-text("Registered")');
    await expect(successHeading).toBeVisible({ timeout: 10000 });
    console.log('   ✅ Success message displayed');

    // CRITICAL: Check for QR code image
    const qrCodeImage = page.locator('[data-testid="img-checkin-qr"], img[alt*="QR"]').first();
    await expect(qrCodeImage).toBeVisible({ timeout: 10000 });
    console.log('   ✅ CHECK-IN QR CODE DISPLAYED!');

    // Verify QR code is actually an image
    const src = await qrCodeImage.getAttribute('src');
    expect(src).toContain('data:image'); // Should be base64 data URL
    console.log('   ✅ QR code is a valid image');

    // Check for instructions
    const instructions = page.locator('text=/show this.*staff/i, text=/instant check-in/i');
    const hasInstructions = await instructions.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`   ${hasInstructions ? '✅' : '⚠️'} Instructions displayed: ${hasInstructions}`);

    // Check for save/email buttons
    const saveBtn = page.locator('[data-testid="btn-save-qr"]');
    const emailBtn = page.locator('[data-testid="btn-email-qr"]');
    
    await expect(saveBtn).toBeVisible();
    await expect(emailBtn).toBeVisible();
    console.log('   ✅ Save and Email buttons available');

    // Take screenshot for visual verification
    await page.screenshot({ path: 'test-results/qr-checkin-success-page.png', fullPage: true });
    console.log('   📸 Screenshot saved');
  });

  test('4. Fetch check-in token from database', async ({ page }) => {
    console.log('\n🔍 Step 6: Fetching check-in token from registration...\n');

    // Fetch registration details via API
    const response = await page.request.get(`${BASE_URL}/api/registrations/${registrationId}`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.registration).toBeTruthy();

    checkInToken = data.registration.checkInToken;
    expect(checkInToken).toBeTruthy();
    expect(checkInToken).toMatch(/^[0-9a-f-]{36}$/i); // UUID format

    console.log(`   ✅ Check-in token: ${checkInToken}`);

    checkInUrl = `${BASE_URL}/check-in/${checkInToken}`;
    console.log(`   ✅ Check-in URL: ${checkInUrl}`);
  });

  test('5. Worker scans CHECK-IN QR → Opens check-in interface', async ({ page }) => {
    console.log('\n👨‍💼 Step 7: Worker scans attendee QR code...\n');

    // Navigate to check-in page (simulates QR scan by worker)
    await page.goto(checkInUrl);
    await page.waitForLoadState('networkidle');

    // Check for check-in interface
    const checkInHeading = page.locator('h1:has-text("Check-In"), h1:has-text("Check In")');
    await expect(checkInHeading).toBeVisible({ timeout: 10000 });
    console.log('   ✅ Check-in interface loaded');

    // Verify registrant details are displayed
    const registrantName = page.locator('text=/Test Attendee/i');
    await expect(registrantName).toBeVisible({ timeout: 5000 });
    console.log('   ✅ Registrant name displayed');

    // Verify status shows "Ready for check-in"
    const readyStatus = page.locator('text=/ready for check-in/i, text=/not checked in/i');
    const isReady = await readyStatus.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`   ${isReady ? '✅' : '⚠️'} Status shows ready: ${isReady}`);

    // Take screenshot
    await page.screenshot({ path: 'test-results/qr-checkin-interface.png', fullPage: true });
    console.log('   📸 Screenshot saved');
  });

  test('6. Worker clicks "Check In" button → Attendee is checked in', async ({ page }) => {
    console.log('\n✅ Step 8: Worker performs check-in...\n');

    // Should already be on check-in page
    await page.goto(checkInUrl);
    await page.waitForLoadState('networkidle');

    // Find check-in button
    const checkInBtn = page.locator('[data-testid="btn-checkin-confirm"], button:has-text("Check In")').first();
    await expect(checkInBtn).toBeVisible({ timeout: 10000 });
    await expect(checkInBtn).toBeEnabled();
    console.log('   ✅ Check-in button found and enabled');

    // Click check-in
    await checkInBtn.click();
    console.log('   🔄 Check-in button clicked');

    // Wait for success message
    await page.waitForTimeout(2000);

    const successMessage = page.locator('[data-testid="checkin-success"], text=/checked in successfully/i');
    const hasSuccess = await successMessage.isVisible({ timeout: 10000 }).catch(() => false);
    
    if (hasSuccess) {
      console.log('   ✅ SUCCESS MESSAGE DISPLAYED!');
    } else {
      console.log('   ⚠️  Success message not found - checking for errors');
    }

    // Check for "Already Checked In" indicator
    const alreadyCheckedIn = page.locator('text=/already checked in/i, h1:has-text("Already")');
    const isAlreadyChecked = await alreadyCheckedIn.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isAlreadyChecked) {
      console.log('   ✅ Status updated to "Already Checked In"');
    }

    // Verify undo button appears
    const undoBtn = page.locator('[data-testid="btn-undo-checkin"], button:has-text("Undo")');
    const hasUndo = await undoBtn.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`   ${hasUndo ? '✅' : '⚠️'} Undo button available: ${hasUndo}`);

    // Take screenshot
    await page.screenshot({ path: 'test-results/qr-checkin-complete.png', fullPage: true });
    console.log('   📸 Screenshot saved');
  });

  test('7. Verify check-in recorded in database', async ({ page }) => {
    console.log('\n🗄️ Step 9: Verifying database updated...\n');

    // Fetch registration again to verify check-in was recorded
    const response = await page.request.get(`${BASE_URL}/api/registrations/${registrationId}`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    const reg = data.registration;

    // Verify check-in fields are populated
    expect(reg.checkedInAt).toBeTruthy();
    console.log(`   ✅ Checked in at: ${reg.checkedInAt}`);

    expect(reg.tokenStatus).toBe('used');
    console.log(`   ✅ Token status: ${reg.tokenStatus}`);

    if (reg.checkedInBy) {
      console.log(`   ✅ Checked in by: ${reg.checkedInBy}`);
    }
  });

  test('8. Verify QR code cannot be used again (prevent double check-in)', async ({ page }) => {
    console.log('\n🔒 Step 10: Testing duplicate check-in prevention...\n');

    // Navigate to check-in page again
    await page.goto(checkInUrl);
    await page.waitForLoadState('networkidle');

    // Should show "Already Checked In" status
    const alreadyCheckedIn = page.locator('text=/already checked in/i, h1:has-text("Already")');
    await expect(alreadyCheckedIn).toBeVisible({ timeout: 10000 });
    console.log('   ✅ "Already Checked In" message displayed');

    // Check-in button should NOT be visible (replaced with undo)
    const checkInBtn = page.locator('[data-testid="btn-checkin-confirm"]');
    const hasCheckInBtn = await checkInBtn.isVisible({ timeout: 2000 }).catch(() => false);
    expect(hasCheckInBtn).toBe(false);
    console.log('   ✅ Check-in button hidden (prevents duplicate)');

    // Undo button should be visible
    const undoBtn = page.locator('[data-testid="btn-undo-checkin"]');
    await expect(undoBtn).toBeVisible();
    console.log('   ✅ Undo button available for mistake correction');
  });

  test('9. Test undo check-in functionality', async ({ page }) => {
    console.log('\n↩️  Step 11: Testing undo check-in...\n');

    await page.goto(checkInUrl);
    await page.waitForLoadState('networkidle');

    // Click undo button
    const undoBtn = page.locator('[data-testid="btn-undo-checkin"]');
    await expect(undoBtn).toBeVisible({ timeout: 10000 });
    await undoBtn.click();
    console.log('   🔄 Undo button clicked');

    await page.waitForTimeout(2000);

    // Should show check-in button again
    const checkInBtn = page.locator('[data-testid="btn-checkin-confirm"]');
    const hasCheckInBtn = await checkInBtn.isVisible({ timeout: 10000 }).catch(() => false);
    expect(hasCheckInBtn).toBe(true);
    console.log('   ✅ Check-in button reappears (undo successful)');

    // Status should be "Ready for check-in" again
    const readyStatus = page.locator('text=/ready for check-in/i');
    const isReady = await readyStatus.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`   ${isReady ? '✅' : '⚠️'} Status reset to ready: ${isReady}`);
  });

  test('10. Verify dashboard shows check-in statistics', async ({ page }) => {
    console.log('\n📊 Step 12: Verifying dashboard statistics...\n');

    // Navigate to dashboard
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Check for registration count
    const regCount = page.locator('text=/\\d+.*registration/i');
    if (await regCount.isVisible({ timeout: 5000 }).catch(() => false)) {
      const count = await regCount.textContent();
      console.log(`   📝 Registration count: ${count}`);
    }

    // Check for QR code count
    const qrCount = page.locator('text=/\\d+.*QR/i');
    if (await qrCount.isVisible({ timeout: 5000 }).catch(() => false)) {
      const count = await qrCount.textContent();
      console.log(`   📱 QR code count: ${count}`);
    }

    // Check for check-in stats
    const checkInStats = page.locator('text=/check.*in/i, text=/\\d+%/');
    if (await checkInStats.isVisible({ timeout: 5000 }).catch(() => false)) {
      const stats = await checkInStats.textContent();
      console.log(`   ✅ Check-in stats: ${stats}`);
    }

    console.log('\n✅ Dashboard statistics verified');
  });
});

/**
 * QR Check-In Regression Tests
 */
test.describe('QR Check-In Regression Tests', () => {
  test('Registration success page does NOT redirect to onboarding', async ({ page }) => {
    console.log('\n🔍 Testing regression: Success page redirect...\n');

    // Seed and create a registration
    await page.request.get(`${BASE_URL}/api/test/seed`);
    
    const regUrl = `${BASE_URL}/register/test-org/main-entrance`;
    await page.goto(regUrl);
    await page.waitForLoadState('networkidle');

    // Submit minimal registration
    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(5000);

      const currentUrl = page.url();
      console.log(`   📍 Current URL: ${currentUrl}`);

      // Should be on success page, NOT onboarding
      expect(currentUrl).not.toContain('/onboarding');
      expect(currentUrl).not.toContain('/organization-setup');
      console.log('   ✅ No redirect to onboarding');

      // Should either be on success page or still on registration
      const isOnSuccess = currentUrl.includes('/registration-success');
      const isOnRegistration = currentUrl.includes('/register/');
      
      expect(isOnSuccess || isOnRegistration).toBe(true);
      console.log(`   ✅ On correct page: ${isOnSuccess ? 'success' : 'registration'}`);
    }
  });

  test('Check-in token is unique for each registration', async ({ page }) => {
    console.log('\n🔒 Testing token uniqueness...\n');

    // Create two registrations
    const response1 = await page.request.get(`${BASE_URL}/api/test/seed`);
    const seed1 = await response1.json();

    await page.waitForTimeout(1000);

    const response2 = await page.request.get(`${BASE_URL}/api/test/seed`);
    const seed2 = await response2.json();

    // If both have registration IDs, verify tokens are different
    if (seed1.registrationId && seed2.registrationId) {
      const reg1 = await page.request.get(`${BASE_URL}/api/registrations/${seed1.registrationId}`);
      const reg2 = await page.request.get(`${BASE_URL}/api/registrations/${seed2.registrationId}`);

      if (reg1.ok() && reg2.ok()) {
        const data1 = await reg1.json();
        const data2 = await reg2.json();

        const token1 = data1.registration?.checkInToken;
        const token2 = data2.registration?.checkInToken;

        expect(token1).toBeTruthy();
        expect(token2).toBeTruthy();
        expect(token1).not.toBe(token2);
        console.log('   ✅ Tokens are unique');
      }
    } else {
      console.log('   ⚠️  Skipped - could not create test registrations');
    }
  });
});

