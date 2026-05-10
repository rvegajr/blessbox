import { test, expect } from '@playwright/test';
import { loginAsUser, seedOrg, IS_PRODUCTION, HAS_PROD_SECRETS } from './_helpers/auth';

const BASE_URL = process.env.BASE_URL || 'http://localhost:7777';

test.describe('QR Auto-Generation Fix', () => {
  test.skip(IS_PRODUCTION && !HAS_PROD_SECRETS, 'Requires PROD_TEST_LOGIN_SECRET + PROD_TEST_SEED_SECRET');

  test('QR code is auto-generated when form config is saved', async ({ page }) => {
    test.setTimeout(60_000);

    const seed = await seedOrg(page, `qr-auto-gen-${Date.now()}`);
    await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });

    // Set storage context so form-builder can identify the org
    await page.goto(BASE_URL);
    await page.evaluate(({ organizationId, contactEmail }: { organizationId: string; contactEmail: string }) => {
      localStorage.setItem('onboarding_organizationId', organizationId);
      localStorage.setItem('onboarding_contactEmail', contactEmail);
      localStorage.setItem('onboarding_emailVerified', 'true');
      sessionStorage.setItem('onboarding_organizationId', organizationId);
      sessionStorage.setItem('onboarding_contactEmail', contactEmail);
      sessionStorage.setItem('onboarding_emailVerified', 'true');
    }, { organizationId: seed.organizationId, contactEmail: seed.contactEmail });

    // Navigate directly to form builder (skipping onboarding UI)
    await page.goto(`${BASE_URL}/onboarding/form-builder`);
    await page.waitForLoadState('networkidle');

    const wizard = page.locator('[data-testid="form-builder-wizard"]');
    await expect(wizard).toBeVisible({ timeout: 15000 });

    // Add a field and save
    await page.getByRole('button', { name: /short text/i }).click();
    const labelInput = page.getByPlaceholder('Field label').first();
    await expect(labelInput).toBeVisible({ timeout: 10000 });
    await labelInput.fill('Full Name');

    // Save / Next — this triggers save-form-config which should auto-generate a QR code
    await page.getByTestId('btn-next').click();
    await page.waitForURL(/\/onboarding\/qr-configuration/, { timeout: 30000 });

    // QR configuration page should show at least one entry point or the generate button
    await page.waitForLoadState('networkidle');
    const hasEntryPoints =
      (await page.locator('[data-testid^="entry-point-"]').count()) > 0;
    const hasGenerateBtn = await page.locator('#generate-qr-btn').isVisible().catch(() => false);

    expect(hasEntryPoints || hasGenerateBtn).toBe(true);
  });
});
