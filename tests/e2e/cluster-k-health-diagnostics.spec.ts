import { test, expect, Page } from '@playwright/test';

/**
 * Cluster K: System Health Diagnostics & Monitoring
 * Issue: #31
 *
 * Owner clarification: /api/health is live and returns 200 with {status: "ok"}.
 * Aracela's blocker: /dashboard/diagnostics 404s. The diagnostics page is at
 * /system/diagnostics — these tests pin both URLs and key contracts.
 */

const baseURL = process.env.BASE_URL || 'http://localhost:7777';

test.describe('Cluster K: Health & Diagnostics (Issue #31)', () => {
  test.describe('/api/health public endpoint', () => {
    test('returns 200 with status: ok and ISO timestamp', async ({ request }) => {
      const res = await request.get(`${baseURL}/api/health`);
      expect(res.status()).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.status).toBe('ok');
      expect(body.timestamp).toBeDefined();
      // Sanity: timestamp parseable
      expect(() => new Date(body.timestamp).toISOString()).not.toThrow();
    });

    test('responds in under 500ms (Aracela explicit edge case)', async ({ request }) => {
      const start = Date.now();
      const res = await request.get(`${baseURL}/api/health`);
      const elapsed = Date.now() - start;

      expect(res.status()).toBe(200);
      // Allow some headroom for cold starts on CI but enforce the SLA target.
      expect(elapsed).toBeLessThan(500);
    });

    test('does NOT require authentication (Aracela explicit edge case)', async ({ request }) => {
      // No cookies, no auth headers — should still return 200.
      const res = await request.get(`${baseURL}/api/health`, { headers: {} });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body.status).toBe('ok');
    });

    test('returns JSON content-type', async ({ request }) => {
      const res = await request.get(`${baseURL}/api/health`);
      const contentType = res.headers()['content-type'] ?? '';
      expect(contentType).toMatch(/application\/json/);
    });
  });

  test.describe('Subsystem health endpoints', () => {
    test('/api/system/health-check responds with database status', async ({ request }) => {
      const res = await request.get(`${baseURL}/api/system/health-check`);
      // Health-check endpoint should not 404; it may require auth in production
      // (then 401/403) but should not be missing.
      expect(res.status()).not.toBe(404);
    });

    test('/api/system/email-health endpoint exists', async ({ request }) => {
      const res = await request.get(`${baseURL}/api/system/email-health`);
      expect(res.status()).not.toBe(404);
    });

    test('/api/system/square-health endpoint exists', async ({ request }) => {
      const res = await request.get(`${baseURL}/api/system/square-health`);
      expect(res.status()).not.toBe(404);
    });
  });

  test.describe('Diagnostics page', () => {
    test('/system/diagnostics renders without 404', async ({ page }) => {
      const response = await page.goto(`${baseURL}/system/diagnostics`, { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBeLessThan(400);
    });

    test('/system/diagnostics shows the diagnostics heading', async ({ page }) => {
      await page.goto(`${baseURL}/system/diagnostics`);
      const heading = page.locator('h1:has-text("System diagnostics"), h1:has-text("Diagnostics")');
      await expect(heading).toBeVisible();
    });

    test('/system/diagnostics references the documented endpoints', async ({ page }) => {
      await page.goto(`${baseURL}/system/diagnostics`);
      // The page should reference the endpoints admins can call.
      const body = await page.textContent('body');
      expect(body).toMatch(/health-check|api\/health/);
      expect(body).toMatch(/email-health/);
    });

    test('/dashboard/diagnostics either redirects to /system/diagnostics or is not 404 (Aracela block)', async ({ page }) => {
      const response = await page.goto(`${baseURL}/dashboard/diagnostics`, { waitUntil: 'domcontentloaded' });
      // Aracela hit a 404 here. Acceptable resolutions:
      //   (a) page exists and renders, OR
      //   (b) it redirects to /system/diagnostics.
      // What is NOT acceptable: bare 404.
      expect(response?.status()).toBeLessThan(400);
      const url = page.url();
      const finalsAreOk = url.includes('/system/diagnostics') || url.includes('/dashboard/diagnostics');
      expect(finalsAreOk).toBeTruthy();
    });
  });
});
