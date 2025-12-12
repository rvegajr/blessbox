import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:7777';

test.describe('Form Builder Regression (navigation/preview/persistence)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      sessionStorage.clear();
      // Bypass onboarding redirects
      sessionStorage.setItem('onboarding_organizationId', 'org_test_local');
      sessionStorage.setItem('onboarding_emailVerified', 'true');
    });
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
    await page.getByRole('button', { name: /short text/i }).click();
    const labelInput = page.getByPlaceholder('Field label').first();
    await expect(labelInput).toBeVisible();
    await labelInput.fill('Full Name');
    await expect(page.locator('input[value="Full Name"]').first()).toBeVisible();

    // Next should navigate to QR configuration (regression for non-working Next)
    await page.getByTestId('next-button').click();
    await page.waitForURL(/\/onboarding\/qr-configuration/, { timeout: 10000 });

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

