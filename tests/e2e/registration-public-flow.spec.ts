import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:7777';
const TEST_ENV = process.env.TEST_ENV || 'local';
const IS_PRODUCTION = TEST_ENV === 'production' || /blessbox\.org/i.test(BASE_URL);

const PROD_TEST_SEED_SECRET = process.env.PROD_TEST_SEED_SECRET || '';
const HAS_PROD_SEED = !!PROD_TEST_SEED_SECRET;

async function seedOrg(request: any, seedKey: string) {
  if (IS_PRODUCTION) {
    if (!HAS_PROD_SEED) throw new Error('Production seeding requires PROD_TEST_SEED_SECRET');
    const resp = await request.post(`${BASE_URL}/api/test/seed-prod`, {
      headers: { 'x-qa-seed-token': PROD_TEST_SEED_SECRET },
      data: { seedKey },
    });
    expect(resp.ok()).toBeTruthy();
    const seed = await resp.json();
    expect(seed.success).toBe(true);
    return seed;
  }

  const resp = await request.post(`${BASE_URL}/api/test/seed`, { data: { seedKey } });
  expect(resp.ok()).toBeTruthy();
  const seed = await resp.json();
  expect(seed.success).toBe(true);
  return seed;
}

test.describe('Public registration flow (seeded)', () => {
  test('User can load dynamic form and submit registration', async ({ page, request }) => {
    // Seed
    const seed = await seedOrg(request, `reg-${Date.now()}`);

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

