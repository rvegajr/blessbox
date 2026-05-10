import { test, expect } from '@playwright/test';
import { loginAsUser, seedOrg } from './_helpers/auth';

const BASE_URL = process.env.BASE_URL || 'http://localhost:7777';

test.describe('Form Builder Regression (navigation/preview/persistence)', () => {
  test.beforeEach(async ({ page }) => {
    const seed = await seedOrg(page, `form-regression-${Date.now()}`);
    await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });
    // Form builder also reads org context from storage
    await page.goto(BASE_URL);
    await page.evaluate(({ organizationId, contactEmail }: { organizationId: string; contactEmail: string }) => {
      localStorage.setItem('onboarding_organizationId', organizationId);
      localStorage.setItem('onboarding_contactEmail', contactEmail);
      localStorage.setItem('onboarding_emailVerified', 'true');
      sessionStorage.setItem('onboarding_organizationId', organizationId);
      sessionStorage.setItem('onboarding_contactEmail', contactEmail);
      sessionStorage.setItem('onboarding_emailVerified', 'true');
    }, { organizationId: seed.organizationId, contactEmail: seed.contactEmail });
  });

  test('Prev/Next works, Preview opens, data persists across navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/onboarding/form-builder`);
    await page.waitForLoadState('networkidle');
    
    // Wait for form builder to fully load
    await page.waitForSelector('[data-testid="form-builder-wizard"]', { timeout: 10000 });
    await page.waitForSelector('[data-testid="btn-preview-form"]', { timeout: 10000 });

    // Preview modal should open (regression for "Preview feature coming soon!" alert)
    await page.getByTestId('btn-preview-form').click();
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
    // Click Next and wait for navigation - handleSave() will save and navigate
    // First, wait for any loading states to clear
    await page.waitForLoadState('networkidle');
    
    // Click Next button
    await page.getByTestId('btn-next').click();
    
    // Wait for either navigation or error message
    await Promise.race([
      page.waitForURL(/\/onboarding\/qr-configuration/, { timeout: 30000 }),
      page.waitForSelector('[role="alert"], .error, [data-testid*="error"]', { timeout: 5000 }).then(async () => {
        const errorText = await page.textContent('body');
        throw new Error(`Save failed with error: ${errorText?.substring(0, 200)}`);
      }),
    ]);

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

