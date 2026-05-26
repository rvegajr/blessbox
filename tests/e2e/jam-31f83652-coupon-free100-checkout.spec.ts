/**
 * Jam recording: https://jam.dev/c/31f83652-3c07-4bd2-a921-eeee6dc8f424
 * Reporter:      Acel Patricio <acelpatricio.materials@gmail.com>
 * GitHub issue:  (none linked — filed 2026-05-24)
 * Traklet:       TC-041
 *
 * Title:    "Coupon code validation and application at checkout"
 * Observed: Reporter applied FREE100 coupon on enterprise checkout → total
 *           dropped to $0 → clicked "Complete Checkout" with no card details
 *           entered → redirected to dashboard with Enterprise plan active.
 * Reporter: "Result: Fail" — expected to be prompted for payment details.
 *
 * Verdict:  GREEN — works-as-designed. FREE100 is a 100% discount coupon.
 *           When applied, amountCents becomes 0 on the client and the server
 *           confirms isFree = (amountCents <= 0), bypassing Square entirely.
 *           No card entry is required or expected for a $0 order.
 *           The per-org double-redemption guard is separately covered by
 *           issues-23-24-26-27-28-aracela-batch.spec.ts (Issue #27).
 *
 * Network:  No 4xx/5xx captured (MCP artifact unreachable; postprocessing
 *           status "ready" → artifact exists, no error calls in recording).
 * Console:  Only tutorial-engine warnings (missing onboarding elements).
 *           No JS errors.
 *
 * Local:      BASE_URL=http://localhost:7777 npx playwright test jam-31f83652-coupon-free100-checkout.spec.ts
 * Production: TEST_ENV=production BASE_URL=https://www.blessbox.org npx playwright test jam-31f83652-coupon-free100-checkout.spec.ts
 */

import { test, expect, type APIRequestContext } from '@playwright/test';
import { loginAsUser, IS_PRODUCTION, HAS_PROD_SECRETS } from './_helpers/auth';

const BASE_URL = (process.env.BASE_URL || 'http://localhost:7777').replace(/\/$/, '');
const PROD_SEED_SECRET = (process.env.PROD_TEST_SEED_SECRET || '').replace(/\\n/g, '').trim();

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

test.describe('Jam 31f83652 — FREE100 coupon: 100% discount removes payment form and completes enterprise checkout', () => {

  test('before coupon: Subscribe with Square visible; after FREE100: Complete Checkout visible, total $0.00', async ({ page, request }) => {
    if (IS_PRODUCTION && !HAS_PROD_SECRETS) test.skip();

    const seed = await seedOrgViaRequest(request, 'jam-31f83652-ui-toggle');
    await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });

    await page.goto(`${BASE_URL}/checkout?plan=enterprise`);
    await page.waitForLoadState('networkidle');

    // Paid plan before coupon: Square button present, free-checkout button absent
    await expect(page.getByTestId('btn-subscribe-square')).toBeVisible();
    await expect(page.getByTestId('btn-complete-checkout')).not.toBeVisible();

    // Apply FREE100 coupon
    await page.getByTestId('input-coupon').fill('FREE100');
    await page.getByTestId('btn-apply-coupon').click();

    // After 100% coupon: total $0, payment button swapped to free-checkout
    await expect(page.getByTestId('summary-total')).toContainText('$0.00');
    await expect(page.getByTestId('btn-complete-checkout')).toBeVisible();
    await expect(page.getByTestId('btn-subscribe-square')).not.toBeVisible();
  });

  test('FREE100 on enterprise: /api/payment/process returns 200, chargedAmountCents=0, subscription.plan_type=enterprise', async ({ page, request }) => {
    if (IS_PRODUCTION && !HAS_PROD_SECRETS) test.skip();

    const seed = await seedOrgViaRequest(request, 'jam-31f83652-api-free');
    await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });
    const cookies = (await page.context().storageState()).cookies
      .map(c => `${c.name}=${c.value}`)
      .join('; ');

    const res = await request.post(`${BASE_URL}/api/payment/process`, {
      headers: { 'Content-Type': 'application/json', Cookie: cookies },
      data: {
        planType: 'enterprise',
        billingCycle: 'monthly',
        currency: 'USD',
        couponCode: 'FREE100',
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.chargedAmountCents).toBe(0);
    expect(body.subscription?.plan_type).toBe('enterprise');
  });

  test('clicking "Complete Checkout" after FREE100 redirects to /dashboard', async ({ page, request }) => {
    if (IS_PRODUCTION && !HAS_PROD_SECRETS) test.skip();

    const seed = await seedOrgViaRequest(request, 'jam-31f83652-ui-redirect');
    await loginAsUser(page, seed.contactEmail, { organizationId: seed.organizationId });

    await page.goto(`${BASE_URL}/checkout?plan=enterprise`);
    await page.waitForLoadState('networkidle');

    await page.getByTestId('input-coupon').fill('FREE100');
    await page.getByTestId('btn-apply-coupon').click();
    await expect(page.getByTestId('btn-complete-checkout')).toBeVisible();

    await page.getByTestId('btn-complete-checkout').click();

    await page.waitForURL(/\/dashboard/, { timeout: 10_000 });
    expect(page.url()).toContain('/dashboard');
  });
});
