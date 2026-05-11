import { test, expect } from '@playwright/test';
import { seedOrg, IS_PRODUCTION, HAS_PROD_SEED } from './_helpers/auth';

const BASE_URL = process.env.BASE_URL || 'http://localhost:7777';

test.describe('Public registration flow (seeded)', () => {
  test('User can load dynamic form and submit registration', async ({ page }) => {
    test.skip(IS_PRODUCTION && !HAS_PROD_SEED, 'Requires PROD_TEST_SEED_SECRET');

    // Seed using shared helper — normalizes PROD_TEST_SEED_SECRET to avoid literal \n mismatch
    const seed = await seedOrg(page, `reg-${Date.now()}`);

    const orgSlug = seed.orgSlug;
    const qrLabel = seed.qrCodes?.[0]?.label || 'main-entrance';

    await page.goto(`${BASE_URL}/register/${orgSlug}/${qrLabel}`);
    await page.waitForLoadState('networkidle');

    // Form fields from default seed
    await page.getByLabel(/first name/i).fill('Playwright');
    await page.getByLabel(/last name/i).fill('User');
    await page.getByLabel(/^email/i).fill(`pw-user-${Date.now()}@example.com`);

    await page.getByTestId('btn-submit-registration').click();
    // Successful submission redirects to /registration-success?id=...
    await page.waitForURL(/\/registration-success/, { timeout: 15000 });
  });
});

