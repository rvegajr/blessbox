import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:7777';

async function setCookieSession(page: any, cookies: Array<{ name: string; value: string }>) {
  const url = BASE_URL.startsWith('http') ? BASE_URL : `http://${BASE_URL}`;
  await page.context().addCookies(
    cookies.map((c) => ({
      name: c.name,
      value: c.value,
      url,
    }))
  );
}

test.describe('Protected routes are testable (test auth cookie)', () => {
  test('Dashboard + Classes + Admin load with test auth', async ({ page }) => {
    test.setTimeout(120_000);

    // Seed org + set as current user
    const seedResp = await page.request.post(`${BASE_URL}/api/test/seed`, { data: { seedKey: `auth-${Date.now()}` } });
    expect(seedResp.ok()).toBeTruthy();
    const seed = await seedResp.json();
    expect(seed.success).toBe(true);

    await setCookieSession(page, [
      { name: 'bb_test_auth', value: '1' },
      { name: 'bb_test_email', value: seed.contactEmail },
      { name: 'bb_test_org_id', value: seed.organizationId },
    ]);

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
    await setCookieSession(page, [
      { name: 'bb_test_auth', value: '1' },
      { name: 'bb_test_email', value: 'admin@blessbox.app' },
      { name: 'bb_test_admin', value: '1' },
    ]);

    await page.goto(`${BASE_URL}/admin`);
    await expect(page.getByRole('heading', { name: /admin panel/i })).toBeVisible({ timeout: 15000 });
  });
});

