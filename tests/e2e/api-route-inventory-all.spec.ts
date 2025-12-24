import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs/promises';

const BASE_URL = process.env.BASE_URL || 'http://localhost:7777';
const TEST_ENV = process.env.TEST_ENV || 'local';
const IS_PRODUCTION = TEST_ENV === 'production' || /blessbox\.org/i.test(BASE_URL);

type RouteCheck = {
  routeFile: string;
  urlPath: string;
  isDynamic: boolean;
};

async function fileExists(p: string) {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function collectApiRoutes(): Promise<RouteCheck[]> {
  const apiRoot = path.join(process.cwd(), 'app', 'api');
  if (!(await fileExists(apiRoot))) {
    throw new Error(`Cannot find API root at ${apiRoot}`);
  }

  const routes: RouteCheck[] = [];

  async function walk(dir: string, segments: string[]) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        await walk(full, [...segments, ent.name]);
        continue;
      }

      if (!ent.isFile() || ent.name !== 'route.ts') continue;

      // Build URL path from folder segments under app/api
      // Replace dynamic segments with stable placeholders
      let isDynamic = false;
      const urlSegments: string[] = [];

      for (const seg of segments) {
        if (seg.startsWith('(') && seg.endsWith(')')) {
          // route group - ignored in URL
          continue;
        }

        if (seg.startsWith('[') && seg.endsWith(']')) {
          isDynamic = true;

          // Catch-all e.g. [...nextauth]
          if (seg.startsWith('[...')) {
            // We don't hit the literal catch-all path; instead we'll cover standard NextAuth endpoints separately.
            urlSegments.push('__CATCH_ALL__');
            continue;
          }

          // Simple dynamic e.g. [id]
          urlSegments.push('test-id');
          continue;
        }

        urlSegments.push(seg);
      }

      const urlPath = `/api/${urlSegments.join('/')}`.replace(/\/+/g, '/');
      routes.push({ routeFile: full, urlPath, isDynamic });
    }
  }

  await walk(apiRoot, []);

  // Expand NextAuth catch-all into concrete endpoints we can actually hit
  const expanded: RouteCheck[] = [];
  for (const r of routes) {
    if (r.urlPath.includes('__CATCH_ALL__')) {
      expanded.push(
        { routeFile: r.routeFile, urlPath: '/api/auth/session', isDynamic: false },
        { routeFile: r.routeFile, urlPath: '/api/auth/providers', isDynamic: false },
        { routeFile: r.routeFile, urlPath: '/api/auth/csrf', isDynamic: false },
        { routeFile: r.routeFile, urlPath: '/api/auth/signin', isDynamic: false },
        { routeFile: r.routeFile, urlPath: '/api/auth/signout', isDynamic: false }
      );
      continue;
    }
    expanded.push(r);
  }

  // De-dupe by urlPath
  const seen = new Set<string>();
  return expanded.filter((r) => {
    if (seen.has(r.urlPath)) return false;
    seen.add(r.urlPath);
    return true;
  });
}

function shouldAllow404(route: RouteCheck): boolean {
  // Dynamic routes can legitimately 404 for missing records.
  if (route.isDynamic) return true;

  // In production, local-only test helpers intentionally return 404.
  if (IS_PRODUCTION) {
    if (route.urlPath.startsWith('/api/test/') && !['/api/test/login', '/api/test/seed-prod'].includes(route.urlPath)) {
      return true;
    }
  }

  return false;
}

test.describe('API Route Inventory (auto, all app/api routes)', () => {
  test('Every API route responds (no 5xx; no unexpected 404)', async ({ request }) => {
    const routes = await collectApiRoutes();

    // Sanity
    expect(routes.length).toBeGreaterThan(10);

    const failures: Array<{ urlPath: string; status: number; routeFile: string; note: string }> = [];

    for (const r of routes) {
      const url = `${BASE_URL}${r.urlPath}`;

      // Use GET only to avoid unintended side effects in production.
      const resp = await request.get(url);
      const status = resp.status();

      if (status >= 500) {
        failures.push({ urlPath: r.urlPath, status, routeFile: r.routeFile, note: '5xx' });
        continue;
      }

      // If the route is POST-only, Next should return 405. That's fine: it proves the route exists.
      // Auth-protected routes may return 401/403. Also fine.

      if (status === 404 && !shouldAllow404(r)) {
        failures.push({ urlPath: r.urlPath, status, routeFile: r.routeFile, note: 'unexpected 404' });
      }
    }

    if (failures.length) {
      const report = failures
        .map((f) => `- ${f.status} ${f.urlPath} (${f.note}) [${path.relative(process.cwd(), f.routeFile)}]`)
        .join('\n');
      throw new Error(`API route inventory failed (${failures.length}):\n${report}`);
    }
  });
});
