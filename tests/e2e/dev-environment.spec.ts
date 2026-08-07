import { test, expect, type APIRequestContext } from '@playwright/test';

/**
 * Dev-environment health check — verifies the fixes from the "make dev usable"
 * work against the LIVE dev deployment:
 *   1. the [DEV] banner carries a "View captured mail" link to smtp4dev, and
 *   2. the Traklet proxy is reachable (no longer 404'd by the NODE_ENV gate), and
 *   3. a full login works end-to-end by reading the code from the mail sink.
 *
 * This targets dev.blessbox.org (NOT localhost), so it is intentionally NOT in
 * the localhost smoke suite. Run it explicitly after a dev deploy:
 *   BASE_URL=https://dev.blessbox.org npx playwright test tests/e2e/dev-environment.spec.ts
 */
const BASE_URL = process.env.BASE_URL || 'https://dev.blessbox.org';
const MAIL_API = process.env.DEV_MAIL_API || 'https://mailpit.dev.noctusoft.com';

/** Poll the smtp4dev sink for the newest message to `recipient` and pull the 6-digit code. */
async function readLoginCode(request: APIRequestContext, recipient: string): Promise<string> {
  for (let attempt = 0; attempt < 15; attempt++) {
    const list = await request.get(
      `${MAIL_API}/api/Messages?pageSize=25&sortColumn=receivedDate&sortIsDescending=true`,
    );
    if (list.ok()) {
      const { results = [] } = await list.json();
      const hit = results.find((m: { to?: string[] }) =>
        (m.to || []).some((t) => t.toLowerCase() === recipient.toLowerCase()),
      );
      if (hit) {
        const body = await (await request.get(`${MAIL_API}/api/Messages/${hit.id}/source`)).text();
        const code = body.match(/\b\d{6}\b/)?.[0];
        if (code) return code;
      }
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`No captured login code for ${recipient} after polling smtp4dev`);
}

test.describe('dev environment', () => {
  test('[DEV] banner exposes a captured-mail link to smtp4dev', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/^\[DEV\]/);
    const mailLink = page.locator('#env-banner-mail');
    await expect(mailLink).toBeVisible();
    await expect(mailLink).toHaveAttribute('href', /mailpit\.dev\.noctusoft\.com/);
  });

  test('Traklet proxy is reachable (NODE_ENV gate fixed)', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/dev/traklet-proxy/rate_limit`);
    // 200 proves the env gate passes AND the relay accepts the dev deployment's
    // identity. A 404 would mean the proxy is still gated off on dev.
    expect(res.status(), await res.text()).toBe(200);
  });

  test('Traklet widget UX: mounts on the page and loads without error', async ({ page }) => {
    await page.goto(BASE_URL);
    // Traklet.init() appends a <traklet-widget> custom element (shadow DOM).
    // Its presence proves the dynamic import + init succeeded end-to-end.
    await expect(page.locator('traklet-widget')).toBeAttached({ timeout: 20_000 });
    // The wrapper renders a fixed error toast only when init threw.
    await expect(page.getByText(/Traklet failed to load/i)).toHaveCount(0);
    // And the widget's data path works from the browser: same-origin proxy call
    // (as the widget makes) answers 200, not 404/503.
    const proxied = await page.evaluate(async () => {
      const r = await fetch('/api/dev/traklet-proxy/rate_limit');
      return r.status;
    });
    expect(proxied).toBe(200);
  });

  test('full login works via the captured verification code', async ({ request }) => {
    const email = `bb-e2e-${Date.now()}@example.com`;

    const send = await request.post(`${BASE_URL}/api/auth/send-code`, { data: { email } });
    expect(send.ok(), await send.text()).toBeTruthy();

    const code = await readLoginCode(request, email);

    const verify = await request.post(`${BASE_URL}/api/auth/verify-code`, {
      data: { email, code },
    });
    expect(verify.ok(), await verify.text()).toBeTruthy();
    // Session cookie is set on success.
    const cookies = await request.storageState();
    expect(cookies.cookies.some((c) => c.name === 'bb_session')).toBeTruthy();
  });
});
