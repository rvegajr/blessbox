import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:7777';
const TEST_ENV = process.env.TEST_ENV || 'local';
const IS_PRODUCTION = TEST_ENV === 'production' || /blessbox\.org/i.test(BASE_URL);

const PROD_TEST_LOGIN_SECRET = process.env.PROD_TEST_LOGIN_SECRET || '';
const PROD_TEST_SEED_SECRET = process.env.PROD_TEST_SEED_SECRET || '';
const HAS_PROD_SECRETS = !!(PROD_TEST_LOGIN_SECRET && PROD_TEST_SEED_SECRET);

type RouteCase = {
  name: string;
  path: string;
  setupSession?: boolean;
  allowAuthRedirect?: boolean;
};

async function primeSession(page: any) {
  await page.goto(BASE_URL);
  await page.evaluate(() => {
    sessionStorage.clear();
    sessionStorage.setItem('onboarding_organizationId', 'org_test_local');
    sessionStorage.setItem('onboarding_emailVerified', 'true');
  });
}

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

async function seedOrg(page: any, seedKey: string) {
  if (IS_PRODUCTION) {
    if (!HAS_PROD_SECRETS) throw new Error('Production seeding requires PROD_TEST_SEED_SECRET');
    const resp = await page.request.post(`${BASE_URL}/api/test/seed-prod`, {
      headers: { 'x-test-seed-secret': PROD_TEST_SEED_SECRET },
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

async function loginAsUser(page: any, email: string, opts?: { organizationId?: string; admin?: boolean }) {
  if (IS_PRODUCTION) {
    if (!HAS_PROD_SECRETS) throw new Error('Production login requires PROD_TEST_LOGIN_SECRET');
    const resp = await page.request.post(`${BASE_URL}/api/test/login`, {
      headers: { 'x-test-login-secret': PROD_TEST_LOGIN_SECRET },
      data: { email, organizationId: opts?.organizationId, admin: !!opts?.admin, expiresIn: 3600 },
    });
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    expect(body.success).toBe(true);
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

test.describe('App Inventory Smoke (route coverage)', () => {
  test('Core routes load (or redirect) without 404/500', async ({ page }) => {
    test.setTimeout(120_000);
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // Seed an org and set a test user session so protected routes are fully testable.
    const seedData = await seedOrg(page, `inv-${Date.now()}`);
    await loginAsUser(page, seedData.contactEmail || 'seed-local@example.com', { organizationId: seedData.organizationId || 'org_test_local' });

    const routes: RouteCase[] = [
      // Public marketing
      { name: 'Home', path: '/' },
      { name: 'Pricing', path: '/pricing' },
      { name: 'Checkout', path: '/checkout' },

      // Onboarding (public pages, but some steps require session)
      { name: 'Onboarding: Organization Setup', path: '/onboarding/organization-setup' },
      { name: 'Onboarding: Email Verification', path: '/onboarding/email-verification' },
      { name: 'Onboarding: Form Builder', path: '/onboarding/form-builder', setupSession: true },
      { name: 'Onboarding: QR Configuration', path: '/onboarding/qr-configuration', setupSession: true },

      // Public registration (may show not-found if org/qr not seeded)
      { name: 'Registration (dynamic)', path: '/register/test-org/main-entrance' },

      // App pages (often require auth) — we accept auth redirect but not a 404 route
      { name: 'Dashboard', path: '/dashboard', allowAuthRedirect: true },
      { name: 'Dashboard: QR Codes', path: '/dashboard/qr-codes', allowAuthRedirect: true },
      { name: 'Dashboard: Registrations', path: '/dashboard/registrations', allowAuthRedirect: true },
      { name: 'Participants', path: '/participants', allowAuthRedirect: true },
      { name: 'Participants: New', path: '/participants/new', allowAuthRedirect: true },
      { name: 'Classes', path: '/classes', allowAuthRedirect: true },
      { name: 'Classes: New', path: '/classes/new', allowAuthRedirect: true },
      { name: 'Admin', path: '/admin', allowAuthRedirect: true },
      { name: 'Admin: Coupons', path: '/admin/coupons', allowAuthRedirect: true },
      { name: 'Admin: Analytics', path: '/admin/analytics', allowAuthRedirect: true },
    ];

    for (const r of routes) {
      if (r.setupSession) {
        await primeSession(page);
      }

      // For admin routes, switch to super-admin identity
      if (r.path.startsWith('/admin')) {
        await loginAsUser(page, 'admin@blessbox.app', { admin: true });
      }

      const resp = await page.goto(`${BASE_URL}${r.path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});

      const status = resp?.status();
      // If NextAuth redirects, Playwright may return the initial response; treat redirect as OK.
      if (status && status >= 500) {
        throw new Error(`[${r.name}] ${r.path} returned ${status}`);
      }

      // If this is an authenticated page, we accept seeing a sign-in UI or redirect URL.
      if (r.allowAuthRedirect) {
        const url = page.url();
        const looksLikeAuth =
          /\/api\/auth\/signin/i.test(url) ||
          (await page.locator('text=/sign in|login/i').first().isVisible().catch(() => false));
        if (looksLikeAuth) {
          // With QA auth enabled, we should NOT be redirected to auth UI.
          throw new Error(`[${r.name}] ${r.path} redirected to auth UI even with QA auth`);
        }
      }

      // For routes that should exist, ensure we did not land on the global 404 page.
      const isNotFound = await page.locator('text=Page not found').first().isVisible().catch(() => false);
      if (isNotFound && r.path !== '/register/test-org/main-entrance') {
        throw new Error(`[${r.name}] ${r.path} rendered NotFound UI`);
      }
    }

    // Hard fail on the specific regression we just fixed
    const joined = consoleErrors.join('\n');
    expect(joined).not.toMatch(/maximum update depth exceeded/i);
  });
});

