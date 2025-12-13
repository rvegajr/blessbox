import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:7777';
const TEST_ENV = process.env.TEST_ENV || 'local';
const IS_PRODUCTION = TEST_ENV === 'production' || /blessbox\.org/i.test(BASE_URL);

const PROD_TEST_LOGIN_SECRET = process.env.PROD_TEST_LOGIN_SECRET || '';
const PROD_TEST_SEED_SECRET = process.env.PROD_TEST_SEED_SECRET || '';
const HAS_PROD_SECRETS = !!(PROD_TEST_LOGIN_SECRET && PROD_TEST_SEED_SECRET);

async function seedOrg(
  page: any,
  params: { seedKey: string; contactEmail: string; organizationName: string; orgSlug: string }
) {
  if (IS_PRODUCTION) {
    if (!HAS_PROD_SECRETS) throw new Error('Production seeding requires PROD_TEST_SEED_SECRET');
    const resp = await page.request.post(`${BASE_URL}/api/test/seed-prod`, {
      headers: { 'x-test-seed-secret': PROD_TEST_SEED_SECRET },
      data: {
        seedKey: params.seedKey,
        contactEmail: params.contactEmail,
        organizationName: params.organizationName,
        orgSlug: params.orgSlug,
        seedSubscription: false,
        seedClasses: false,
      },
    });
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.success).toBe(true);
    return data;
  }

  const resp = await page.request.post(`${BASE_URL}/api/test/seed`, {
    data: {
      seedKey: params.seedKey,
      contactEmail: params.contactEmail,
      organizationName: params.organizationName,
      orgSlug: params.orgSlug,
      seedSubscription: false,
      seedClasses: false,
    },
  });
  expect(resp.ok()).toBeTruthy();
  const data = await resp.json();
  expect(data.success).toBe(true);
  return data;
}

async function login(page: any, email: string, opts?: { organizationId?: string }) {
  if (IS_PRODUCTION) {
    if (!HAS_PROD_SECRETS) throw new Error('Production login requires PROD_TEST_LOGIN_SECRET');
    const resp = await page.request.post(`${BASE_URL}/api/test/login`, {
      headers: { 'x-test-login-secret': PROD_TEST_LOGIN_SECRET },
      data: { email, organizationId: opts?.organizationId, expiresIn: 3600 },
    });
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body.success).toBe(true);
    return body;
  }

  const resp = await page.request.post(`${BASE_URL}/api/test/login`, {
    data: { email, organizationId: opts?.organizationId, expiresIn: 3600 },
  });
  expect(resp.ok()).toBeTruthy();
  const body = await resp.json();
  expect(body.success).toBe(true);
  return body;
}

test.describe('Multi-org per email: organization selection', () => {
  test('User is prompted to select organization when multiple exist', async ({ page }) => {
    test.setTimeout(120_000);

    const stamp = Date.now();
    const email = `qa-multi-org-${stamp}@blessbox.app`;

    const orgA = await seedOrg(page, {
      seedKey: `multi-a-${stamp}`,
      contactEmail: email,
      organizationName: `Multi Org A (${stamp})`,
      orgSlug: `multi-org-a-${stamp}`,
    });
    const orgB = await seedOrg(page, {
      seedKey: `multi-b-${stamp}`,
      contactEmail: email,
      organizationName: `Multi Org B (${stamp})`,
      orgSlug: `multi-org-b-${stamp}`,
    });

    // Ensure memberships exist for both orgs (by logging in scoped to each).
    await login(page, email, { organizationId: orgA.organizationId });
    await login(page, email, { organizationId: orgB.organizationId });

    // Now login without an org selected (should trigger selection UI).
    await login(page, email);

    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/select-organization/i, { timeout: 15000 });

    await expect(page.getByRole('heading', { name: /select an organization/i })).toBeVisible();
    await expect(page.getByText(`Multi Org A (${stamp})`)).toBeVisible();
    await expect(page.getByText(`Multi Org B (${stamp})`)).toBeVisible();

    // Select Org A and continue
    await page.getByText(`Multi Org A (${stamp})`).click();
    await page.getByRole('button', { name: /^continue$/i }).click();

    await page.waitForURL(/\/dashboard/i, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 15000 });
  });
});

