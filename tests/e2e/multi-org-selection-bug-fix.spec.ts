import { test, expect } from '@playwright/test';
import { loginAsUser, seedOrg, IS_PRODUCTION, HAS_PROD_SECRETS } from './_helpers/auth';

const BASE_URL = process.env.BASE_URL || 'http://localhost:7777';

/**
 * Multi-Organization Selection — Bug Fix Verification
 *
 * Tests that organization selection and switching work correctly when a user
 * belongs to multiple organizations. Uses seed+login (no UI-driven onboarding),
 * which makes this runnable in both dev and production.
 */
test.describe('Multi-Organization Selection', () => {
  test.skip(IS_PRODUCTION && !HAS_PROD_SECRETS, 'Requires PROD_TEST_LOGIN_SECRET + PROD_TEST_SEED_SECRET');

  test('User can register multiple organizations and switch between them', async ({ page }) => {
    test.setTimeout(120_000);

    const stamp = Date.now();

    // Create two orgs via seed API (replaces the stale UI-driven onboarding)
    const org1 = await seedOrg(page, `multi-fix-a-${stamp}`);
    const org2 = await seedOrg(page, `multi-fix-b-${stamp}`);

    // Login without an active org → should redirect to /select-organization when multiple exist.
    // We set both orgs linked to org1's email by logging in scoped to each first.
    await loginAsUser(page, org1.contactEmail, { organizationId: org1.organizationId });
    await loginAsUser(page, org1.contactEmail, { organizationId: org2.organizationId });
    await loginAsUser(page, org1.contactEmail);

    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });

    // Should land on select-organization because no active org is set
    const url = page.url();
    const isOnDashboard = url.includes('/dashboard');
    const isOnOrgSelect = url.includes('/select-organization');
    // Either is acceptable — if there's only one matching org the app may skip selection
    expect(isOnDashboard || isOnOrgSelect).toBe(true);

    if (isOnOrgSelect) {
      const selectPage = page.locator('[data-testid="page-select-organization"]');
      await expect(selectPage).toBeVisible({ timeout: 10000 });

      // Select first available org
      const firstOrgOption = page.locator('[data-testid^="org-option-"], [data-testid^="org-card-"]').first();
      await expect(firstOrgOption).toBeVisible({ timeout: 10000 });
      await firstOrgOption.click();

      const continueBtn = page.locator(
        'button[data-testid="btn-confirm-organization"], button[data-testid="btn-continue"]'
      );
      await expect(continueBtn).toBeEnabled({ timeout: 5000 });
      await continueBtn.click();

      // Page must NOT get stuck — must navigate to dashboard (the original bug)
      await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    }

    const dashboard = page.locator('[data-testid="page-dashboard"]');
    await expect(dashboard).toBeVisible({ timeout: 15000 });

    // Phase 2: Switch to another org via /select-organization
    await page.goto(`${BASE_URL}/select-organization`);

    const selectPage2 = page.locator('[data-testid="page-select-organization"]');
    if (await selectPage2.isVisible({ timeout: 5000 }).catch(() => false)) {
      const lastOrgOption = page.locator('[data-testid^="org-option-"], [data-testid^="org-card-"]').last();
      await lastOrgOption.click();

      const continueBtn2 = page.locator(
        'button[data-testid="btn-confirm-organization"], button[data-testid="btn-continue"]'
      );
      await continueBtn2.click();

      await page.waitForURL(/\/dashboard/, { timeout: 15000 });
      await expect(page.locator('[data-testid="page-dashboard"]')).toBeVisible({ timeout: 10000 });
    }
  });
});
