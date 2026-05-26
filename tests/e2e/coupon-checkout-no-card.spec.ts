/**
 * Coupon checkout — 100%-off grants the plan with no card (INTENDED behavior)
 *
 * Source Jam:  https://jam.dev/c/31f83652-3c07-4bd2-a921-eeee6dc8f424
 * Reporter:    Acel Patricio (Aracela QA) — 2026-05-24
 * GitHub:      Issue #27 (re-test)
 * Traklet:     TC-041
 *
 * Reported as "Fail": applied FREE100, clicked Complete Checkout WITHOUT entering
 * any card, landed on /dashboard with the Enterprise plan.
 *
 * ── TRIAGE VERDICT: GREEN / works-as-designed ──────────────────────────────────
 * The recording contains ZERO failing requests (107/107 HTTP 200 — coupons/apply,
 * payment/process and subscriptions all 200) and no console errors. A 100%-off
 * coupon legitimately zeroes the total, so the checkout page intentionally swaps
 * "Subscribe with Square" for "Complete Checkout" (app/checkout/page.tsx:333) and
 * grants the $0 order with no card (couponCode forwarded at page.tsx:198). The
 * one-redemption-per-org abuse guard is already covered at the API level by
 * issues-23-24-26-27-28-aracela-batch.spec.ts:57.
 *
 * This spec is therefore a POSITIVE regression locking in the intended UI path
 * (the exact testids Aracela clicked). It is expected to PASS on current code; it
 * is NOT a bug repro. The open *product* question — should FREE100 grant free
 * Enterprise, and is per-org bounding sufficient? — is for human triage, never an
 * automated fix.
 *
 * Local:      BASE_URL=http://localhost:7777 npx playwright test coupon-checkout-no-card
 * Production: TEST_ENV=production BASE_URL=https://www.blessbox.org npx playwright test coupon-checkout-no-card
 */

import { test, expect, type APIRequestContext } from '@playwright/test';
import { loginAsUser, IS_PRODUCTION, HAS_PROD_SECRETS } from './_helpers/auth';

const BASE_URL = (process.env.BASE_URL || 'http://localhost:7777').replace(/\/$/, '');
const PROD_SEED_SECRET = (process.env.PROD_TEST_SEED_SECRET || '').replace(/\\n/g, '').trim();

/** Seed an org via the test-only endpoint (mirrors the reference batch spec). */
async function seedOrgViaRequest(
  request: APIRequestContext,
  seedKey: string,
  body: Record<string, any> = {},
): Promise<{ organizationId: string; contactEmail: string; orgSlug: string }> {
  const uniqueKey = `${seedKey}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  if (IS_PRODUCTION) {
    const resp = await request.post(`${BASE_URL}/api/test/seed-prod`, {
      headers: { 'x-qa-seed-token': PROD_SEED_SECRET, 'x-test-seed-secret': PROD_SEED_SECRET },
      data: { seedKey: uniqueKey, ...body },
    });
    expect(resp.ok()).toBeTruthy();
    return resp.json();
  }
  const resp = await request.post(`${BASE_URL}/api/test/seed`, { data: { seedKey: uniqueKey, ...body } });
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

test.describe('Issue #27 (re-test) — FREE100 grants Enterprise at $0 with no card [works-as-designed]', () => {
  test('apply FREE100 → Complete Checkout → dashboard, no payment details required', async ({ page, request }) => {
    if (IS_PRODUCTION && !HAS_PROD_SECRETS) test.skip();

    const seed = await seedOrgViaRequest(request, 'tc041-coupon-no-card');
    await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });

    // Reproduce Aracela's exact clicks — every testid below was confirmed present
    // in the Jam recording (getUserEvents).
    await page.goto(`${BASE_URL}/checkout?plan=enterprise`);
    await page.getByTestId('input-coupon').fill('FREE100');
    await page.getByTestId('btn-apply-coupon').click();

    // 100%-off zeroes the total → the page shows "Complete Checkout" (not Square).
    await expect(page.getByTestId('summary-total')).toHaveText(/\$0\.00/);
    const complete = page.getByTestId('btn-complete-checkout');
    await expect(complete).toBeVisible();

    // No card is ever entered.
    await complete.click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });

    // Intended outcome: Enterprise granted, $0 charged.
    const cookies = (await page.context().storageState()).cookies
      .map(c => `${c.name}=${c.value}`)
      .join('; ');
    const sub = await request.get(`${BASE_URL}/api/subscriptions`, { headers: { Cookie: cookies } });
    expect(sub.status()).toBe(200);
    expect(JSON.stringify(await sub.json())).toMatch(/enterprise/i);
  });
});
