import { test, expect } from '@playwright/test';

/**
 * Cluster L: Public Landing Page & Product Marketing
 * Issue: #33 (Partial Pass)
 *
 * Aracela checklist (her expected results):
 *   - Landing page loads in under 2 seconds
 *   - All sections render without layout breaks
 *   - Primary CTA navigates to login/signup flow
 *   - Page is fully responsive on mobile (375px)
 *   - og: meta tags are present for social sharing
 *   - Logged-in users see a link to their dashboard
 *
 * Aracela suggestion: starter event-type templates (food_distribution, seminar, ...)
 */

const baseURL = process.env.BASE_URL || 'http://localhost:7777';

test.describe('Cluster L: Landing Page (Issue #33)', () => {
  test('renders heading and core copy in incognito (no cookies)', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto(`${baseURL}/`);

    const heading = page.locator('h1', { hasText: 'BlessBox' });
    await expect(heading).toBeVisible();

    const body = await page.textContent('body');
    expect(body).toMatch(/QR/i);
    expect(body).toMatch(/registration/i);
  });

  test('loads under 2 seconds on a warm cache (Aracela SLA)', async ({ page }) => {
    // Warm-up first to remove cold-compile noise
    await page.goto(`${baseURL}/`);
    const start = Date.now();
    await page.goto(`${baseURL}/`, { waitUntil: 'load' });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(2000);
  });

  test('primary CTA navigates to a signup/onboarding flow (Aracela #4)', async ({ page }) => {
    await page.goto(`${baseURL}/`);
    const cta = page.locator('[data-testid="link-home-get-started"]').first();
    await expect(cta).toBeVisible();

    await cta.click();
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    expect(url).toMatch(/\/onboarding|\/signup|\/login/);
  });

  test('mobile responsive at 375px width (Aracela responsive check)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(`${baseURL}/`);

    const heading = page.locator('h1', { hasText: 'BlessBox' });
    await expect(heading).toBeVisible();

    // No horizontal scroll: scrollWidth should be ~ viewport width.
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(380);
  });

  test('exposes og: meta tags for social sharing (Aracela SEO check)', async ({ page }) => {
    await page.goto(`${baseURL}/`);

    const ogTitle = await page.locator('meta[property="og:title"]').first().getAttribute('content');
    const ogDesc = await page
      .locator('meta[property="og:description"]')
      .first()
      .getAttribute('content');
    const metaDesc = await page.locator('meta[name="description"]').first().getAttribute('content');

    expect(ogTitle, 'og:title should be present').toBeTruthy();
    expect(ogDesc, 'og:description should be present').toBeTruthy();
    expect(metaDesc, 'meta description should be present').toBeTruthy();
  });

  test('logged-in users see a Dashboard shortcut (Aracela edge case)', async ({ page, context }) => {
    // Authenticate via the test cookies the app honors in non-prod.
    await context.addCookies([
      { name: 'bb_test_auth', value: '1', url: baseURL },
      { name: 'bb_test_email', value: 'admin@blessbox.app', url: baseURL },
    ]);

    await page.goto(`${baseURL}/`);

    const dashboardLink = page.locator(
      '[data-testid="link-dashboard"], a[href="/dashboard"], a:has-text("Dashboard")'
    ).first();
    await expect(dashboardLink).toBeVisible();
  });

  test('event-type template gallery is reachable from landing (Aracela suggestion)', async ({ page }) => {
    await page.goto(`${baseURL}/`);

    // Either a section on the landing page lists templates, OR a link points to
    // an onboarding step that lets the user pick one. We accept either.
    const body = await page.textContent('body');
    const mentionsTemplates =
      /food.distribution|seminar|volunteer|template/i.test(body || '');

    const linkToOnboardingTemplates = page.locator(
      'a[href*="onboarding"], a[href*="event-types"], a[href*="templates"]'
    );

    const hasMention = mentionsTemplates;
    const hasLink = (await linkToOnboardingTemplates.count()) > 0;
    expect(hasMention || hasLink, 'landing should advertise starter templates').toBeTruthy();
  });
});
