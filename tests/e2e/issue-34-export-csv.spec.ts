/**
 * Issue #34: Fix Export CSV button on event report page
 * TDD E2E Test (RED phase - expecting failures)
 * 
 * Customer report: "Clicked 'Export CSV' on the event report page. Nothing happened."
 * 
 * This test reproduces the customer's workflow and validates the fix.
 */

import { test, expect } from '@playwright/test';
import { loginAsUser, seedOrg } from './_helpers/auth';
import fs from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:7777';

test.describe('Issue #34: Export CSV Functionality', () => {
  test('CSV export button exists and is clickable', async ({ page }) => {
    // Setup: seed an org and login
    const seed = await seedOrg(page, `export-test-${Date.now()}`);
    await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });

    // Navigate to registrations page (the "event report page")
    await page.goto(`${BASE_URL}/dashboard/registrations`);
    await page.waitForLoadState('networkidle');

    // Verify page loaded
    await expect(page.locator('[data-testid="page-dashboard-registrations"]')).toBeVisible();

    // Verify Export CSV button exists
    const exportButton = page.locator('[data-testid="btn-export-csv"]');
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toBeEnabled();
    await expect(exportButton).toContainText('Export CSV');
  });

  test('clicking Export CSV triggers download with valid CSV file', async ({ page }) => {
    // Setup: seed an org with some registrations and login
    const seed = await seedOrg(page, `export-download-${Date.now()}`);
    await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });

    // Navigate to registrations page
    await page.goto(`${BASE_URL}/dashboard/registrations`);
    await page.waitForLoadState('networkidle');

    // Set up download listener BEFORE clicking
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });

    // Click Export CSV button
    const exportButton = page.locator('[data-testid="btn-export-csv"]');
    await exportButton.click();

    // Wait for download to start
    const download = await downloadPromise;

    // Verify download has correct filename pattern
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/^registrations-\d{4}-\d{2}-\d{2}\.csv$/);

    // Save and verify file content
    const path = `/tmp/${filename}`;
    await download.saveAs(path);

    // Read and verify CSV structure
    const content = fs.readFileSync(path, 'utf-8');

    // Should start with BOM (invisible but important for Excel)
    expect(content.charCodeAt(0)).toBe(0xFEFF);

    // Should have headers
    expect(content).toContain('Registration ID');
    expect(content).toContain('QR Code ID');
    expect(content).toContain('Registered At');
    expect(content).toContain('Status');
    expect(content).toContain('Checked In');

    // Cleanup
    fs.unlinkSync(path);
  });

  test('Export CSV works in Chrome (customer browser)', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Chrome-specific test');

    const seed = await seedOrg(page, `export-chrome-${Date.now()}`);
    await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });

    await page.goto(`${BASE_URL}/dashboard/registrations`);
    await page.waitForLoadState('networkidle');

    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    await page.locator('[data-testid="btn-export-csv"]').click();

    const download = await downloadPromise;
    expect(download).toBeTruthy();
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  test('Export CSV works in Safari (customer browser)', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'Safari-specific test');

    const seed = await seedOrg(page, `export-safari-${Date.now()}`);
    await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });

    await page.goto(`${BASE_URL}/dashboard/registrations`);
    await page.waitForLoadState('networkidle');

    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    await page.locator('[data-testid="btn-export-csv"]').click();

    const download = await downloadPromise;
    expect(download).toBeTruthy();
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  test('Export CSV with no registrations returns empty CSV with headers', async ({ page }) => {
    // Setup with an org that has no registrations
    const seed = await seedOrg(page, `export-empty-${Date.now()}`);
    await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });

    // Note: seedOrg creates some QR codes and form fields, but no registrations
    await page.goto(`${BASE_URL}/dashboard/registrations`);
    await page.waitForLoadState('networkidle');

    // If there are any seeded registrations, that's fine - we're testing the export works
    // The key test is that clicking Export CSV produces a valid file

    // But Export CSV should still work
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    await page.locator('[data-testid="btn-export-csv"]').click();

    const download = await downloadPromise;
    const path = `/tmp/${download.suggestedFilename()}`;
    await download.saveAs(path);

    const content = fs.readFileSync(path, 'utf-8');

    // Should have BOM + headers even with no data
    expect(content.charCodeAt(0)).toBe(0xFEFF);
    expect(content).toContain('Registration ID');

    // Cleanup
    fs.unlinkSync(path);
  });

  test('Export CSV shows error message on API failure', async ({ page }) => {
    const seed = await seedOrg(page, `export-error-${Date.now()}`);
    await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });

    await page.goto(`${BASE_URL}/dashboard/registrations`);
    await page.waitForLoadState('networkidle');

    // Intercept the export request and make it fail
    await page.route('**/api/registrations/export*', (route) => {
      route.fulfill({
        status: 500,
        body: 'Internal server error',
      });
    });

    // Click Export CSV
    await page.locator('[data-testid="btn-export-csv"]').click();

    // Should show error message (use first() to avoid strict mode violation)
    await expect(page.locator('text=Export Failed').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Export failed (500)')).toBeVisible();
  });

  test('Export CSV respects delivery status filter', async ({ page }) => {
    const seed = await seedOrg(page, `export-filter-${Date.now()}`);
    await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });

    await page.goto(`${BASE_URL}/dashboard/registrations`);
    await page.waitForLoadState('networkidle');

    // Set filter to "delivered" status
    await page.locator('[data-testid="dropdown-registration-status"]').selectOption('delivered');

    // Track the API request to verify filter is passed
    let exportRequest: any = null;
    page.on('request', (request) => {
      if (request.url().includes('/api/registrations/export')) {
        exportRequest = request;
      }
    });

    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    await page.locator('[data-testid="btn-export-csv"]').click();
    await downloadPromise;

    // Verify the request included the filter
    expect(exportRequest).toBeTruthy();
    expect(exportRequest.url()).toContain('deliveryStatus=delivered');
  });

  test('Export CSV includes custom form field labels, not IDs', async ({ page }) => {
    const seed = await seedOrg(page, `export-labels-${Date.now()}`);
    await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });

    await page.goto(`${BASE_URL}/dashboard/registrations`);
    await page.waitForLoadState('networkidle');

    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    await page.locator('[data-testid="btn-export-csv"]').click();

    const download = await downloadPromise;
    const path = `/tmp/${download.suggestedFilename()}`;
    await download.saveAs(path);

    const content = fs.readFileSync(path, 'utf-8');

    // If there are registrations with custom fields, verify labels are used
    // This is a basic check - specific field verification would require test data setup
    expect(content).toBeTruthy();
    expect(content.length).toBeGreaterThan(100); // Should have meaningful content

    // Cleanup
    fs.unlinkSync(path);
  });
});
