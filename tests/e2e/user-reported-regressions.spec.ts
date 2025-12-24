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
const ALLOW_KNOWN_FAILURES = process.env.KNOWN_BUGS === '1';

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

    await page.goto(`${BASE_URL}/onboarding/organization-setup`, { waitUntil: 'networkidle' });

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

