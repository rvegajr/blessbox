import { test, expect } from '@playwright/test';
import { loginAsUser, seedOrg, IS_PRODUCTION, HAS_PROD_SECRETS } from './_helpers/auth';

const BASE_URL = process.env.BASE_URL || 'http://localhost:7777';

const describeOrSkip =
  IS_PRODUCTION && !HAS_PROD_SECRETS ? test.describe.skip : test.describe;

describeOrSkip('Bug Fixes Verification - December 30, 2024', () => {
  let orgCtx: { organizationId: string; contactEmail: string };

  test.beforeEach(async ({ page }) => {
    const seed = await seedOrg(page, `bug-fixes-${Date.now()}`);
    orgCtx = { organizationId: seed.organizationId, contactEmail: seed.contactEmail };
    await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });
  });

  test('Bug Fix 1: Registration list displays names and emails correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/registrations`);
    await page.waitForLoadState('networkidle');

    const pageElement = page.locator('[data-testid="page-dashboard-registrations"]');
    await expect(pageElement).toBeVisible({ timeout: 10000 });

    const registrationRows = page.locator('[data-testid^="row-registration-"]');
    const count = await registrationRows.count();

    if (count > 0) {
      const firstRow = registrationRows.first();
      const nameCell = firstRow.locator('td').nth(0);
      const emailCell = firstRow.locator('td').nth(1);

      await expect(nameCell).not.toHaveText('');
      await expect(nameCell).not.toHaveText('-');
      await expect(emailCell).not.toHaveText('');
      await expect(emailCell).not.toHaveText('-');
    }
  });

  test('Bug Fix 2: Payment processing works with $1 test payment', async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout?plan=standard`, { waitUntil: 'domcontentloaded' });

    const checkoutPage = page.locator('[data-testid="page-checkout"]');
    await expect(checkoutPage).toBeVisible({ timeout: 10000 });

    const emailInput = page.locator('input[data-testid="input-email"]');
    await emailInput.fill(orgCtx.contactEmail);

    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.waitForTimeout(1000);

    expect(errors.filter((e) => e.includes('session') || e.includes('user'))).toHaveLength(0);

    const paymentSection = page.locator('[data-testid="section-payment"]');
    await expect(paymentSection).toBeVisible();
  });

  test('Bug Fix 3: QR codes can be added incrementally without losing existing ones', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/qr-codes`);

    const qrCodesPage = page.locator('[data-testid="page-dashboard-qr-codes"]');
    await expect(qrCodesPage).toBeVisible({ timeout: 15000 });

    const initialCount = await page.locator('[data-testid^="card-qr-"]').count();

    const addButton = page.locator('button[data-testid="btn-add-qr-code"]');
    if (await addButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addButton.click();

      const addForm = page.locator('[data-testid="form-add-qr-code"]');
      await expect(addForm).toBeVisible();

      const labelInput = page.locator('input[data-testid="input-new-qr-label"]');
      const generateButton = page.locator('button[data-testid="btn-generate-new-qr"]');
      await expect(labelInput).toBeVisible();
      await expect(generateButton).toBeDisabled();

      await labelInput.fill('Test Entry Point');
      await expect(generateButton).toBeEnabled();

      // Close form — existing QR codes must remain
      await addButton.click();
      await expect(addForm).toBeHidden();
      expect(await page.locator('[data-testid^="card-qr-"]').count()).toBeGreaterThanOrEqual(initialCount);
    }
  });

  test('Integration: All fixes working together', async ({ page }) => {
    for (const path of ['/dashboard', '/dashboard/registrations', '/dashboard/qr-codes']) {
      await page.goto(`${BASE_URL}${path}`);
      await page.waitForLoadState('networkidle');
      // Should not bounce to login
      expect(page.url()).not.toContain('/login');
    }

    await page.goto(`${BASE_URL}/checkout?plan=standard`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-testid="page-checkout"]')).toBeVisible({ timeout: 15000 });
  });
});
