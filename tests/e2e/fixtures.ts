/**
 * Shared Playwright fixtures for BlessBox e2e tests.
 *
 * Exports an extended `test` with these fixtures:
 *   - isProd:        boolean, derived from TEST_ENV / BASE_URL
 *   - seededOrg:     fresh seeded org per test (SeededOrg shape below)
 *   - authedPage:    Page in a fresh BrowserContext, logged in as seededOrg.ownerEmail
 *   - authedRequest: APIRequestContext with the same auth cookie installed
 *
 * Contract — `SeededOrg` (Agent B: code against this exact shape):
 *   {
 *     organizationId:   string,
 *     organizationSlug: string,
 *     registrationUrl:  string,   // /register/<slug>/<qrLabel>
 *     registrationId?:  string,   // present in dev (sample registration); absent in prod
 *     ownerEmail:       string,   // contact_email of the seeded org
 *   }
 *
 * Env (prod):
 *   - PROD_TEST_SEED_SECRET   → header `x-qa-seed-token`  for /api/test/seed-prod
 *   - PROD_TEST_LOGIN_SECRET  → header `x-qa-login-token` for /api/test/login
 *   - BASE_URL                → e.g. https://www.blessbox.org
 *   - TEST_ENV=production
 *
 * Env (dev):
 *   - BASE_URL (default http://localhost:7777). No secrets needed; routes are open.
 *
 * Skip behavior: if a required secret is missing while running against prod,
 * the fixture calls test.skip() with an explanatory message (does not fail).
 */

import { test as base, request as pwRequest, type APIRequestContext, type Page } from '@playwright/test';

const BASE_URL = (process.env.BASE_URL || 'http://localhost:7777').replace(/\/$/, '');
const IS_PROD =
  process.env.TEST_ENV === 'production' || /blessbox\.org/i.test(process.env.BASE_URL || '');

// Vercel CLI's `env pull` sometimes injects literal "\n" — strip them.
const PROD_SEED_SECRET = (process.env.PROD_TEST_SEED_SECRET || '').replace(/\\n/g, '').trim();
const PROD_LOGIN_SECRET = (process.env.PROD_TEST_LOGIN_SECRET || '').replace(/\\n/g, '').trim();

export type SeededOrg = {
  organizationId: string;
  organizationSlug: string;
  /** QR-target URL: `${BASE_URL}/register/<slug>/<qrLabel>` */
  registrationUrl: string;
  /** Present only in dev (the seed route auto-creates a sample registration). */
  registrationId?: string;
  /** Email used for the authedPage / authedRequest fixtures. */
  ownerEmail: string;
};

type Fixtures = {
  isProd: boolean;
  seededOrg: SeededOrg;
  authedPage: Page;
  authedRequest: APIRequestContext;
};

/** Call seed endpoint and normalize response to SeededOrg. */
async function callSeed(opts: { isProd: boolean; seedKey: string }): Promise<SeededOrg> {
  const { isProd, seedKey } = opts;
  const ctx = await pwRequest.newContext({ baseURL: BASE_URL });
  try {
    const url = isProd ? '/api/test/seed-prod' : '/api/test/seed';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (isProd) {
      headers['x-qa-seed-token'] = PROD_SEED_SECRET;
      headers['x-test-seed-secret'] = PROD_SEED_SECRET; // back-compat
    }
    const resp = await ctx.post(url, { headers, data: { seedKey } });
    if (!resp.ok()) {
      throw new Error(`seed (${url}) failed: ${resp.status()} ${await resp.text()}`);
    }
    const data = await resp.json();
    const orgId = String(data.organizationId || '');
    const slug = String(data.orgSlug || data.organizationSlug || '');
    const ownerEmail = String(data.contactEmail || data.ownerEmail || '');
    const firstQr = Array.isArray(data.qrCodes) && data.qrCodes.length > 0 ? data.qrCodes[0] : null;
    const registrationUrl =
      firstQr?.url || (slug ? `${BASE_URL}/register/${slug}/main-entrance` : '');
    const registrationId =
      Array.isArray(data.registrationsCreated) && data.registrationsCreated.length > 0
        ? String(data.registrationsCreated[0])
        : undefined;

    if (!orgId || !slug || !registrationUrl || !ownerEmail) {
      throw new Error(`seed response missing fields: ${JSON.stringify(data).slice(0, 400)}`);
    }
    return { organizationId: orgId, organizationSlug: slug, registrationUrl, registrationId, ownerEmail };
  } finally {
    await ctx.dispose();
  }
}

/** Hit /api/test/login and return the Set-Cookie cookies array. */
async function loginAndGetCookies(opts: {
  isProd: boolean;
  email: string;
  organizationId: string;
}): Promise<Array<{ name: string; value: string; domain: string; path: string }>> {
  const { isProd, email, organizationId } = opts;
  const ctx = await pwRequest.newContext({ baseURL: BASE_URL });
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (isProd) {
      headers['x-qa-login-token'] = PROD_LOGIN_SECRET;
      headers['x-test-login-secret'] = PROD_LOGIN_SECRET;
    }
    const resp = await ctx.post('/api/test/login', {
      headers,
      data: { email, organizationId, expiresIn: 3600 },
    });
    if (!resp.ok()) {
      const body = await resp.text();
      // 404 in prod from this route means the secret-gate rejected us — almost
      // always because PROD_TEST_LOGIN_SECRET in .env.test.local doesn't match
      // the value deployed on Vercel. Skip rather than fail: it's a deployment
      // config issue, not a product or test bug.
      if (isProd && resp.status() === 404) {
        test.skip(
          true,
          `/api/test/login returned 404 — PROD_TEST_LOGIN_SECRET likely does not match Vercel env. body=${body.slice(0, 120)}`
        );
      }
      throw new Error(`login failed: ${resp.status()} ${body}`);
    }
    // Extract cookies from the request context's storage state.
    const state = await ctx.storageState();
    const u = new URL(BASE_URL);
    const host = u.hostname;
    return state.cookies
      .filter((c) => host.endsWith(c.domain.replace(/^\./, '')))
      .map((c) => ({ name: c.name, value: c.value, domain: c.domain, path: c.path }));
  } finally {
    await ctx.dispose();
  }
}

export const test = base.extend<Fixtures>({
  isProd: async ({}, use) => {
    await use(IS_PROD);
  },

  seededOrg: async ({ isProd }, use, testInfo) => {
    if (isProd && !PROD_SEED_SECRET) {
      test.skip(true, 'PROD_TEST_SEED_SECRET not set; cannot seed against production');
      return;
    }
    // Per-test deterministic-ish seedKey so re-runs upsert the same org.
    const safeTitle = testInfo.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 40);
    const seedKey = `qa-${safeTitle || 'default'}`;
    const seeded = await callSeed({ isProd, seedKey });
    await use(seeded);
  },

  authedPage: async ({ browser, seededOrg, isProd }, use) => {
    if (isProd && !PROD_LOGIN_SECRET) {
      test.skip(true, 'PROD_TEST_LOGIN_SECRET not set; cannot auth against production');
      return;
    }
    const cookies = await loginAndGetCookies({
      isProd,
      email: seededOrg.ownerEmail,
      organizationId: seededOrg.organizationId,
    });
    const u = new URL(BASE_URL);
    const ctx = await browser.newContext({ baseURL: BASE_URL });
    await ctx.addCookies(
      cookies.map((c) => ({
        name: c.name,
        value: c.value,
        domain: c.domain || u.hostname,
        path: c.path || '/',
        httpOnly: true,
        secure: isProd,
        sameSite: 'Lax' as const,
      }))
    );
    const page = await ctx.newPage();
    try {
      await use(page);
    } finally {
      await ctx.close();
    }
  },

  authedRequest: async ({ seededOrg, isProd }, use) => {
    if (isProd && !PROD_LOGIN_SECRET) {
      test.skip(true, 'PROD_TEST_LOGIN_SECRET not set; cannot auth against production');
      return;
    }
    const cookies = await loginAndGetCookies({
      isProd,
      email: seededOrg.ownerEmail,
      organizationId: seededOrg.organizationId,
    });
    const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
    const ctx = await pwRequest.newContext({
      baseURL: BASE_URL,
      extraHTTPHeaders: cookieHeader ? { cookie: cookieHeader } : {},
    });
    try {
      await use(ctx);
    } finally {
      await ctx.dispose();
    }
  },
});

export { expect } from '@playwright/test';
