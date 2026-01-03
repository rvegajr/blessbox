import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:7777';
const TEST_ENV = process.env.TEST_ENV || 'local';
const IS_PRODUCTION = TEST_ENV === 'production' || /blessbox\.org/i.test(BASE_URL);
const PROD_TEST_SEED_SECRET = process.env.PROD_TEST_SEED_SECRET || '';
const HAS_PROD_SEED = !!PROD_TEST_SEED_SECRET;

test.describe('Form Builder Regression (navigation/preview/persistence)', () => {
  test.beforeEach(async ({ page, request }) => {
    // Seed a real organization so save-form-config can succeed even in production.
    let organizationId = 'org_test_local';
    let contactEmail = 'local-test@example.com';

    if (IS_PRODUCTION) {
      if (!HAS_PROD_SEED) throw new Error('Production regression tests require PROD_TEST_SEED_SECRET');
      const resp = await request.post(`${BASE_URL}/api/test/seed-prod`, {
        headers: { 'x-qa-seed-token': PROD_TEST_SEED_SECRET },
        data: { seedKey: `form-regression-${Date.now()}` },
      });
      expect(resp.ok()).toBeTruthy();
      const seed = await resp.json();
      expect(seed.success).toBe(true);
      organizationId = seed.organizationId;
      contactEmail = seed.contactEmail;
    } else {
      // Local/dev: use local test seeding endpoint so organizationId is valid
      const resp = await request.post(`${BASE_URL}/api/test/seed`, {
        data: { seedKey: `form-regression-${Date.now()}` },
      });
      expect(resp.ok()).toBeTruthy();
      const seed = await resp.json();
      expect(seed.success).toBe(true);
      organizationId = seed.organizationId;
      contactEmail = seed.contactEmail;
    }

    await page.goto(BASE_URL);
    await page.evaluate(
      ({ organizationId, contactEmail }) => {
        sessionStorage.clear();
        // Bypass onboarding redirects with a valid org
        sessionStorage.setItem('onboarding_organizationId', organizationId);
        sessionStorage.setItem('onboarding_contactEmail', contactEmail);
        sessionStorage.setItem('onboarding_emailVerified', 'true');
      },
      { organizationId, contactEmail }
    );
  });

  test('Prev/Next works, Preview opens, data persists across navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/onboarding/form-builder`);
    await page.waitForLoadState('networkidle');

    // Preview modal should open (regression for "Preview feature coming soon!" alert)
    await page.getByRole('button', { name: /preview form/i }).click();
    await expect(page.getByText('Form Preview')).toBeVisible();
    // Close preview
    await page.getByTestId('form-preview-close').click();
    await expect(page.getByText('Form Preview')).toBeHidden();

    // Add a field and set label
    await page.getByTestId('form-builder-wizard').getByRole('button', { name: /short text/i }).click();
    const labelInput = page.getByPlaceholder('Field label').first();
    await expect(labelInput).toBeVisible();
    await labelInput.fill('Full Name');
    await expect(page.locator('input[value="Full Name"]').first()).toBeVisible();

    // Next should navigate to QR configuration (regression for non-working Next)
    await page.getByTestId('btn-next').click();
    await page.waitForURL(/\/onboarding\/qr-configuration/, { timeout: 20000 });

    // Navigate back to form builder and ensure the field is still present (persistence regression)
    await page.goto(`${BASE_URL}/onboarding/form-builder`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('input[value="Full Name"]').first()).toBeVisible();
  });

  test('Help drawer quick links point to non-404 routes', async ({ page }) => {
    await page.goto(`${BASE_URL}/onboarding/form-builder`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /open help/i }).click();
    await expect(page.getByTestId('help-drawer')).toBeVisible();

    await expect(page.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard');
    await expect(page.getByRole('link', { name: /contact support/i })).toHaveAttribute('href', /mailto:support@blessbox\.org/i);
    await expect(page.getByRole('link', { name: /pricing/i })).toHaveAttribute('href', '/pricing');
  });
});

