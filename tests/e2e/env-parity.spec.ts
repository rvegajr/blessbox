import { test, expect } from '@playwright/test';

/**
 * Environment UX parity contract — ONE spec that runs against ANY environment
 * and asserts exactly what that environment should look like. This is the
 * executable version of docs/PIPELINE.md's env table.
 *
 *   npm run test:env:dev    # https://dev.blessbox.org
 *   npm run test:env:uat    # https://uat.blessbox.org
 *   npm run test:env:prod   # https://www.blessbox.org
 *   npm run test:env:all    # all three
 *
 * The expected contract is derived from BASE_URL's hostname, so the same
 * assertions can never silently pass against the wrong environment.
 */
const BASE_URL = process.env.BASE_URL || 'https://www.blessbox.org';

type EnvContract = {
  name: 'dev' | 'uat' | 'production';
  titlePrefix: RegExp;          // server-rendered <title>
  banner: boolean;              // env banner visible?
  bannerText?: RegExp;
  mailLink: boolean;            // "View captured mail" link (dev only)
  trakletProxy: 200 | 404;      // /api/dev/traklet-proxy gate per env
  trakletWidget: boolean;       // <traklet-widget> mounts in the DOM
};

function contractFor(url: string): EnvContract {
  const host = new URL(url).hostname;
  if (host.startsWith('dev.')) {
    return {
      name: 'dev', titlePrefix: /^\[DEV\]/, banner: true,
      bannerText: /development/i, mailLink: true, trakletProxy: 200, trakletWidget: true,
    };
  }
  if (host.startsWith('uat.')) {
    return {
      name: 'uat', titlePrefix: /^\[UAT\]/, banner: true,
      bannerText: /not production/i, mailLink: false, trakletProxy: 200, trakletWidget: true,
    };
  }
  return {
    name: 'production', titlePrefix: /^(?!\[)/, banner: false,
    mailLink: false, trakletProxy: 404, trakletWidget: false,
  };
}

const env = contractFor(BASE_URL);

test.describe(`environment contract: ${env.name} (${BASE_URL})`, () => {
  test('server-rendered title carries the correct env prefix', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(env.titlePrefix);
  });

  test(`env banner is ${env.banner ? 'visible with the right label' : 'ABSENT (clean prod chrome)'}`, async ({ page }) => {
    await page.goto(BASE_URL);
    const banner = page.locator('#env-banner');
    if (env.banner) {
      await expect(banner).toBeVisible();
      if (env.bannerText) await expect(banner).toContainText(env.bannerText);
    } else {
      await expect(banner).toHaveCount(0);
    }
  });

  test(`captured-mail link is ${env.mailLink ? 'present (dev captures mail)' : 'absent (mail is delivered here)'}`, async ({ page }) => {
    await page.goto(BASE_URL);
    const link = page.locator('#env-banner-mail');
    if (env.mailLink) {
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('href', /mailpit\.dev\.noctusoft\.com/);
    } else {
      await expect(link).toHaveCount(0);
    }
  });

  test(`traklet proxy answers ${env.trakletProxy} here`, async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/dev/traklet-proxy/rate_limit`);
    expect(res.status(), `proxy gate for ${env.name}`).toBe(env.trakletProxy);
  });

  test(`traklet widget ${env.trakletWidget ? 'mounts' : 'is NOT present'} in the page`, async ({ page }) => {
    await page.goto(BASE_URL);
    const widget = page.locator('traklet-widget');
    if (env.trakletWidget) {
      await expect(widget).toBeAttached({ timeout: 20_000 });
      await expect(page.getByText(/Traklet failed to load/i)).toHaveCount(0);
    } else {
      await expect(widget).toHaveCount(0);
    }
  });

  test('app is healthy (API responds)', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/system/health-check`);
    expect(res.status(), await res.text().catch(() => '')).toBeLessThan(500);
  });
});
