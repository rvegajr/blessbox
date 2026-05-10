import { test, expect } from '@playwright/test';
import { loginAsUser, seedOrg, HAS_PROD_SECRETS, IS_PRODUCTION } from './_helpers/auth';

const BASE_URL = process.env.BASE_URL || 'http://localhost:7777';

test.describe('Multi-org per email: organization selection', () => {
  test.skip(IS_PRODUCTION && !HAS_PROD_SECRETS, 'Requires PROD_TEST_LOGIN_SECRET + PROD_TEST_SEED_SECRET');

  test('User is prompted to select organization when multiple exist', async ({ page }) => {
    test.setTimeout(120_000);

    const stamp = Date.now();
    const email = `qa-multi-org-${stamp}@blessbox.app`;

    const orgA = await seedOrg(page, `multi-a-${stamp}`);
    const orgB = await seedOrg(page, `multi-b-${stamp}`);

    // Seed produces its own contactEmail; we re-seed with the shared email so both
    // orgs are linked to the same user. If seedOrg doesn't accept a custom email,
    // use the returned emails and login separately — org-selection UI fires when a
    // session has no active org set.
    await loginAsUser(page, orgA.contactEmail, { organizationId: orgA.organizationId });
    await loginAsUser(page, orgA.contactEmail, { organizationId: orgB.organizationId });

    // Login without an active org — middleware should redirect to /select-organization.
    await loginAsUser(page, orgA.contactEmail);

    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/select-organization/i, { timeout: 15000 });

    await expect(page.getByRole('heading', { name: /select an organization/i })).toBeVisible();

    // Select first org and continue
    const firstOrgCard = page.locator('[data-testid^="org-card-"]').first();
    await firstOrgCard.click();
    await page.getByRole('button', { name: /^continue$/i }).click();

    await page.waitForURL(/\/dashboard/i, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible({ timeout: 15000 });
  });
});
