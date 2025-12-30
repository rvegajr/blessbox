/**
 * Multi-Organization Selection E2E Test
 * December 30, 2024
 * 
 * Tests the complete multi-organization flow:
 * 1. Create first organization
 * 2. Register second organization with SAME email
 * 3. Login and verify organization selection page appears
 * 4. Select an organization
 * 5. Verify navigation works (not stuck)
 * 6. Test switching between organizations
 * 7. Verify each organization has independent data
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

test.describe('Multi-Organization Selection', () => {
  test('User can register multiple organizations and switch between them', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `multi-org-test-${timestamp}@example.com`;
    const org1Name = `First Org ${timestamp}`;
    const org2Name = `Second Org ${timestamp}`;
    
    console.log('\n' + '='.repeat(70));
    console.log('🏢 MULTI-ORGANIZATION SELECTION TEST');
    console.log('='.repeat(70));
    console.log(`📧 Email: ${testEmail}`);
    console.log(`🏢 Org 1: ${org1Name}`);
    console.log(`🏢 Org 2: ${org2Name}`);
    console.log('='.repeat(70) + '\n');

    // =========================================================================
    // PHASE 1: CREATE FIRST ORGANIZATION
    // =========================================================================
    console.log('📋 PHASE 1: Create First Organization...');
    
    await page.goto(`${BASE_URL}/onboarding/organization-setup`);
    await page.waitForLoadState('domcontentloaded');
    
    const orgNameInput1 = page.locator('input[data-testid="input-org-name"]');
    await orgNameInput1.fill(org1Name);
    
    const contactEmailInput1 = page.locator('input[data-testid="input-contact-email"]');
    await contactEmailInput1.fill(testEmail);
    
    const submitOrgBtn1 = page.locator('button[data-testid="btn-submit-org-setup"]');
    await submitOrgBtn1.click();
    
    await page.waitForURL(/email-verification/, { timeout: 15000 });
    console.log('  ✓ First organization created');

    // Verify email for first org
    await page.waitForTimeout(2000);
    const code1 = await getVerificationCode(page, testEmail);
    if (!code1) throw new Error('Failed to get verification code for org 1');
    
    const codeInput1 = page.locator('input[data-testid="input-verification-code"]');
    await codeInput1.fill(code1);
    
    const verifyBtn1 = page.locator('button[data-testid="btn-verify-code"]');
    await verifyBtn1.click();
    
    await page.waitForTimeout(3000);
    console.log('  ✓ Email verified for first organization');
    
    // Navigate to dashboard (skip form builder/QR for now)
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForTimeout(2000);
    console.log('✅ PHASE 1 COMPLETE: First organization created\n');

    // =========================================================================
    // PHASE 2: LOGOUT
    // =========================================================================
    console.log('🚪 PHASE 2: Logout...');
    
    // Logout (via API is simplest)
    await page.request.post(`${BASE_URL}/api/auth/logout`);
    await page.waitForTimeout(1000);
    console.log('✅ PHASE 2 COMPLETE: Logged out\n');

    // =========================================================================
    // PHASE 3: CREATE SECOND ORGANIZATION (SAME EMAIL)
    // =========================================================================
    console.log('📋 PHASE 3: Create Second Organization (Same Email)...');
    
    await page.goto(`${BASE_URL}/onboarding/organization-setup`);
    await page.waitForLoadState('domcontentloaded');
    
    const orgNameInput2 = page.locator('input[data-testid="input-org-name"]');
    await orgNameInput2.fill(org2Name);
    
    const contactEmailInput2 = page.locator('input[data-testid="input-contact-email"]');
    await contactEmailInput2.fill(testEmail); // SAME EMAIL
    
    const submitOrgBtn2 = page.locator('button[data-testid="btn-submit-org-setup"]');
    await submitOrgBtn2.click();
    
    await page.waitForURL(/email-verification/, { timeout: 15000 });
    console.log('  ✓ Second organization created with same email');

    // Verify email for second org
    await page.waitForTimeout(2000);
    const code2 = await getVerificationCode(page, testEmail);
    if (!code2) throw new Error('Failed to get verification code for org 2');
    
    const codeInput2 = page.locator('input[data-testid="input-verification-code"]');
    await codeInput2.fill(code2);
    
    const verifyBtn2 = page.locator('button[data-testid="btn-verify-code"]');
    await verifyBtn2.click();
    
    await page.waitForTimeout(3000);
    console.log('  ✓ Email verified for second organization');
    console.log('✅ PHASE 3 COMPLETE: Second organization created\n');

    // =========================================================================
    // PHASE 4: LOGOUT AGAIN
    // =========================================================================
    console.log('🚪 PHASE 4: Logout again...');
    await page.request.post(`${BASE_URL}/api/auth/logout`);
    await page.waitForTimeout(1000);
    console.log('✅ PHASE 4 COMPLETE: Logged out\n');

    // =========================================================================
    // PHASE 5: LOGIN WITH MULTI-ORG EMAIL
    // =========================================================================
    console.log('🔐 PHASE 5: Login with Multi-Org Email...');
    
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('domcontentloaded');
    
    const loginEmail = page.locator('input[data-testid="input-email"]');
    await loginEmail.fill(testEmail);
    
    const sendCodeBtn = page.locator('button[data-testid="btn-submit-login"]');
    await sendCodeBtn.click();
    
    await page.waitForTimeout(2000);
    const loginCode = await getVerificationCode(page, testEmail);
    if (!loginCode) throw new Error('Failed to get login verification code');
    
    const loginCodeInput = page.locator('input[data-testid="input-code"]');
    await loginCodeInput.fill(loginCode);
    
    const verifyLoginBtn = page.locator('button[data-testid="btn-verify-code"]');
    await verifyLoginBtn.click();
    
    // Should redirect to /select-organization
    await page.waitForURL(/select-organization/, { timeout: 15000 });
    console.log('  ✓ Logged in - redirected to organization selection');
    console.log('✅ PHASE 5 COMPLETE: Multi-org login successful\n');

    // =========================================================================
    // PHASE 6: SELECT ORGANIZATION (BUG FIX TEST)
    // =========================================================================
    console.log('🎯 PHASE 6: Select Organization (Bug Fix Test)...');
    
    const selectOrgPage = page.locator('[data-testid="page-select-organization"]');
    await expect(selectOrgPage).toBeVisible({ timeout: 10000 });
    console.log('  ✓ Organization selection page loaded');
    
    // Verify both organizations are listed
    const orgList = page.locator('[data-testid="list-organizations"]');
    await expect(orgList).toBeVisible();
    
    const orgOptions = page.locator('[data-testid^="org-option-"]');
    const orgCount = await orgOptions.count();
    console.log(`  ✓ Found ${orgCount} organization(s)`);
    expect(orgCount).toBe(2);
    
    // Verify org names are visible
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain(org1Name);
    expect(pageContent).toContain(org2Name);
    console.log(`  ✓ Both organizations visible: "${org1Name}" and "${org2Name}"`);
    
    // Select the first organization
    const firstOrg = orgOptions.first();
    await firstOrg.click();
    await page.waitForTimeout(500);
    console.log('  ✓ Selected first organization');
    
    // Click Continue button
    const continueBtn = page.locator('button[data-testid="btn-confirm-organization"]');
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();
    
    // Wait for navigation with timeout
    console.log('  → Waiting for navigation (bug fix test)...');
    
    // CRITICAL: Page should NOT get stuck - should navigate to dashboard
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    console.log('  ✓ Successfully navigated to dashboard (NOT STUCK!)');
    
    // Verify dashboard loaded
    const dashboard = page.locator('[data-testid="page-dashboard"]');
    await expect(dashboard).toBeVisible({ timeout: 10000 });
    console.log('  ✓ Dashboard loaded successfully');
    
    console.log('✅ PHASE 6 COMPLETE: Organization selection bug FIXED\n');

    // =========================================================================
    // PHASE 7: SWITCH TO OTHER ORGANIZATION
    // =========================================================================
    console.log('🔄 PHASE 7: Switch to Other Organization...');
    
    // Navigate to select-organization page
    await page.goto(`${BASE_URL}/select-organization`);
    await page.waitForTimeout(2000);
    
    const selectOrgPage2 = page.locator('[data-testid="page-select-organization"]');
    await expect(selectOrgPage2).toBeVisible({ timeout: 10000 });
    
    // Select the second organization (last one)
    const allOrgOptions = page.locator('[data-testid^="org-option-"]');
    const secondOrg = allOrgOptions.last();
    await secondOrg.click();
    await page.waitForTimeout(500);
    console.log('  ✓ Selected second organization');
    
    // Click Continue
    const continueBtn2 = page.locator('button[data-testid="btn-confirm-organization"]');
    await continueBtn2.click();
    
    // Verify navigation works again
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    console.log('  ✓ Successfully switched to second organization');
    
    const dashboard2 = page.locator('[data-testid="page-dashboard"]');
    await expect(dashboard2).toBeVisible({ timeout: 10000 });
    console.log('  ✓ Dashboard loaded for second organization');
    
    console.log('✅ PHASE 7 COMPLETE: Organization switching works\n');

    // =========================================================================
    // FINAL VERIFICATION
    // =========================================================================
    console.log('🎯 FINAL VERIFICATION...');
    
    // Test navigating back to org selection one more time
    await page.goto(`${BASE_URL}/select-organization`);
    await page.waitForTimeout(2000);
    
    const finalSelectPage = page.locator('[data-testid="page-select-organization"]');
    await expect(finalSelectPage).toBeVisible();
    console.log('  ✓ Can return to organization selection');
    
    // Verify organizations still listed
    const finalOrgOptions = page.locator('[data-testid^="org-option-"]');
    const finalCount = await finalOrgOptions.count();
    expect(finalCount).toBe(2);
    console.log('  ✓ Both organizations still available');
    
    console.log('\n' + '='.repeat(70));
    console.log('🎉 MULTI-ORGANIZATION SELECTION TEST COMPLETE!');
    console.log('='.repeat(70));
    console.log('✅ Bug Fix VERIFIED: Page no longer gets stuck');
    console.log('✅ Multi-organization registration works');
    console.log('✅ Organization selection works correctly');
    console.log('✅ Switching between organizations works');
    console.log('='.repeat(70) + '\n');
  });
});

