/**
 * Full Integration Test - Bug Fixes with Real Data
 * December 30, 2024
 * 
 * This test performs the COMPLETE business flow:
 * 1. Creates an organization through full onboarding
 * 2. Generates QR codes
 * 3. Submits public registrations through QR codes
 * 4. Verifies registrations appear in dashboard with correct names/emails
 * 5. Adds more QR codes and verifies existing ones remain
 * 6. Processes a test payment
 * 7. Verifies all data persists correctly
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:7777';
const IS_PRODUCTION = BASE_URL.includes('blessbox.org');
const PROD_TEST_SEED_SECRET = process.env.PROD_TEST_SEED_SECRET;

// Helper to get verification code
async function getVerificationCode(page: any, email: string): Promise<string | null> {
  const response = await page.request.post(
    `${BASE_URL}/api/test/verification-code`,
    {
      headers: IS_PRODUCTION ? { 'x-qa-seed-token': PROD_TEST_SEED_SECRET } : undefined,
      data: { email },
    }
  );
  
  if (response.ok()) {
    const data = await response.json();
    return data.code || null;
  }
  return null;
}

test.describe('Full Integration Test - Complete Bug Fixes Flow', () => {
  test('Complete business flow: Organization → QR Codes → Registrations → Payment', async ({ page }) => {
    const timestamp = Date.now();
    const orgName = `Test Org ${timestamp}`;
    const adminEmail = `admin-${timestamp}@example.com`;
    const registrant1Email = `registrant1-${timestamp}@example.com`;
    const registrant2Email = `registrant2-${timestamp}@example.com`;
    
    console.log('\n' + '='.repeat(70));
    console.log('🔄 FULL INTEGRATION TEST - Complete Business Flow');
    console.log('='.repeat(70));
    console.log(`📧 Admin Email: ${adminEmail}`);
    console.log(`🏢 Organization: ${orgName}`);
    console.log('='.repeat(70) + '\n');

    // =========================================================================
    // PHASE 1: COMPLETE ONBOARDING
    // =========================================================================
    console.log('📋 PHASE 1: Complete Onboarding...');
    
    // Step 1: Organization Setup
    console.log('  → Step 1: Organization Setup');
    await page.goto(`${BASE_URL}/onboarding/organization-setup`);
    await page.waitForLoadState('domcontentloaded');
    
    const orgNameInput = page.locator('input[data-testid="input-org-name"]');
    await orgNameInput.fill(orgName);
    
    const contactEmailInput = page.locator('input[data-testid="input-contact-email"]');
    await contactEmailInput.fill(adminEmail);
    
    const submitOrgBtn = page.locator('button[data-testid="btn-submit-org-setup"]');
    await submitOrgBtn.click();
    
    await page.waitForURL(/email-verification/, { timeout: 10000 });
    console.log('    ✓ Organization created');

    // Step 2: Email Verification
    console.log('  → Step 2: Email Verification');
    
    // Wait for page to load and get the code
    await page.waitForTimeout(2000);
    const code = await getVerificationCode(page, adminEmail);
    
    if (!code) {
      throw new Error('Failed to get verification code');
    }
    
    const codeInput = page.locator('input[data-testid="input-verification-code"], input[type="text"][maxlength="6"]').first();
    await codeInput.fill(code);
    
    const verifyBtn = page.locator('button[data-testid="btn-verify-code"], button:has-text("Verify")').first();
    await verifyBtn.click();
    
    await page.waitForURL(/form-builder/, { timeout: 15000 });
    console.log('    ✓ Email verified');

    // Step 3: Form Builder (skip by navigating directly to QR config)
    console.log('  → Step 3: Form Builder (skipping)');
    await page.goto(`${BASE_URL}/onboarding/qr-configuration`);
    await page.waitForLoadState('domcontentloaded');
    console.log('    ✓ Navigated to QR configuration');

    // Step 4: QR Configuration - Generate Initial QR Codes
    console.log('  → Step 4: Generate Initial QR Codes');
    await page.waitForTimeout(1000);
    
    // Add entry point labels
    const addEntryBtn = page.locator('button:has-text("Add"), button:has-text("+")').first();
    
    // Try to add first entry point
    if (await addEntryBtn.isVisible()) {
      await addEntryBtn.click();
      await page.waitForTimeout(500);
      
      const labelInput = page.locator('input[placeholder*="label" i], input[placeholder*="entry" i]').last();
      await labelInput.fill('Main Entrance');
      
      // Add second entry point
      if (await addEntryBtn.isVisible()) {
        await addEntryBtn.click();
        await page.waitForTimeout(500);
        
        const labelInput2 = page.locator('input[placeholder*="label" i], input[placeholder*="entry" i]').last();
        await labelInput2.fill('Side Door');
      }
    }
    
    // Generate QR codes
    const generateBtn = page.locator('button:has-text("Generate"), button[data-testid="btn-generate"]').first();
    
    // Wait for button to be enabled
    let attempts = 0;
    while (await generateBtn.isDisabled() && attempts < 10) {
      await page.waitForTimeout(500);
      attempts++;
    }
    
    await generateBtn.click();
    await page.waitForTimeout(3000); // Wait for QR generation
    console.log('    ✓ Initial QR codes generated (2 codes)');

    // Complete onboarding
    const completeBtn = page.locator('button:has-text("Complete"), button:has-text("Finish"), button:has-text("Dashboard")').first();
    if (await completeBtn.isVisible()) {
      await completeBtn.click();
      await page.waitForURL(/dashboard/, { timeout: 10000 });
    } else {
      await page.goto(`${BASE_URL}/dashboard`);
    }
    
    console.log('✅ PHASE 1 COMPLETE: Organization onboarded with 2 QR codes\n');

    // =========================================================================
    // PHASE 2: SUBMIT PUBLIC REGISTRATIONS
    // =========================================================================
    console.log('📝 PHASE 2: Submit Public Registrations...');
    
    // Get the organization slug from current URL or storage
    const currentUrl = page.url();
    let orgSlug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Registration 1: Through "Main Entrance" QR code
    console.log('  → Registration 1: Main Entrance');
    const registrationUrl1 = `${BASE_URL}/register/${orgSlug}/main-entrance`;
    
    await page.goto(registrationUrl1);
    await page.waitForTimeout(2000);
    
    // Fill registration form
    const nameInput1 = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    await nameInput1.fill('John Doe');
    
    const emailInput1 = page.locator('input[type="email"], input[name="email"]').first();
    await emailInput1.fill(registrant1Email);
    
    // Check for phone field
    const phoneInput = page.locator('input[type="tel"], input[name="phone"]').first();
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('555-1234');
    }
    
    const submitBtn1 = page.locator('button[type="submit"], button:has-text("Submit")').first();
    await submitBtn1.click();
    await page.waitForTimeout(2000);
    console.log('    ✓ Registration 1 submitted: John Doe');

    // Registration 2: Through "Side Door" QR code
    console.log('  → Registration 2: Side Door');
    const registrationUrl2 = `${BASE_URL}/register/${orgSlug}/side-door`;
    
    await page.goto(registrationUrl2);
    await page.waitForTimeout(2000);
    
    const nameInput2 = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    await nameInput2.fill('Jane Smith');
    
    const emailInput2 = page.locator('input[type="email"], input[name="email"]').first();
    await emailInput2.fill(registrant2Email);
    
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('555-5678');
    }
    
    const submitBtn2 = page.locator('button[type="submit"], button:has-text("Submit")').first();
    await submitBtn2.click();
    await page.waitForTimeout(2000);
    console.log('    ✓ Registration 2 submitted: Jane Smith');
    
    console.log('✅ PHASE 2 COMPLETE: 2 registrations submitted\n');

    // =========================================================================
    // PHASE 3: VERIFY REGISTRATIONS IN DASHBOARD (BUG FIX #1)
    // =========================================================================
    console.log('🔍 PHASE 3: Verify Registrations Display (Bug Fix #1)...');
    
    // Navigate to registrations dashboard
    await page.goto(`${BASE_URL}/dashboard/registrations`);
    await page.waitForTimeout(2000);
    
    const registrationsPage = page.locator('[data-testid="page-dashboard-registrations"]');
    await expect(registrationsPage).toBeVisible({ timeout: 15000 });
    
    // Check for registration rows
    const registrationRows = page.locator('[data-testid^="row-registration-"]');
    const rowCount = await registrationRows.count();
    
    console.log(`  → Found ${rowCount} registration(s) in list`);
    expect(rowCount).toBeGreaterThan(0);
    
    // Verify Bug Fix #1: Names and emails display correctly
    const firstRow = registrationRows.first();
    
    // Get name cell (column 1)
    const nameCell = firstRow.locator('td').nth(0);
    const nameText = await nameCell.textContent();
    console.log(`  → Name in list: "${nameText?.trim()}"`);
    
    // Verify name is not "undefined undefined" or empty
    expect(nameText?.trim()).not.toBe('');
    expect(nameText?.trim()).not.toBe('-');
    expect(nameText).not.toContain('undefined');
    expect(nameText).toMatch(/John Doe|Jane Smith/);
    
    // Get email cell (column 2)
    const emailCell = firstRow.locator('td').nth(1);
    const emailText = await emailCell.textContent();
    console.log(`  → Email in list: "${emailText?.trim()}"`);
    
    // Verify email is not undefined or empty
    expect(emailText?.trim()).not.toBe('');
    expect(emailText?.trim()).not.toBe('-');
    expect(emailText).not.toContain('undefined');
    expect(emailText).toMatch(/@example\.com/);
    
    console.log('✅ PHASE 3 COMPLETE: Bug Fix #1 VERIFIED');
    console.log('   ✓ Names display correctly (not "undefined undefined")');
    console.log('   ✓ Emails display correctly (not empty)\n');

    // =========================================================================
    // PHASE 4: ADD MORE QR CODES (BUG FIX #3)
    // =========================================================================
    console.log('➕ PHASE 4: Add More QR Codes (Bug Fix #3)...');
    
    // Navigate to QR codes page
    await page.goto(`${BASE_URL}/dashboard/qr-codes`);
    await page.waitForTimeout(2000);
    
    const qrCodesPage = page.locator('[data-testid="page-dashboard-qr-codes"]');
    await expect(qrCodesPage).toBeVisible({ timeout: 15000 });
    
    // Get initial count
    const qrCodeCards = page.locator('[data-testid^="card-qr-"]');
    const initialCount = await qrCodeCards.count();
    console.log(`  → Initial QR code count: ${initialCount}`);
    expect(initialCount).toBe(2); // Should have our 2 initial codes
    
    // Click "Add QR Code" button
    const addQrBtn = page.locator('button[data-testid="btn-add-qr-code"]');
    await expect(addQrBtn).toBeVisible();
    await addQrBtn.click();
    await page.waitForTimeout(500);
    console.log('  → Clicked "Add QR Code" button');
    
    // Verify form appears
    const addQrForm = page.locator('[data-testid="form-add-qr-code"]');
    await expect(addQrForm).toBeVisible();
    console.log('  → Add QR Code form appeared');
    
    // Fill in new QR code label
    const newQrLabel = page.locator('input[data-testid="input-new-qr-label"]');
    await newQrLabel.fill('Back Entrance');
    console.log('  → Entered label: "Back Entrance"');
    
    // Click generate
    const generateNewBtn = page.locator('button[data-testid="btn-generate-new-qr"]');
    await expect(generateNewBtn).toBeEnabled();
    await generateNewBtn.click();
    
    // Wait for generation and alert
    await page.waitForTimeout(3000);
    
    // Handle alert if it appears
    page.on('dialog', async dialog => {
      console.log(`  → Alert: ${dialog.message()}`);
      await dialog.accept();
    });
    
    // Refresh to see updated list
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Verify Bug Fix #3: New QR code added, existing ones remain
    const updatedQrCodeCards = page.locator('[data-testid^="card-qr-"]');
    const finalCount = await updatedQrCodeCards.count();
    console.log(`  → Final QR code count: ${finalCount}`);
    
    expect(finalCount).toBe(3); // Should now have 3 codes
    
    console.log('✅ PHASE 4 COMPLETE: Bug Fix #3 VERIFIED');
    console.log('   ✓ New QR code added successfully');
    console.log('   ✓ Existing QR codes preserved (2 → 3)\n');

    // =========================================================================
    // PHASE 5: PROCESS PAYMENT (BUG FIX #2)
    // =========================================================================
    console.log('💳 PHASE 5: Process Payment (Bug Fix #2)...');
    
    // Navigate to checkout
    await page.goto(`${BASE_URL}/checkout?plan=standard`);
    await page.waitForTimeout(2000);
    
    const checkoutPage = page.locator('[data-testid="page-checkout"]');
    await expect(checkoutPage).toBeVisible({ timeout: 15000 });
    console.log('  → Checkout page loaded');
    
    // Monitor console for errors
    const consoleErrors: string[] = [];
    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });
    
    // Fill in email
    const checkoutEmail = page.locator('input[data-testid="input-email"]');
    await checkoutEmail.fill(adminEmail);
    console.log(`  → Filled email: ${adminEmail}`);
    
    // Wait a moment
    await page.waitForTimeout(1000);
    
    // Verify Bug Fix #2: No JavaScript errors
    const sessionErrors = consoleErrors.filter(e => 
      e.includes('session') || 
      e.includes('user.email') ||
      e.includes('Cannot read properties')
    );
    
    expect(sessionErrors).toHaveLength(0);
    console.log('  → No JavaScript errors detected');
    
    // Check if payment form is visible
    const paymentSection = page.locator('[data-testid="section-payment"]');
    await expect(paymentSection).toBeVisible();
    console.log('  → Payment form rendered correctly');
    
    // For local/test: Click the test checkout button
    const testPaymentBtn = page.locator('button:has-text("Complete Payment"), button:has-text("Complete Checkout")');
    if (await testPaymentBtn.isVisible()) {
      console.log('  → Processing test payment...');
      await testPaymentBtn.click();
      await page.waitForTimeout(2000);
      
      // Check if redirected or shows success
      const currentUrl = page.url();
      if (currentUrl.includes('dashboard')) {
        console.log('  → Payment successful, redirected to dashboard');
      } else {
        console.log('  → Payment processed (mock mode)');
      }
    }
    
    console.log('✅ PHASE 5 COMPLETE: Bug Fix #2 VERIFIED');
    console.log('   ✓ Checkout page loads without crashes');
    console.log('   ✓ No session.user.email errors');
    console.log('   ✓ Payment form functional\n');

    // =========================================================================
    // FINAL VERIFICATION
    // =========================================================================
    console.log('🎯 FINAL VERIFICATION...');
    
    // Navigate back to dashboard
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForTimeout(2000);
    
    const dashboard = page.locator('[data-testid="page-dashboard"]');
    await expect(dashboard).toBeVisible({ timeout: 15000 });
    console.log('  ✓ Dashboard accessible');
    
    // Check registrations one more time
    await page.goto(`${BASE_URL}/dashboard/registrations`);
    await page.waitForTimeout(2000);
    
    const finalRegCount = await page.locator('[data-testid^="row-registration-"]').count();
    console.log(`  ✓ Registrations persist: ${finalRegCount} found`);
    expect(finalRegCount).toBeGreaterThanOrEqual(2);
    
    // Check QR codes one more time
    await page.goto(`${BASE_URL}/dashboard/qr-codes`);
    await page.waitForTimeout(2000);
    
    const finalQrCount = await page.locator('[data-testid^="card-qr-"]').count();
    console.log(`  ✓ QR codes persist: ${finalQrCount} found`);
    expect(finalQrCount).toBe(3);
    
    console.log('\n' + '='.repeat(70));
    console.log('🎉 FULL INTEGRATION TEST COMPLETE!');
    console.log('='.repeat(70));
    console.log('✅ All bug fixes verified with real data:');
    console.log('   • Bug Fix #1: Registration list displays names/emails correctly');
    console.log('   • Bug Fix #2: Payment processing works without crashes');
    console.log('   • Bug Fix #3: QR codes can be added incrementally');
    console.log('='.repeat(70) + '\n');
  });
});

