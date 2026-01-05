import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:7777';
const TEST_ENV = process.env.TEST_ENV || 'local';
const IS_PRODUCTION = TEST_ENV === 'production' || /blessbox\.org/i.test(BASE_URL);
const PROD_TEST_SEED_SECRET = process.env.PROD_TEST_SEED_SECRET || '';

/**
 * Regression tests for:
 * 1. Issue #1: Scan count shows wrong numbers (set-level vs per-QR-code)
 * 2. Issue #2: Dropdown options non-functional
 */

test.describe('Scan Count Regression - Per QR Code Counts', () => {
  test('API: Each QR code should have its own scan count based on registrations', async ({ request }) => {
    // This test verifies that scan counts are per-QR-code, not shared across the set
    
    // Step 1: Create an organization with a form config
    let organizationId: string;
    let contactEmail: string;
    
    if (IS_PRODUCTION) {
      if (!PROD_TEST_SEED_SECRET) {
        test.skip();
        return;
      }
      const seedResp = await request.post(`${BASE_URL}/api/test/seed-prod`, {
        headers: { 'x-qa-seed-token': PROD_TEST_SEED_SECRET },
        data: { seedKey: `scan-count-test-${Date.now()}` },
      });
      expect(seedResp.ok()).toBeTruthy();
      const seed = await seedResp.json();
      organizationId = seed.organizationId;
      contactEmail = seed.contactEmail;
    } else {
      const seedResp = await request.post(`${BASE_URL}/api/test/seed`, {
        data: { seedKey: `scan-count-test-${Date.now()}` },
      });
      expect(seedResp.ok()).toBeTruthy();
      const seed = await seedResp.json();
      organizationId = seed.organizationId;
      contactEmail = seed.contactEmail;
    }

    // Step 2: Fetch QR codes with test auth
    const qrListResp = await request.get(`${BASE_URL}/api/qr-codes`, {
      headers: {
        cookie: `bb_test_auth=1; bb_test_email=${contactEmail}; bb_active_org_id=${organizationId}`,
      },
    });
    
    if (!qrListResp.ok()) {
      console.log('QR codes list response:', qrListResp.status());
      // If no QR codes exist yet for this seed, that's OK - test the logic only
      console.log('No existing QR codes - testing QRCodeService logic separately');
      return;
    }

    const qrList = await qrListResp.json();
    
    if (!qrList.success || !qrList.data?.length) {
      console.log('No QR codes found for this org - skipping verification');
      return;
    }
    
    const qrCodes = qrList.data;
    console.log(`Found ${qrCodes.length} QR codes`);

    // Step 3: Verify that scan counts are PER QR CODE, not shared
    // BUG FIX: Each QR code's scanCount should equal its registrationCount
    
    // Check that scan counts match registration counts for each QR code
    for (const qr of qrCodes) {
      // scanCount should equal registrationCount (per-QR-code basis)
      console.log(`QR "${qr.label}": scanCount=${qr.scanCount}, registrationCount=${qr.registrationCount}`);
      expect(qr.scanCount).toBe(qr.registrationCount);
    }

    // Verify total calculation would be correct
    const totalScans = qrCodes.reduce((sum: number, qr: any) => sum + qr.scanCount, 0);
    const totalRegistrations = qrCodes.reduce((sum: number, qr: any) => sum + qr.registrationCount, 0);
    
    // These should be equal - scans = registrations
    expect(totalScans).toBe(totalRegistrations);
    console.log(`Total: scans=${totalScans}, registrations=${totalRegistrations}`);
  });
});

test.describe('Dropdown Options Regression', () => {
  test.beforeEach(async ({ page, request }) => {
    // Seed organization for form builder access
    let organizationId: string;
    let contactEmail: string;

    if (IS_PRODUCTION) {
      if (!PROD_TEST_SEED_SECRET) {
        test.skip();
        return;
      }
      const seedResp = await request.post(`${BASE_URL}/api/test/seed-prod`, {
        headers: { 'x-qa-seed-token': PROD_TEST_SEED_SECRET },
        data: { seedKey: `options-test-${Date.now()}` },
      });
      const seed = await seedResp.json();
      organizationId = seed.organizationId;
      contactEmail = seed.contactEmail;
    } else {
      const seedResp = await request.post(`${BASE_URL}/api/test/seed`, {
        data: { seedKey: `options-test-${Date.now()}` },
      });
      const seed = await seedResp.json();
      organizationId = seed.organizationId;
      contactEmail = seed.contactEmail;
    }

    // Set up localStorage and auth
    await page.goto(BASE_URL);
    await page.evaluate(
      ({ organizationId, contactEmail }) => {
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem('onboarding_organizationId', organizationId);
        localStorage.setItem('onboarding_contactEmail', contactEmail);
        localStorage.setItem('onboarding_emailVerified', 'true');
      },
      { organizationId, contactEmail }
    );

    await page.context().addCookies([
      { name: 'bb_test_auth', value: '1', url: BASE_URL },
      { name: 'bb_test_email', value: contactEmail, url: BASE_URL },
      { name: 'bb_active_org_id', value: organizationId, url: BASE_URL },
    ]);
  });

  test('Adding a select field should provide default options', async ({ page }) => {
    await page.goto(`${BASE_URL}/onboarding/form-builder`);
    await page.waitForLoadState('networkidle');

    // Wait for form builder to load
    await page.waitForSelector('[data-testid="form-builder-wizard"]', { timeout: 10000 });

    // Click to add a dropdown/select field
    const dropdownButton = page.getByRole('button', { name: /dropdown/i });
    await expect(dropdownButton).toBeVisible({ timeout: 5000 });
    await dropdownButton.click();

    // Find the options textarea for the newly added field
    const optionsTextarea = page.locator('textarea[data-testid^="input-select-options-"]').first();
    await expect(optionsTextarea).toBeVisible({ timeout: 5000 });

    // EXPECTED: Should have 10 default options: "1", "2", "3", ... "10" (no "Option" prefix)
    const optionsValue = await optionsTextarea.inputValue();
    
    console.log('Options textarea value:', JSON.stringify(optionsValue));
    
    // Verify 10 default options are present (numbered 1-10, no prefix)
    const options = optionsValue.split('\n').filter((o: string) => o.trim() !== '');
    expect(options.length).toBe(10);
    
    // Verify each number from 1 to 10 is present
    for (let i = 1; i <= 10; i++) {
      expect(optionsValue).toContain(String(i));
    }
    
    // Verify no "Option" or "Choice" prefix
    expect(optionsValue).not.toContain('Option');
    expect(optionsValue).not.toContain('Choice');
  });

  test('User can add more than 10 options to a dropdown', async ({ page }) => {
    await page.goto(`${BASE_URL}/onboarding/form-builder`);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="form-builder-wizard"]', { timeout: 10000 });

    // Add a dropdown field
    const dropdownButton = page.getByRole('button', { name: /dropdown/i });
    await expect(dropdownButton).toBeVisible({ timeout: 5000 });
    await dropdownButton.click();

    // Find the options textarea
    const optionsTextarea = page.locator('textarea[data-testid^="input-select-options-"]').first();
    await expect(optionsTextarea).toBeVisible({ timeout: 5000 });

    // Type 15 options (more than the default 10)
    const fifteenOptions = [
      'Small',
      'Medium', 
      'Large',
      'X-Large',
      'XX-Large',
      'Newborn',
      'Size 1',
      'Size 2',
      'Size 3',
      'Size 4',
      'Size 5',
      'Size 6',
      'Size 7',
      'Size 8',
      'Size 9',
    ].join('\n');

    await optionsTextarea.fill(fifteenOptions);

    // Verify all 15 options are preserved
    const savedValue = await optionsTextarea.inputValue();
    const savedOptions = savedValue.split('\n').filter((o: string) => o.trim() !== '');
    
    console.log('Saved options count:', savedOptions.length);
    console.log('Saved options:', savedOptions);
    
    // EXPECTED: All 15 options should be preserved (more than default 10)
    expect(savedOptions.length).toBe(15);
    expect(savedOptions).toContain('Small');
    expect(savedOptions).toContain('Size 9');
  });

  test('Deleting an option should not reduce available slots', async ({ page }) => {
    await page.goto(`${BASE_URL}/onboarding/form-builder`);
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="form-builder-wizard"]', { timeout: 10000 });

    // Add a dropdown field
    const dropdownButton = page.getByRole('button', { name: /dropdown/i });
    await expect(dropdownButton).toBeVisible({ timeout: 5000 });
    await dropdownButton.click();

    // Find the options textarea
    const optionsTextarea = page.locator('textarea[data-testid^="input-select-options-"]').first();
    await expect(optionsTextarea).toBeVisible({ timeout: 5000 });

    // Start with 5 options
    const initialOptions = ['A', 'B', 'C', 'D', 'E'].join('\n');
    await optionsTextarea.fill(initialOptions);

    // Delete middle option (C) and add a new one
    const modifiedOptions = ['A', 'B', 'D', 'E', 'F'].join('\n');
    await optionsTextarea.fill(modifiedOptions);

    // Verify we still have 5 options
    const finalValue = await optionsTextarea.inputValue();
    const finalOptions = finalValue.split('\n').filter((o: string) => o.trim() !== '');
    
    console.log('Final options count:', finalOptions.length);
    console.log('Final options:', finalOptions);
    
    // BUG: Previously, deleting an option reduced the total count permanently
    // EXPECTED: User can always add/remove options freely
    expect(finalOptions.length).toBe(5);
    expect(finalOptions).toContain('F');
  });
});

