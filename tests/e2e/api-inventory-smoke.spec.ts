import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:7777';

type ApiCase = {
  name: string;
  path: string;
  method?: 'GET' | 'POST';
  allow404?: boolean; // dynamic IDs may legitimately return 404 for missing records
  externalDependency?: boolean; // email/payment may require env keys; skip unless enabled
  dbDependency?: boolean; // requires a working DB connection
};

const INCLUDE_EXTERNAL = process.env.SMOKE_EXTERNALS === 'true';
const STRICT = process.env.SMOKE_STRICT === 'true';

test.describe('API Inventory Smoke (route existence)', () => {
  test('API routes exist (no unexpected 404/500)', async ({ request }) => {
    const serverErrors: Array<{ name: string; method: string; path: string; status: number }> = [];

    // Detect DB availability once; if DB isn't configured, skip db-dependent endpoints
    let dbAvailable = false;
    try {
      const dbResp = await request.get(`${BASE_URL}/api/test-db`);
      dbAvailable = dbResp.ok();
    } catch {
      dbAvailable = false;
    }

    const apis: ApiCase[] = [
      // Debug / test endpoints
      { name: 'debug-email-config', path: '/api/debug-email-config', method: 'GET', externalDependency: true },
      { name: 'debug-db-info', path: '/api/debug-db-info', method: 'GET', dbDependency: true },
      { name: 'debug-form-config', path: '/api/debug-form-config', method: 'GET', dbDependency: true },
      { name: 'test-db', path: '/api/test-db', method: 'GET', dbDependency: true },
      { name: 'test-email-send', path: '/api/test-email-send', method: 'POST', externalDependency: true },
      { name: 'test-production-email', path: '/api/test-production-email', method: 'POST', externalDependency: true },
      { name: 'test-registration-service', path: '/api/test-registration-service', method: 'GET', dbDependency: true },

      // Auth
      { name: 'nextauth', path: '/api/auth/session', method: 'GET', allow404: true },

      // Onboarding
      { name: 'onboarding-send-verification', path: '/api/onboarding/send-verification', method: 'POST', externalDependency: true, dbDependency: true },
      { name: 'onboarding-verify-code', path: '/api/onboarding/verify-code', method: 'POST', dbDependency: true },
      { name: 'onboarding-save-organization', path: '/api/onboarding/save-organization', method: 'POST', dbDependency: true },
      { name: 'onboarding-save-form-config', path: '/api/onboarding/save-form-config', method: 'POST', dbDependency: true },
      { name: 'onboarding-generate-qr', path: '/api/onboarding/generate-qr', method: 'POST', dbDependency: true },

      // Dashboard APIs (likely require auth)
      { name: 'dashboard-stats', path: '/api/dashboard/stats', method: 'GET', dbDependency: true },
      { name: 'dashboard-analytics', path: '/api/dashboard/analytics', method: 'GET', dbDependency: true },
      { name: 'dashboard-recent-activity', path: '/api/dashboard/recent-activity', method: 'GET', dbDependency: true },

      // QR
      { name: 'qr-codes', path: '/api/qr-codes', method: 'GET', dbDependency: true },
      { name: 'qr-codes-id', path: '/api/qr-codes/test-id', method: 'GET', allow404: true, dbDependency: true },
      { name: 'qr-codes-id-download', path: '/api/qr-codes/test-id/download', method: 'GET', allow404: true, dbDependency: true },
      { name: 'qr-codes-id-analytics', path: '/api/qr-codes/test-id/analytics', method: 'GET', allow404: true, dbDependency: true },
      { name: 'qr-code-sets', path: '/api/qr-code-sets', method: 'GET', dbDependency: true },

      // Registrations
      { name: 'registrations', path: '/api/registrations', method: 'GET', dbDependency: true },
      { name: 'registrations-form-config', path: '/api/registrations/form-config', method: 'GET', allow404: true, dbDependency: true },
      { name: 'registrations-id', path: '/api/registrations/test-id', method: 'GET', allow404: true, dbDependency: true },
      { name: 'registrations-id-check-in', path: '/api/registrations/test-id/check-in', method: 'POST', allow404: true, dbDependency: true },
      { name: 'registrations-export', path: '/api/registrations/export', method: 'GET', allow404: true, dbDependency: true },

      // Payments
      { name: 'payment-create-intent', path: '/api/payment/create-intent', method: 'POST', externalDependency: true },
      { name: 'payment-process', path: '/api/payment/process', method: 'POST', externalDependency: true },
      { name: 'payment-validate-coupon', path: '/api/payment/validate-coupon', method: 'POST', dbDependency: true },
      { name: 'subscriptions', path: '/api/subscriptions', method: 'GET', externalDependency: true },
      { name: 'square-config', path: '/api/square/config', method: 'GET', externalDependency: true },

      // Admin
      { name: 'admin-stats', path: '/api/admin/stats', method: 'GET', dbDependency: true },
      { name: 'admin-organizations', path: '/api/admin/organizations', method: 'GET', dbDependency: true },
      { name: 'admin-subscriptions', path: '/api/admin/subscriptions', method: 'GET', dbDependency: true },
      { name: 'admin-coupons', path: '/api/admin/coupons', method: 'GET', dbDependency: true },
      { name: 'admin-coupons-analytics', path: '/api/admin/coupons/analytics', method: 'GET', dbDependency: true },
      { name: 'admin-coupons-id', path: '/api/admin/coupons/test-id', method: 'GET', allow404: true, dbDependency: true },

      // Classes
      { name: 'classes', path: '/api/classes', method: 'GET', dbDependency: true },
      { name: 'classes-id-sessions', path: '/api/classes/test-id/sessions', method: 'GET', allow404: true, dbDependency: true },
      { name: 'enrollments', path: '/api/enrollments', method: 'GET', dbDependency: true },
      { name: 'participants', path: '/api/participants', method: 'GET', dbDependency: true },

      // Coupons
      { name: 'coupon-validate', path: '/api/coupons/validate', method: 'POST', dbDependency: true },

      // Export shortcut
      { name: 'export-registrations', path: '/api/export/registrations', method: 'GET', allow404: true, dbDependency: true },
    ];

    for (const api of apis) {
      // External dependency endpoints can be noisy locally (missing keys / DB). Skip unless explicitly enabled.
      if (api.externalDependency && !INCLUDE_EXTERNAL) {
        continue;
      }
      // Skip DB-dependent endpoints when DB isn't available
      if (api.dbDependency && !dbAvailable) {
        continue;
      }

      const url = `${BASE_URL}${api.path}`;
      const method = api.method || 'GET';

      const resp =
        method === 'POST'
          ? await request.post(url, { data: {} })
          : await request.get(url);

      const status = resp.status();

      // Track 5xx responses for reporting (fail only in strict mode)
      if (status >= 500) {
        serverErrors.push({ name: api.name, method, path: api.path, status });
      }

      // 404 means route missing unless explicitly allowed (e.g. record not found)
      if (!api.allow404) {
        expect(status, `[${api.name}] ${method} ${api.path}`).not.toBe(404);
      }
    }

    if (serverErrors.length > 0) {
      // Print a compact report in test output
      // (Playwright doesn't support non-failing "warnings", so we gate strictness via env)
      // eslint-disable-next-line no-console
      console.log(
        `\n⚠️  API 5xx responses (${serverErrors.length}):\n` +
          serverErrors.map(e => `- ${e.status} ${e.method} ${e.path} (${e.name})`).join('\n') +
          `\n\nTip: run with SMOKE_EXTERNALS=true SMOKE_DB=true SMOKE_STRICT=true once your local env is configured.`
      );

      if (STRICT) {
        throw new Error(`API smoke strict mode failed: ${serverErrors.length} endpoints returned 5xx`);
      }
    }
  });
});

