import { test, expect } from '@playwright/test';

/**
 * User-reported regressions (E2E repro suite)
 *
 * These tests are designed to REPRODUCE the exact UX issues users reported:
 * - "Dashboard registrations spins forever"
 * - "Going back forces me to restart onboarding"
 * - "No way to login" (captured indirectly by the dashboard behavior)
 *
 * IMPORTANT:
 * - These are marked as expected failures using `test.fail()` so they can run in CI
 *   without blocking merges, while still capturing screenshots/traces and keeping the
 *   regression reproducible.
 * - Once you fix the underlying behavior, remove `test.fail()` to make them enforceable.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:7777';
const TEST_ENV = process.env.TEST_ENV || 'local';
const IS_PRODUCTION = TEST_ENV === 'production' || /blessbox\.org/i.test(BASE_URL);
const ALLOW_KNOWN_FAILURES = process.env.KNOWN_BUGS === '1';

const PROD_TEST_LOGIN_SECRET = process.env.PROD_TEST_LOGIN_SECRET || '';
const HAS_PROD_LOGIN = !!PROD_TEST_LOGIN_SECRET;

async function setTestAuthCookies(page: any, cookies: Array<{ name: string; value: string }>) {
  const url = BASE_URL.startsWith('http') ? BASE_URL : `http://${BASE_URL}`;
  await page.context().addCookies(
    cookies.map((c) => ({
      name: c.name,
      value: c.value,
      url,
    }))
  );
}

async function loginAsUser(page: any, email: string, opts?: { organizationId?: string; admin?: boolean }) {
  if (IS_PRODUCTION) {
    if (!HAS_PROD_LOGIN) {
      console.log('   ⚠️  PROD_TEST_LOGIN_SECRET not set - skipping authentication');
      return;
    }
    const resp = await page.request.post(`${BASE_URL}/api/test/login`, {
      headers: { 'x-qa-login-token': PROD_TEST_LOGIN_SECRET },
      data: { email, organizationId: opts?.organizationId, admin: !!opts?.admin, expiresIn: 3600 },
    });
    if (!resp.ok()) {
      throw new Error(`Login failed: ${resp.status()}`);
    }
    const body = await resp.json();
    if (!body.success) {
      throw new Error(`Login failed: ${body.error || 'Unknown error'}`);
    }
    return body;
  }

  // Local/dev: cookie-based bypass
  await setTestAuthCookies(page, [
    { name: 'bb_test_auth', value: '1' },
    { name: 'bb_test_email', value: email },
    ...(opts?.organizationId ? [{ name: 'bb_test_org_id', value: opts.organizationId }] : []),
    ...(opts?.admin ? [{ name: 'bb_test_admin', value: '1' }] : []),
  ]);
}

async function takeDebugArtifacts(page: any, name: string) {
  try {
    await page.screenshot({ path: `test-results/${name}.png`, fullPage: true });
  } catch {
    // ignore
  }
}

test.describe('User-reported regressions (repro)', () => {
  test('REPRO: /dashboard/registrations can spin forever when unauthenticated', async ({ page }) => {
    // This matches the user report: they can register via QR (public),
    // but when they try to open registrations in the dashboard, it just spins.
    //
    // Current likely cause: the page early-returns when session is missing, leaving loading=true.
    if (ALLOW_KNOWN_FAILURES) {
      test.fail(true, 'Known regression: unauthenticated dashboard registrations can stay in loading state indefinitely.');
    }

    await page.goto(`${BASE_URL}/dashboard/registrations`, { waitUntil: 'domcontentloaded' });

    // Collect network evidence (most common: 401 or 409 from API calls)
    const responses: Array<{ url: string; status: number }> = [];
    page.on('response', (res) => {
      const url = res.url();
      if (url.includes('/api/registrations') || url.includes('/api/auth/session') || url.includes('/api/me/active-organization')) {
        responses.push({ url, status: res.status() });
      }
    });

    // Wait a reasonable amount of time for the UI to transition away from loading.
    await page.waitForTimeout(6000);

    const stillLoading = await page.locator('text=Loading registrations...').isVisible().catch(() => false);
    if (stillLoading) {
      await takeDebugArtifacts(page, 'repro-dashboard-registrations-infinite-spinner');
    }

    // If it still loads forever, print the likely root cause evidence to test logs.
    if (stillLoading) {
      // eslint-disable-next-line no-console
      console.log('Observed related API responses:', responses);
    }

    // Desired behavior (once fixed):
    // - redirect to login/auth, OR
    // - show an explicit "Unauthorized" / "Please log in" message, OR
    // - show an organization-selection prompt
    expect(stillLoading).toBe(false);
  });

  test('REPRO: onboarding organization setup loses user input when navigating back', async ({ page }) => {
    // This matches the user report: “Any time you go back you have to start the process all over again.”
    // This typically happens when onboarding uses client-only state without persisting drafts.
    if (ALLOW_KNOWN_FAILURES) {
      test.fail(true, 'Known regression: onboarding org setup inputs are not persisted across back navigation.');
    }

    const orgName = `BackNav Org ${Date.now()}`;
    const email = `backnav-${Date.now()}@example.com`;

    // Authenticate first (required for onboarding pages)
    try {
      await loginAsUser(page, email);
    } catch (error) {
      if (IS_PRODUCTION && !HAS_PROD_LOGIN) {
        console.log('   ⚠️  Skipping test - PROD_TEST_LOGIN_SECRET not set');
        test.skip();
        return;
      }
    }

    await page.goto(`${BASE_URL}/onboarding/organization-setup`, { waitUntil: 'networkidle' });

    // If redirected to login, authenticate and retry
    if (page.url().includes('/login')) {
      await loginAsUser(page, email);
      await page.goto(`${BASE_URL}/onboarding/organization-setup`, { waitUntil: 'networkidle' });
    }

    const nameInput = page.locator('input#name');
    const emailInput = page.locator('input#contactEmail');
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await expect(emailInput).toBeVisible({ timeout: 10000 });

    await nameInput.fill(orgName);
    await emailInput.fill(email);

    await page.locator('button[type="submit"]').click();

    // We should now be on email verification or next step.
    await page.waitForTimeout(2500);

    // Navigate back (simulates user pressing back)
    await page.goBack();
    await page.waitForTimeout(1500);

    // Desired behavior (once fixed): inputs should still be populated (draft persisted).
    const nameValue = await nameInput.inputValue().catch(() => '');
    const emailValue = await emailInput.inputValue().catch(() => '');

    if (nameValue !== orgName || emailValue !== email) {
      await takeDebugArtifacts(page, 'repro-onboarding-back-navigation-resets');
    }

    expect(nameValue).toBe(orgName);
    expect(emailValue).toBe(email);
  });
});

