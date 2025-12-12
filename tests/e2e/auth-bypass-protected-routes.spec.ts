import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:7777';
const TEST_ENV = process.env.TEST_ENV || 'local';
const IS_PRODUCTION = TEST_ENV === 'production' || /blessbox\.org/i.test(BASE_URL);

const PROD_TEST_LOGIN_SECRET = process.env.PROD_TEST_LOGIN_SECRET || '';
const PROD_TEST_SEED_SECRET = process.env.PROD_TEST_SEED_SECRET || '';
const HAS_PROD_SECRETS = !!(PROD_TEST_LOGIN_SECRET && PROD_TEST_SEED_SECRET);

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

async function seedOrg(page: any, seedKey: string) {
  if (IS_PRODUCTION) {
    if (!HAS_PROD_SECRETS) throw new Error('Production seeding requires PROD_TEST_SEED_SECRET');
    const resp = await page.request.post(`${BASE_URL}/api/test/seed-prod`, {
      headers: { 'x-test-seed-secret': PROD_TEST_SEED_SECRET },
      data: { seedKey },
    });
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.success).toBe(true);
    return data;
  }

  const resp = await page.request.post(`${BASE_URL}/api/test/seed`, { data: { seedKey } });
  expect(resp.ok()).toBeTruthy();
  const data = await resp.json();
  expect(data.success).toBe(true);
  return data;
}

async function loginAsUser(page: any, email: string, opts?: { organizationId?: string; admin?: boolean }) {
  if (IS_PRODUCTION) {
    if (!HAS_PROD_SECRETS) throw new Error('Production login requires PROD_TEST_LOGIN_SECRET');
    const resp = await page.request.post(`${BASE_URL}/api/test/login`, {
      headers: { 'x-test-login-secret': PROD_TEST_LOGIN_SECRET },
      data: { email, organizationId: opts?.organizationId, admin: !!opts?.admin, expiresIn: 3600 },
    });
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body.success).toBe(true);
    return body;
  }

  await setCookieSession(page, [
    { name: 'bb_test_auth', value: '1' },
    { name: 'bb_test_email', value: email },
    ...(opts?.organizationId ? [{ name: 'bb_test_org_id', value: opts.organizationId }] : []),
    ...(opts?.admin ? [{ name: 'bb_test_admin', value: '1' }] : []),
  ]);
}

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

