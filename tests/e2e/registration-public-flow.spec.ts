import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:7777';

test.describe('Public registration flow (seeded)', () => {
  test('User can load dynamic form and submit registration', async ({ page, request }) => {
    // Seed
    const seedResp = await request.post(`${BASE_URL}/api/test/seed`, {
      data: { seedKey: `reg-${Date.now()}` },
    });
    expect(seedResp.ok()).toBeTruthy();
    const seed = await seedResp.json();
    expect(seed.success).toBe(true);

    const orgSlug = seed.orgSlug;
    const qrLabel = 'main-entrance';

    await page.goto(`${BASE_URL}/register/${orgSlug}/${qrLabel}`);
    await page.waitForLoadState('networkidle');

    // Form fields from default seed
    await page.getByLabel(/first name/i).fill('Playwright');
    await page.getByLabel(/last name/i).fill('User');
    await page.getByLabel(/^email/i).fill(`pw-user-${Date.now()}@example.com`);

    await page.getByTestId('registration-submit').click();
    await expect(page.getByText(/registration submitted!/i)).toBeVisible({ timeout: 10000 });
  });
});

