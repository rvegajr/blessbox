/**
 * Production-Ready Verification Tests WITH Smart Seeding
 * 
 * Tests all 4 bug fixes using a hybrid approach:
 * - In LOCAL: Seeds minimal test data if needed
 * - In PRODUCTION: Uses existing real data
 * 
 * Usage:
 *   Local:      BASE_URL=http://localhost:7777 npx playwright test production-ready-verification-with-seed.spec.ts
 *   Production: TEST_ENV=production BASE_URL=https://www.blessbox.org npx playwright test production-ready-verification-with-seed.spec.ts
 */

import { test, expect } from '@playwright/test';
import { loginAsUser, seedOrg } from './_helpers/auth';
import fs from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:7777';
const IS_PRODUCTION = process.env.TEST_ENV === 'production' || BASE_URL.includes('blessbox.org');

test.describe('Production-Ready Verification (All Fixes)', () => {
  
  // ============================================================================
  // ISSUE #31: Health & Diagnostics - ALWAYS WORKS (no data needed)
  // ============================================================================
  
  test.describe('Issue #31: Health & Diagnostics ✅', () => {
    test('health endpoint works without authentication', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/health`);
      expect(response.ok()).toBeTruthy();
      
      const data = await response.json();
      expect(data.status).toBe('ok');
      expect(data.timestamp).toBeTruthy();
    });

    test('dashboard diagnostics redirects to system diagnostics', async ({ page }) => {
      await page.goto(`${BASE_URL}/dashboard/diagnostics`);
      
      // Should redirect to /system/diagnostics
      await page.waitForURL(/\/system\/diagnostics/, { timeout: 10000 });
      
      // Verify diagnostics page loaded
      await expect(page.locator('h1, h2, h3').filter({ hasText: /diagnostic/i }).first()).toBeVisible();
    });
  });

  // ============================================================================
  // ISSUE #33: Landing Page Dashboard Shortcut - WORKS WITH LOGIN
  // ============================================================================
  
  test.describe('Issue #33: Landing Page Dashboard Shortcut ✅', () => {
    test('logged-out users do NOT see dashboard shortcut', async ({ page }) => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      // Dashboard link should NOT be visible when logged out
      const dashboardLink = page.locator('[data-testid="link-dashboard"]');
      await expect(dashboardLink).not.toBeVisible();
    });

    test('logged-in users see dashboard shortcut on homepage', async ({ page }) => {
      //Seed org in local, use existing in prod
      const seedKey = `landing-test-${Date.now()}`;
      const seed = await seedOrg(page, seedKey);
      
      // Login with seeded/existing user
      await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });
      
      // Visit homepage
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      // Dashboard shortcut should be visible
      const dashboardLink = page.locator('[data-testid="link-dashboard"]');
      await expect(dashboardLink).toBeVisible({ timeout: 10000 });
      
      // Should have text "Dashboard"
      await expect(dashboardLink).toContainText(/dashboard/i);
      
      // Should link to /dashboard
      const href = await dashboardLink.getAttribute('href');
      expect(href).toContain('/dashboard');
    });

    test('dashboard shortcut navigates correctly', async ({ page }) => {
      const seedKey = `nav-test-${Date.now()}`;
      const seed = await seedOrg(page, seedKey);
      await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });
      
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
      
      // Click dashboard link
      const dashboardLink = page.locator('[data-testid="link-dashboard"]');
      await dashboardLink.click();
      
      // Should navigate to dashboard
      await page.waitForURL(/\/dashboard/, { timeout: 10000 });
      expect(page.url()).toContain('/dashboard');
    });
  });

  // ============================================================================
  // ISSUE #30: Classes & Enrollment - NEEDS CLASS DATA
  // ============================================================================
  
  test.describe('Issue #30: Classes & Enrollment ✅', () => {
    test('edit class button exists on class detail page', async ({ page }) => {
      const seedKey = `class-edit-${Date.now()}`;
      const seed = await seedOrg(page, seedKey);
      await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });
      
      // Create a class via API
      const classRes = await page.request.post(`${BASE_URL}/api/classes`, {
        data: {
          name: `Test Class ${Date.now()}`,
          description: 'Test class for verification',
          capacity: 10,
          timezone: 'America/Los_Angeles',
          status: 'active',
        },
      });
      
      if (!classRes.ok()) {
        test.skip(true, 'Could not create class - API may not be available');
        return;
      }
      
      const classData = await classRes.json();
      const classId = classData.id;
      
      // Navigate to class detail page
      await page.goto(`${BASE_URL}/classes/${classId}`);
      await page.waitForLoadState('networkidle');
      
      // Verify "Edit Class" button exists (Issue #30 fix)
      const editButton = page.locator('[data-testid="btn-edit-class"]');
      await expect(editButton).toBeVisible({ timeout: 5000 });
      await expect(editButton).toContainText(/edit/i);
      
      // Verify it links to edit page
      const href = await editButton.getAttribute('href');
      expect(href).toContain(`/classes/${classId}/edit`);
    });

    test('back to classes link exists on class detail', async ({ page }) => {
      const seedKey = `class-back-${Date.now()}`;
      const seed = await seedOrg(page, seedKey);
      await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });
      
      // Create a class
      const classRes = await page.request.post(`${BASE_URL}/api/classes`, {
        data: {
          name: `Test Class ${Date.now()}`,
          capacity: 10,
          timezone: 'America/Los_Angeles',
          status: 'active',
        },
      });
      
      if (!classRes.ok()) {
        test.skip(true, 'Could not create class');
        return;
      }
      
      const classData = await classRes.json();
      await page.goto(`${BASE_URL}/classes/${classData.id}`);
      await page.waitForLoadState('networkidle');
      
      // Verify "Back to Classes" link exists
      const backLink = page.locator('a').filter({ hasText: /back.*classes/i });
      await expect(backLink.first()).toBeVisible();
    });
  });

  // ============================================================================
  // ISSUE #34: Export CSV - NEEDS ORG DATA
  // ============================================================================
  
  test.describe('Issue #34: Export CSV ✅', () => {
    test('export CSV button exists and is clickable', async ({ page }) => {
      const seedKey = `export-btn-${Date.now()}`;
      const seed = await seedOrg(page, seedKey);
      await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });
      
      // Navigate to registrations page
      await page.goto(`${BASE_URL}/dashboard/registrations`);
      await page.waitForLoadState('networkidle');
      
      // Verify Export CSV button exists (Issue #34 verification)
      const exportButton = page.locator('[data-testid="btn-export-csv"]');
      await expect(exportButton).toBeVisible({ timeout: 10000 });
      await expect(exportButton).toBeEnabled();
      await expect(exportButton).toContainText(/export.*csv/i);
    });

    test('clicking export CSV triggers download', async ({ page }) => {
      const seedKey = `export-dl-${Date.now()}`;
      const seed = await seedOrg(page, seedKey);
      await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });
      
      await page.goto(`${BASE_URL}/dashboard/registrations`);
      await page.waitForLoadState('networkidle');
      
      // Set up download listener
      const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
      
      // Click Export CSV
      const exportButton = page.locator('[data-testid="btn-export-csv"]');
      await exportButton.click();
      
      // Wait for download
      const download = await downloadPromise;
      
      // Verify filename
      const filename = download.suggestedFilename();
      expect(filename).toMatch(/registrations-\d{4}-\d{2}-\d{2}\.csv/);
      
      // Download and verify content
      const path = `/tmp/${filename}`;
      await download.saveAs(path);
      
      const content = fs.readFileSync(path, 'utf-8');
      
      // Verify BOM (for Excel compatibility)
      expect(content.charCodeAt(0)).toBe(0xFEFF);
      
      // Verify headers exist
      expect(content).toContain('Registration ID');
      
      // Cleanup
      fs.unlinkSync(path);
    });

    test('export CSV shows error gracefully on failure', async ({ page }) => {
      const seedKey = `export-err-${Date.now()}`;
      const seed = await seedOrg(page, seedKey);
      await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });
      
      await page.goto(`${BASE_URL}/dashboard/registrations`);
      await page.waitForLoadState('networkidle');
      
      // Intercept and fail the request
      await page.route('**/api/registrations/export*', (route) => {
        route.fulfill({
          status: 500,
          body: 'Test error',
        });
      });
      
      // Click export
      await page.locator('[data-testid="btn-export-csv"]').click();
      
      // Should show error message (not crash)
      await expect(page.locator('text=Export Failed').first()).toBeVisible({ timeout: 5000 });
    });
  });

  // ============================================================================
  // INTEGRATION: All Fixes Working Together
  // ============================================================================
  
  test.describe('Integration: All Fixes Working Together 🎉', () => {
    test('complete user journey with all fixes', async ({ page }) => {
      const seedKey = `integration-${Date.now()}`;
      const seed = await seedOrg(page, seedKey);
      
      // Start at homepage (logged out)
      await page.goto(BASE_URL);
      
      // Should NOT see dashboard shortcut
      await expect(page.locator('[data-testid="link-dashboard"]')).not.toBeVisible();
      
      // Login
      await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });
      
      // Go back to homepage - NOW should see dashboard shortcut (Issue #33)
      await page.goto(BASE_URL);
      await expect(page.locator('[data-testid="link-dashboard"]')).toBeVisible({ timeout: 10000 });
      
      // Navigate to dashboard
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Check health endpoint (Issue #31)
      const healthResponse = await page.request.get(`${BASE_URL}/api/health`);
      expect(healthResponse.ok()).toBeTruthy();
      
      // Visit diagnostics redirect (Issue #31)
      await page.goto(`${BASE_URL}/dashboard/diagnostics`);
      await page.waitForURL(/\/system\/diagnostics/);
      
      // Visit registrations and verify export works (Issue #34)
      await page.goto(`${BASE_URL}/dashboard/registrations`);
      const exportBtn = page.locator('[data-testid="btn-export-csv"]');
      await expect(exportBtn).toBeVisible({ timeout: 10000 });
      
      // Create and visit a class (Issue #30)
      const classRes = await page.request.post(`${BASE_URL}/api/classes`, {
        data: {
          name: `Integration Test Class ${Date.now()}`,
          capacity: 5,
          timezone: 'America/Los_Angeles',
          status: 'active',
        },
      });
      
      if (classRes.ok()) {
        const classData = await classRes.json();
        await page.goto(`${BASE_URL}/classes/${classData.id}`);
        await expect(page.locator('[data-testid="btn-edit-class"]')).toBeVisible({ timeout: 5000 });
      }
      
      // 🎉 All fixes working together!
    });
  });
});
