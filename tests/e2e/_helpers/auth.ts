/**
 * Shared QA-auth helpers for Playwright specs.
 *
 * Why this exists:
 *   Several specs had a local `loginAsUser(page, ...)` that POSTed to
 *   /api/test/login via `page.request.post(...)`. Playwright's APIRequestContext
 *   stores Set-Cookie in its OWN cookie jar — those cookies do NOT propagate
 *   to the browser context the `page` actually navigates with. Result: tests
 *   logged in via API, then navigated and got bounced back to /login.
 *
 *   These helpers extract the auth cookies from the API response's storage
 *   state and explicitly install them on `page.context()` so subsequent
 *   navigations carry the session.
 *
 * Pollution-tolerance: secrets are stripped of literal "\n" / surrounding
 * whitespace in case they came from a Vercel `env pull` round-trip.
 */

import { request as pwRequest, expect, type Page } from '@playwright/test';

const BASE_URL = (process.env.BASE_URL || 'http://localhost:7777').replace(/\/$/, '');
const TEST_ENV = process.env.TEST_ENV || 'local';
const IS_PRODUCTION = TEST_ENV === 'production' || /blessbox\.org/i.test(process.env.BASE_URL || '');

const PROD_LOGIN_SECRET = (process.env.PROD_TEST_LOGIN_SECRET || '').replace(/\\n/g, '').trim();
const PROD_SEED_SECRET = (process.env.PROD_TEST_SEED_SECRET || '').replace(/\\n/g, '').trim();

export const HAS_PROD_LOGIN = !!PROD_LOGIN_SECRET;
export const HAS_PROD_SEED = !!PROD_SEED_SECRET;
export const HAS_PROD_SECRETS = HAS_PROD_LOGIN && HAS_PROD_SEED;
export { IS_PRODUCTION };

export type LoginOptions = {
  organizationId?: string;
  admin?: boolean;
  expiresIn?: number;
};

/**
 * Log in as a test user and install the auth cookie(s) on the page's
 * BrowserContext so subsequent page navigations carry the session.
 *
 * In dev, uses the cookie-bypass pattern accepted by middleware.
 * In prod, calls /api/test/login (requires PROD_TEST_LOGIN_SECRET).
 */
export async function loginAsUser(
  page: Page,
  email: string,
  opts: LoginOptions = {}
): Promise<void> {
  if (IS_PRODUCTION) {
    if (!HAS_PROD_LOGIN) {
      throw new Error('Production login requires PROD_TEST_LOGIN_SECRET');
    }
    // Use a dedicated request context so we can pull the Set-Cookie reliably
    // from its storage state, then install those cookies on the page's
    // BrowserContext (the bit `page.request.post` skipped).
    const ctx = await pwRequest.newContext({ baseURL: BASE_URL });
    try {
      const resp = await ctx.post('/api/test/login', {
        headers: {
          'Content-Type': 'application/json',
          'x-qa-login-token': PROD_LOGIN_SECRET,
          'x-test-login-secret': PROD_LOGIN_SECRET, // back-compat
        },
        data: {
          email,
          organizationId: opts.organizationId,
          admin: !!opts.admin,
          expiresIn: opts.expiresIn ?? 3600,
        },
      });
      if (!resp.ok()) {
        throw new Error(
          `/api/test/login failed: ${resp.status()} ${(await resp.text()).slice(0, 200)}`
        );
      }
      const state = await ctx.storageState();
      const u = new URL(BASE_URL);
      const host = u.hostname;
      const cookies = state.cookies
        .filter((c) => host.endsWith(c.domain.replace(/^\./, '')))
        .map((c) => ({
          name: c.name,
          value: c.value,
          domain: c.domain || u.hostname,
          path: c.path || '/',
          httpOnly: true,
          secure: true,
          sameSite: 'Lax' as const,
        }));
      if (cookies.length === 0) {
        throw new Error('/api/test/login returned no cookies — check NEXTAUTH_SECRET on Vercel');
      }
      await page.context().addCookies(cookies);
    } finally {
      await ctx.dispose();
    }
    return;
  }

  // Dev: middleware accepts a small set of bypass cookies.
  await page.context().addCookies(
    [
      { name: 'bb_test_auth', value: '1' },
      { name: 'bb_test_email', value: email },
      ...(opts.organizationId ? [{ name: 'bb_test_org_id', value: opts.organizationId }] : []),
      ...(opts.admin ? [{ name: 'bb_test_admin', value: '1' }] : []),
    ].map((c) => ({ ...c, url: BASE_URL }))
  );
}

/**
 * Seed an org. Returns the parsed body so callers can use `organizationId`,
 * `orgSlug`, `contactEmail`, `qrCodes`, etc.
 */
export async function seedOrg(page: Page, seedKey: string): Promise<any> {
  if (IS_PRODUCTION) {
    if (!HAS_PROD_SEED) throw new Error('Production seeding requires PROD_TEST_SEED_SECRET');
    const resp = await page.request.post(`${BASE_URL}/api/test/seed-prod`, {
      headers: {
        'x-qa-seed-token': PROD_SEED_SECRET,
        'x-test-seed-secret': PROD_SEED_SECRET,
      },
      data: { seedKey },
    });
    expect(resp.ok()).toBeTruthy();
    const data = await resp.json();
    expect(data.success).toBe(true);
    return data;
  }
  const resp = await page.request.post(`${BASE_URL}/api/test/seed`, { data: { seedKey } });
  expect(resp.ok()).toBeTruthy();
  const data = await resp.json();
  expect(data.success).toBe(true);
  return data;
}
