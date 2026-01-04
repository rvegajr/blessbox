import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL || 'http://localhost:7777';
const TEST_ENV = process.env.TEST_ENV || 'local';
const IS_PRODUCTION = TEST_ENV === 'production' || /blessbox\.org/i.test(BASE_URL);

// Production-safe secrets (from Vercel/CI env, not git)
const PROD_TEST_LOGIN_SECRET = process.env.PROD_TEST_LOGIN_SECRET || '';
const PROD_TEST_SEED_SECRET = process.env.PROD_TEST_SEED_SECRET || '';
const HAS_PROD_SECRETS = !!(PROD_TEST_LOGIN_SECRET && PROD_TEST_SEED_SECRET);

/**
 * Production-safe login: issues authjs.session-token cookie via secret-gated endpoint.
 * Falls back to local cookie-based auth in non-production.
 */
async function loginAsUser(page: any, email: string, options?: { organizationId?: string; admin?: boolean }) {
  if (IS_PRODUCTION && HAS_PROD_SECRETS) {
    // Production: use secret-gated login endpoint
    const loginResp = await page.request.post(`${BASE_URL}/api/test/login`, {
      headers: { 'x-qa-login-token': PROD_TEST_LOGIN_SECRET },
      data: {
        email,
        organizationId: options?.organizationId,
        admin: options?.admin || false,
        expiresIn: 3600, // 1 hour
      },
    });
    expect(loginResp.ok()).toBeTruthy();
    const login = await loginResp.json();
    expect(login.success).toBe(true);
    // Cookie is set automatically via Set-Cookie header
    return login;
  } else if (!IS_PRODUCTION) {
    // Local: use cookie-based test auth
    const url = BASE_URL.startsWith('http') ? BASE_URL : `http://${BASE_URL}`;
    await page.context().addCookies([
      { name: 'bb_test_auth', value: '1', url },
      { name: 'bb_test_email', value: email, url },
      ...(options?.organizationId ? [{ name: 'bb_test_org_id', value: options.organizationId, url }] : []),
      ...(options?.admin ? [{ name: 'bb_test_admin', value: '1', url }] : []),
    ]);
    return { email, organizationId: options?.organizationId };
  } else {
    throw new Error('Production login requires PROD_TEST_LOGIN_SECRET env var');
  }
}

/**
 * Production-safe seeding: creates deterministic QA data via secret-gated endpoint.
 * Falls back to local seed endpoint in non-production.
 */
async function seedOrg(page: any, seedKey: string) {
  if (IS_PRODUCTION && HAS_PROD_SECRETS) {
    // Production: use secret-gated seed endpoint
    const seedResp = await page.request.post(`${BASE_URL}/api/test/seed-prod`, {
      headers: { 'x-qa-seed-token': PROD_TEST_SEED_SECRET },
      data: { seedKey },
    });
    expect(seedResp.ok()).toBeTruthy();
    const seed = await seedResp.json();
    expect(seed.success).toBe(true);
    return seed;
  } else if (!IS_PRODUCTION) {
    // Local: use local seed endpoint
    const seedResp = await page.request.post(`${BASE_URL}/api/test/seed`, { data: { seedKey } });
    expect(seedResp.ok()).toBeTruthy();
    const seed = await seedResp.json();
    expect(seed.success).toBe(true);
    return seed;
  } else {
    throw new Error('Production seeding requires PROD_TEST_SEED_SECRET env var');
  }
}

test.describe('QA Testing Guide coverage (local, DB-backed)', () => {
  test.describe.configure({ mode: 'serial' });

  test('Production read-only gate (skips auth-only flows)', async ({ page }) => {
    test.skip(!IS_PRODUCTION, 'Only runs for production BASE_URL / TEST_ENV=production');

    // Basic availability check
    const resp = await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    expect(resp?.status()).toBeLessThan(500);

    // If secrets are present, log that full coverage is available
    if (HAS_PROD_SECRETS) {
      console.log('✅ Production secrets detected - full QA coverage enabled');
    } else {
      console.log('⚠️  Production secrets not detected - running read-only checks only');
    }
  });

  test('Part 5: Pricing + coupons + checkout totals', async ({ page }) => {
    test.setTimeout(120_000);
    const requireCouponUi = !IS_PRODUCTION || process.env.PROD_STRICT === 'true';

    // Pricing page
    await page.goto(`${BASE_URL}/pricing`);
    await expect(page.getByRole('heading', { name: 'Pricing' })).toBeVisible();
    // Accept both "Free" and "Free Plan" variants
    await expect(page.getByRole('heading', { name: /^free(\s+plan)?$/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^standard(\s+plan)?$/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^enterprise(\s+plan)?$/i })).toBeVisible();
    await expect(page.getByText('$19/mo')).toBeVisible();
    await expect(page.getByText('$99/mo')).toBeVisible();

    // In production mode with secrets, we can seed and authenticate for full coverage.
    // Without secrets, we validate coupon math only (no payment submission).
    let allowCompleteCheckout = !IS_PRODUCTION || HAS_PROD_SECRETS;
    if (!IS_PRODUCTION || HAS_PROD_SECRETS) {
      const seed = await seedOrg(page, `pricing-${Date.now()}`);
      await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });
    }

    // FREE100 => $0.00
    await page.goto(`${BASE_URL}/checkout?plan=standard`);
    await expect(page.getByRole('heading', { name: /^checkout$/i })).toBeVisible();
    if (IS_PRODUCTION && !requireCouponUi) {
      // "Public-only" production validation mode (useful pre-deploy)
      // - Confirms checkout page loads
      // - Skips coupon assertions until deployment includes coupon UI
      return;
    }

    await expect(page.getByTestId('input-coupon')).toBeVisible();
    await page.getByTestId('input-coupon').fill('FREE100');
    await page.getByTestId('btn-apply-coupon').click();
    await expect(page.getByText('Applied FREE100')).toBeVisible();
    await expect(page.getByText('Total').locator('..')).toContainText('$0.00');
    if (allowCompleteCheckout) {
      await page.getByRole('button', { name: 'Complete Checkout' }).click();
      await expect(page).toHaveURL(new RegExp(`${BASE_URL}/dashboard`), { timeout: 15000 });
    }

    // WELCOME50 => $9.50
    await page.goto(`${BASE_URL}/checkout?plan=standard`);
    await page.getByLabel('Coupon Code').fill('WELCOME50');
    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByText('Applied WELCOME50')).toBeVisible();
    await expect(page.getByText('Total').locator('..')).toContainText('$9.50');

    // SAVE20 => $1.00 minimum
    await page.goto(`${BASE_URL}/checkout?plan=standard`);
    await page.getByLabel('Coupon Code').fill('SAVE20');
    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByText('Applied SAVE20')).toBeVisible();
    await expect(page.getByText('Total').locator('..')).toContainText('$1.00');

    // FIRST10 => $9.00
    await page.goto(`${BASE_URL}/checkout?plan=standard`);
    await page.getByLabel('Coupon Code').fill('FIRST10');
    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByText('Applied FIRST10')).toBeVisible();
    await expect(page.getByText('Total').locator('..')).toContainText('$9.00');

    // Invalid coupon errors
    await page.goto(`${BASE_URL}/checkout?plan=standard`);
    await page.getByLabel('Coupon Code').fill('INVALID');
    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByText(/invalid coupon|coupon not found/i)).toBeVisible();

    await page.getByLabel('Coupon Code').fill('EXPIRED');
    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByText(/coupon (has )?expired/i)).toBeVisible();

    await page.getByLabel('Coupon Code').fill('MAXEDOUT');
    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByText(/limit reached|maximum uses/i)).toBeVisible();
  });

  test('Parts 3-4-7: registration appears, can view, check-in, undo, export CSV/PDF', async ({ page }) => {
    test.setTimeout(120_000);

    // Skip only if production AND no secrets (requires seeded org + authenticated dashboard)
    test.skip(IS_PRODUCTION && !HAS_PROD_SECRETS, 'Requires seeded org + authenticated dashboard (or production secrets)');

    const seed = await seedOrg(page, `regs-${Date.now()}`);
    await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });

    // Public registration (Part 3.1)
    await page.goto(`${BASE_URL}/register/${seed.orgSlug}/main-entrance`);
    await expect(page.getByRole('heading', { name: /registration/i })).toBeVisible({ timeout: 15000 });
    await page.getByLabel('First Name').fill('John');
    await page.getByLabel('Last Name').fill('Doe');
    await page.getByLabel('Email').fill('john.doe@example.com');
    await page.getByRole('button', { name: /submit/i }).click();
    await expect(page.getByText(/thank you|success/i)).toBeVisible({ timeout: 15000 });

    // Dashboard registrations list (Part 3.2/3.3)
    await page.goto(`${BASE_URL}/dashboard/registrations`);
    await expect(page.getByRole('heading', { name: 'Registrations', exact: true })).toBeVisible();
    await page.getByPlaceholder('Search by name or email...').fill('john');
    await expect(page.getByText(/john/i).first()).toBeVisible();
    await page.getByRole('button', { name: 'Clear Filters' }).click();

    // View details
    await page.getByRole('link', { name: 'View' }).first().click();
    await expect(page).toHaveURL(new RegExp(`${BASE_URL}/dashboard/registrations/`), { timeout: 15000 });
    await expect(page.getByRole('heading', { name: /registration details/i })).toBeVisible({ timeout: 15000 });

    // Check in (Part 4.1)
    await page.getByRole('button', { name: /check in/i }).first().click();
    await expect(page.getByText('This registration has been checked in')).toBeVisible();

    // Undo check-in (Part 4.2)
    await page.getByRole('button', { name: /undo check-in/i }).click();
    await expect(page.getByRole('button', { name: /undo check-in/i })).toBeHidden();
    await expect(page.getByRole('button', { name: /check in/i }).first()).toBeVisible();

    // Exports (Part 7)
    await page.goto(`${BASE_URL}/dashboard/registrations`);

    const csvDownload = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#export-csv').click(),
    ]).then((r) => r[0]);
    expect(csvDownload.suggestedFilename()).toMatch(/\.csv$/i);
    const csvPath = await csvDownload.path();
    expect(csvPath).toBeTruthy();
    const csvContent = await fs.readFile(csvPath!, 'utf8');
    expect(csvContent).toMatch(/Registration ID/i);
    expect(csvContent).toMatch(/First Name/i);

    const pdfDownload = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#export-pdf').click(),
    ]).then((r) => r[0]);
    expect(pdfDownload.suggestedFilename()).toMatch(/\.pdf$/i);
    const pdfPath = await pdfDownload.path();
    expect(pdfPath).toBeTruthy();
    const pdfBytes = await fs.readFile(pdfPath!);
    expect(pdfBytes.subarray(0, 4).toString('utf8')).toBe('%PDF');
  });

  test('Part 8: create class, add session, add participant, enroll with capacity enforcement', async ({ page }) => {
    test.setTimeout(120_000);

    // Skip only if production AND no secrets (requires seeded org + authenticated routes)
    test.skip(IS_PRODUCTION && !HAS_PROD_SECRETS, 'Requires seeded org + authenticated routes (or production secrets)');

    const seed = await seedOrg(page, `classes-${Date.now()}`);
    await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });

    // Add participant
    await page.goto(`${BASE_URL}/participants/new`);
    await page.getByLabel('First Name *').fill('Alice');
    await page.getByLabel('Last Name *').fill('Johnson');
    await page.getByLabel('Email *').fill(`alice.${Date.now()}@example.com`);
    await page.getByRole('button', { name: 'Save Participant' }).click();
    await expect(page).toHaveURL(new RegExp(`${BASE_URL}/participants`));
    await expect(page.getByRole('heading', { name: 'Participants' })).toBeVisible();

    // Create class with capacity 1
    await page.goto(`${BASE_URL}/classes/new`);
    await page.getByLabel('Class Name *').fill(`Yoga Basics ${Date.now()}`);
    await page.getByLabel('Capacity *').fill('1');
    await page.getByRole('button', { name: 'Create Class' }).click();
    await expect(page).toHaveURL(new RegExp(`${BASE_URL}/classes/[0-9a-f-]{36}$`), { timeout: 15000 });

    // Add session
    const classUrl = page.url();
    const classId = classUrl.split('/classes/')[1].split('/')[0];
    await page.goto(`${BASE_URL}/classes/${classId}/sessions`);
    await page.getByLabel('Date *').fill(new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    await page.getByLabel('Time *').fill('10:00');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('heading', { name: 'Class Sessions', exact: true })).toBeVisible();

    // Enroll participant
    await page.goto(`${BASE_URL}/classes/${classId}`);
    await page.getByRole('heading', { name: /enroll participant/i }).scrollIntoViewIfNeeded();
    await page.locator('select').first().selectOption({ index: 1 });
    await page.getByRole('button', { name: /^enroll$/i }).click();
    await expect(page.getByRole('heading', { name: 'Roster' })).toBeVisible();

    // Add a second participant and ensure capacity enforcement returns error
    await page.goto(`${BASE_URL}/participants/new`);
    await page.getByLabel('First Name *').fill('Bob');
    await page.getByLabel('Last Name *').fill('Smith');
    await page.getByLabel('Email *').fill(`bob.${Date.now()}@example.com`);
    await page.getByRole('button', { name: 'Save Participant' }).click();

    await page.goto(`${BASE_URL}/classes/${classId}`);
    await page.locator('select').first().selectOption({ index: 2 });
    await page.getByRole('button', { name: /^enroll$/i }).click();
    await expect(page.getByText(/capacity reached/i)).toBeVisible();
  });

  test('Part 6: admin can access stats, orgs, subscriptions, coupons (and create a coupon)', async ({ page }) => {
    test.setTimeout(120_000);

    // Skip only if production AND no secrets (requires super-admin authentication)
    test.skip(IS_PRODUCTION && !HAS_PROD_SECRETS, 'Requires super-admin authentication (or production secrets)');

    // Seed some data first (org/registration/subscription/etc.)
    await seedOrg(page, `admin-${Date.now()}`);

    // Become super-admin
    await loginAsUser(page, 'admin@blessbox.app', { admin: true });

    await page.goto(`${BASE_URL}/admin`);
    await expect(page.getByRole('heading', { name: /admin panel/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /organizations/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /subscriptions/i })).toBeVisible();

    // Organizations tab
    await page.getByRole('button', { name: /organizations/i }).click();
    await expect(page.locator('table')).toBeVisible();

    // Subscriptions tab
    await page.getByRole('button', { name: /subscriptions/i }).click();
    await expect(page.locator('table')).toBeVisible();

    // Coupons: go to coupons page and create one
    await page.goto(`${BASE_URL}/admin/coupons`);
    await expect(page.getByRole('heading', { name: /coupon management/i })).toBeVisible();
    await page.getByRole('link', { name: /create coupon/i }).click();
    const couponCode = `TEST${Date.now()}`;
    await page.getByLabel('Coupon Code *').fill(couponCode);
    await page.getByLabel('Discount Type *').selectOption('percentage');
    await page.getByLabel(/discount value/i).fill('25');
    await page.getByRole('button', { name: /create|save/i }).click();
    await expect(page).toHaveURL(new RegExp(`${BASE_URL}/admin/coupons`), { timeout: 15000 });
    await expect(page.getByText(couponCode)).toBeVisible({ timeout: 15000 });
  });
});

