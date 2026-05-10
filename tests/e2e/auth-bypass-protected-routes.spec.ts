import { test, expect } from '@playwright/test';
import { loginAsUser, seedOrg } from './_helpers/auth';

const BASE_URL = process.env.BASE_URL || 'http://localhost:7777';

test.describe('Protected routes are testable (QA auth)', () => {
  test('Dashboard + Classes + Admin load with test auth', async ({ page }) => {
    test.setTimeout(120_000);

    // Seed org + set as current user
    const seed = await seedOrg(page, `auth-${Date.now()}`);
    await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });

    await page.goto(`${BASE_URL}/dashboard`);
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 15000 });

    await page.goto(`${BASE_URL}/dashboard/qr-codes`);
    await expect(page.getByRole('heading', { name: 'QR Codes', exact: true })).toBeVisible({ timeout: 15000 });

    await page.goto(`${BASE_URL}/dashboard/registrations`);
    await expect(page.getByRole('heading', { name: 'Registrations', exact: true })).toBeVisible({ timeout: 15000 });

    await page.goto(`${BASE_URL}/classes`);
    // ClassList doesn't have a stable heading; ensure we didn't get bounced to home.
    await expect(page).not.toHaveURL(new RegExp(`${BASE_URL}/$`));

    await page.goto(`${BASE_URL}/classes/new`);
    await expect(page).not.toHaveURL(new RegExp(`${BASE_URL}/$`));

    // Switch to super-admin for admin pages
    await loginAsUser(page, 'admin@blessbox.app', { admin: true });

    await page.goto(`${BASE_URL}/admin`);
    await expect(page.getByRole('heading', { name: /admin panel/i })).toBeVisible({ timeout: 15000 });
  });
});

