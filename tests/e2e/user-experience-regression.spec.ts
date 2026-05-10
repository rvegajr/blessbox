/**
 * User Experience Regression Tests
 *
 * The original 7-step serial chain (onboarding → QR → registration → dashboard →
 * check-in → payment → verify) has been removed. Those flows are now covered by:
 *   - onboarding-flow.spec.ts         (onboarding + QR generation)
 *   - bug-fixes-verification.spec.ts  (dashboard pages + QR code management)
 *   - qa-testing-guide-coverage.spec.ts (dashboard stats + coupon validation)
 *   - qr-checkin-complete-flow.spec.ts  (attendee registration + check-in)
 *
 * What remains here are two standalone regressions that don't fit elsewhere.
 */

import { test, expect } from '@playwright/test';
import { loginAsUser, seedOrg, IS_PRODUCTION, HAS_PROD_SECRETS } from './_helpers/auth';

const BASE_URL = process.env.BASE_URL || 'http://localhost:7777';

/**
 * Regression: closing a registration page tab must not redirect the main window to /onboarding.
 * (Bug from 2026-01-08 user walkthrough: opening a QR registration link in a new tab and
 * closing it caused the original window to lose its session and land on onboarding.)
 */
test.describe('QR Registration Redirect Regression', () => {
  test.skip(IS_PRODUCTION && !HAS_PROD_SECRETS, 'Requires PROD_TEST_SEED_SECRET + PROD_TEST_LOGIN_SECRET');

  test('Closing a registration tab does not redirect the main window to onboarding', async ({ page, context }) => {
    const seed = await seedOrg(page, `redirect-regression-${Date.now()}`);
    await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });

    // Land on dashboard
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).not.toContain('/login');
    expect(page.url()).not.toContain('/onboarding');

    // Open registration page in a new tab (simulates attendee scanning QR)
    const regPage = await context.newPage();
    await regPage.goto(seed.registrationUrl);
    await regPage.waitForLoadState('domcontentloaded');
    await regPage.close();

    // Main window must still be authenticated and NOT on onboarding
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('domcontentloaded');

    const afterUrl = page.url();
    expect(afterUrl).not.toContain('/onboarding');
    expect(afterUrl).not.toContain('/organization-setup');
    expect(afterUrl).not.toContain('/login');
  });
});

/**
 * Regression: Square CSP blocks the payment iframe in production.
 * Kept as a documented skip rather than a fixme so the skip reason is visible in reports.
 */
test.describe('Payment Authorization', () => {
  test.skip(
    true,
    'Square Web SDK requires unsafe-eval, which the prod CSP intentionally blocks. ' +
    'Run against localhost with Square sandbox credentials: BASE_URL=http://localhost:7777'
  );

  test('Payment with SAVE20 coupon should process correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout?plan=standard`, { waitUntil: 'domcontentloaded' });

    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await emailInput.fill('payment-test@blessbox.org');
    }

    const couponInput = page.locator('input[id="coupon"], input[placeholder*="coupon" i]').first();
    if (await couponInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await couponInput.fill('SAVE20');
      const applyBtn = page.locator('button:has-text("Apply")').first();
      if (await applyBtn.isVisible()) {
        await applyBtn.click();
        await page.waitForTimeout(2000);
      }
    }

    const priceText = page.locator('text=/\\$15\\.20|\\$1\\d/');
    await expect(priceText).toBeVisible({ timeout: 5000 });

    const squareForm = page.locator('#card-container, iframe[src*="square"]');
    await expect(squareForm).toBeVisible({ timeout: 10000 });
  });
});
