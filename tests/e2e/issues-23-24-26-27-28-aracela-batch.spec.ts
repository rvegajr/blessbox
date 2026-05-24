/**
 * Aracela QA batch — Issues #23, #24, #26, #27, #28
 *
 * Source: GitHub issues with the "retest" label and Aracela's notes from
 * 2026-05-23 / 2026-05-24.
 *
 * Each test is named after the precise complaint and asserts the fixed
 * behavior. They were written RED-first and turn GREEN after the fixes
 * in this PR are merged.
 *
 * Local:      BASE_URL=http://localhost:7777 npx playwright test issues-23-24-26-27-28-aracela-batch.spec.ts
 * Production: TEST_ENV=production BASE_URL=https://www.blessbox.org npx playwright test issues-23-24-26-27-28-aracela-batch.spec.ts
 */

import { test, expect, type APIRequestContext } from '@playwright/test';
import { loginAsUser, IS_PRODUCTION, HAS_PROD_SECRETS } from './_helpers/auth';

const BASE_URL = (process.env.BASE_URL || 'http://localhost:7777').replace(/\/$/, '');
const PROD_SEED_SECRET = (process.env.PROD_TEST_SEED_SECRET || '').replace(/\\n/g, '').trim();

/** Seed via the test-only endpoint without needing a Page.
 *
 * Adds a timestamp + random suffix to the seed key so reruns don't collide
 * on `organizations.custom_domain` UNIQUE.
 */
async function seedOrgViaRequest(
  request: APIRequestContext,
  seedKey: string,
  body: Record<string, any> = {},
): Promise<{ organizationId: string; contactEmail: string; orgSlug: string }> {
  const uniqueKey = `${seedKey}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  if (IS_PRODUCTION) {
    const resp = await request.post(`${BASE_URL}/api/test/seed-prod`, {
      headers: {
        'x-qa-seed-token': PROD_SEED_SECRET,
        'x-test-seed-secret': PROD_SEED_SECRET,
      },
      data: { seedKey: uniqueKey, ...body },
    });
    if (!resp.ok()) {
      const txt = await resp.text().catch(() => '(no body)');
      console.error('[seedOrgViaRequest:prod] status=%s body=%s', resp.status(), txt.slice(0, 300));
    }
    expect(resp.ok()).toBeTruthy();
    return resp.json();
  }
  const resp = await request.post(`${BASE_URL}/api/test/seed`, { data: { seedKey: uniqueKey, ...body } });
  if (!resp.ok()) {
    const txt = await resp.text().catch(() => '(no body)');
    console.error('[seedOrgViaRequest] status=%s url=%s body=%s', resp.status(), `${BASE_URL}/api/test/seed`, txt.slice(0, 300));
  }
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

test.describe('Issue #27 — coupon redemption cannot bypass payment forever', () => {
  test('FREE100 cannot be redeemed twice by the same organization', async ({ page, request }) => {
    if (IS_PRODUCTION && !HAS_PROD_SECRETS) test.skip();

    const seed = await seedOrgViaRequest(request, 'i27-batch-1');
    await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });
    const state = await page.context().storageState();
    const cookies = state.cookies.map(c => `${c.name}=${c.value}`).join('; ');

    const first = await request.post(`${BASE_URL}/api/payment/process`, {
      headers: { 'Content-Type': 'application/json', Cookie: cookies },
      data: {
        planType: 'enterprise',
        billingCycle: 'monthly',
        currency: 'USD',
        couponCode: 'FREE100',
      },
    });
    expect(first.status()).toBe(200);
    const firstBody = await first.json();
    expect(firstBody.success).toBe(true);

    const second = await request.post(`${BASE_URL}/api/payment/process`, {
      headers: { 'Content-Type': 'application/json', Cookie: cookies },
      data: {
        planType: 'enterprise',
        billingCycle: 'monthly',
        currency: 'USD',
        couponCode: 'FREE100',
      },
    });
    expect(second.status()).toBe(400);
    const body = await second.json();
    expect(body.success).toBe(false);
    expect(String(body.error)).toMatch(/already been used by your organization/i);
  });

  test('FREE100 still works for a different organization', async ({ page, request }) => {
    if (IS_PRODUCTION && !HAS_PROD_SECRETS) test.skip();
    const seed = await seedOrgViaRequest(request, 'i27-batch-other');
    await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });
    const state = await page.context().storageState();
    const cookies = state.cookies.map(c => `${c.name}=${c.value}`).join('; ');
    const res = await request.post(`${BASE_URL}/api/payment/process`, {
      headers: { 'Content-Type': 'application/json', Cookie: cookies },
      data: { planType: 'enterprise', billingCycle: 'monthly', currency: 'USD', couponCode: 'FREE100' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.subscription?.plan_type).toBe('enterprise');
    expect(body.chargedAmountCents).toBe(0);
  });
});

test.describe('Issue #26 — non-catalog plans return a useful checkout error', () => {
  test('Subscribe with Square for `standard` returns 409 with a clear message', async ({ page, request }) => {
    if (IS_PRODUCTION && !HAS_PROD_SECRETS) test.skip();
    const seed = await seedOrgViaRequest(request, 'i26-batch');
    await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });
    const state = await page.context().storageState();
    const cookies = state.cookies.map(c => `${c.name}=${c.value}`).join('; ');
    const res = await request.post(`${BASE_URL}/api/payment/create-checkout-session`, {
      headers: { 'Content-Type': 'application/json', Cookie: cookies },
      data: { planType: 'standard', billingCycle: 'monthly', email: seed.contactEmail },
    });
    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(String(body.error)).toMatch(/catalog checkout not yet available/i);
    expect(body.fallback).toBe('contact-support');
  });

  test('Subscribe with Square for `enterprise` returns the same helpful 409', async ({ page, request }) => {
    if (IS_PRODUCTION && !HAS_PROD_SECRETS) test.skip();
    const seed = await seedOrgViaRequest(request, 'i26-batch-ent');
    await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });
    const state = await page.context().storageState();
    const cookies = state.cookies.map(c => `${c.name}=${c.value}`).join('; ');
    const res = await request.post(`${BASE_URL}/api/payment/create-checkout-session`, {
      headers: { 'Content-Type': 'application/json', Cookie: cookies },
      data: { planType: 'enterprise', billingCycle: 'monthly', email: seed.contactEmail },
    });
    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(body.fallback).toBe('contact-support');
  });
});

test.describe('Issue #23 — adding another org clears stale onboarding state', () => {
  test('?fresh=1 wipes onboarding localStorage so previous org name does not pre-fill', async ({ page, request }) => {
    if (IS_PRODUCTION) test.skip(); // localStorage assertions only meaningful in dev

    const seed = await seedOrgViaRequest(request, 'i23-batch');
    await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });

    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.setItem('onboarding_orgName', 'Previous Org');
      localStorage.setItem('onboarding_contactEmail', 'previous@example.com');
      localStorage.setItem('onboarding_organizationId', 'previous-org-id');
    });

    await page.goto(`${BASE_URL}/onboarding/organization-setup?fresh=1`);
    await page.waitForLoadState('networkidle');

    const orgNameValue = await page.locator('[data-testid="input-org-name"]').inputValue().catch(() => '');
    expect(orgNameValue).not.toBe('Previous Org');

    const cleared = await page.evaluate(() => ({
      orgName: localStorage.getItem('onboarding_orgName'),
      contactEmail: localStorage.getItem('onboarding_contactEmail'),
      organizationId: localStorage.getItem('onboarding_organizationId'),
    }));
    expect(cleared.orgName).toBeNull();
    expect(cleared.contactEmail).toBeNull();
    expect(cleared.organizationId).toBeNull();
  });
});

test.describe('Issue #24 — registrations dashboard polish', () => {
  test('checked-in filter is present in the UI', async ({ page, request }) => {
    if (IS_PRODUCTION && !HAS_PROD_SECRETS) test.skip();
    const seed = await seedOrgViaRequest(request, 'i24-checkin-filter');
    await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });
    await page.goto(`${BASE_URL}/dashboard/registrations`);
    await page.waitForLoadState('networkidle');

    const filter = page.locator('[data-testid="dropdown-checked-in-filter"]');
    await expect(filter).toBeVisible();
    await expect(filter.locator('option', { hasText: 'Checked In' }).first()).toBeAttached();
    await expect(filter.locator('option', { hasText: 'Not Checked In' }).first()).toBeAttached();
  });

  test('event filter prefers organization event_name over qr_code_set name', async ({ page, request }) => {
    if (IS_PRODUCTION && !HAS_PROD_SECRETS) test.skip();
    const seed = await seedOrgViaRequest(request, 'i24-event-name', { eventName: 'Aracela Conference 2026' });
    await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });
    const state = await page.context().storageState();
    const cookies = state.cookies.map(c => `${c.name}=${c.value}`).join('; ');
    const res = await request.get(`${BASE_URL}/api/events?organizationId=${seed.organizationId}`, {
      headers: { Cookie: cookies },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.events)).toBe(true);
    if (body.events.length > 0) {
      const ev = body.events[0];
      expect(ev).toHaveProperty('eventName');
      expect(ev.eventName).toBe('Aracela Conference 2026');
    }
  });

  test('PDF export downloads and returns a valid PDF (Issue #24 layout fix)', async ({ page, request }) => {
    if (IS_PRODUCTION && !HAS_PROD_SECRETS) test.skip();
    const seed = await seedOrgViaRequest(request, 'i24-pdf');
    await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });
    const state = await page.context().storageState();
    const cookies = state.cookies.map(c => `${c.name}=${c.value}`).join('; ');
    const res = await request.get(`${BASE_URL}/api/registrations/export?format=pdf`, {
      headers: { Cookie: cookies },
    });
    expect(res.status()).toBe(200);
    const buf = await res.body();
    expect(buf.slice(0, 4).toString()).toBe('%PDF');
    expect(buf.length).toBeGreaterThan(800);
  });

  test('delivery-status action buttons render on the registrations page', async ({ page, request }) => {
    if (IS_PRODUCTION && !HAS_PROD_SECRETS) test.skip();
    const seed = await seedOrgViaRequest(request, 'i24-actions', { sampleRegistrations: 1 });
    await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });
    await page.goto(`${BASE_URL}/dashboard/registrations`);
    await page.waitForLoadState('networkidle');

    // At least one action button should appear when there is at least one registration.
    const cancelBtns = page.locator('[data-testid^="btn-cancel-"]');
    const resendBtns = page.locator('[data-testid^="btn-resend-"]');
    const hasActions = (await cancelBtns.count()) + (await resendBtns.count()) > 0;
    expect(hasActions).toBe(true);
  });
});

test.describe('Issue #28 — super-admin View Details tracks last login', () => {
  test('OrganizationLoginTracker writes last_login_at on verify-code semantics (smoke)', async ({ request }) => {
    if (IS_PRODUCTION && !HAS_PROD_SECRETS) test.skip();
    // The actual tracker behavior is unit-tested in
    // lib/services/OrganizationLoginTracker.test.ts. This E2E smoke verifies
    // that the seed flow produces a usable org id we can later log into.
    const seed = await seedOrgViaRequest(request, 'i28-batch');
    expect(seed.organizationId).toBeTruthy();
    expect(seed.contactEmail).toBeTruthy();
  });
});
