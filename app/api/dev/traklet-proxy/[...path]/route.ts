import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/utils/env';
import { rateLimit, rateLimitResponse } from '@/lib/security/rateLimit';
import { relayBaseUrl, gatewayAuthToken } from '@/lib/services/gatewayConfig';
import { isProductionEnv } from '@/lib/env-chrome/resolve';

/**
 * Proxy for the Traklet widget (QA testing tool) — DEVELOPMENT ONLY.
 *
 * The Traklet GitHub adapter is configured client-side with `baseUrl` pointing
 * to this route. Instead of holding a GitHub PAT, this proxy forwards to the
 * Noctusoft relay's scoped `/github` endpoint, authenticating with the app's
 * Vercel OIDC identity (or NOCTUSOFT_DEPLOY_KEY locally). The relay injects the
 * GitHub token server-side, so BlessBox holds no GitHub credential at all.
 *
 * Containment (defense-in-depth; the relay also enforces the same):
 *   1. Hard-off in production, and off unless NEXT_PUBLIC_TRAKLET_ENABLED==='true'.
 *   2. Scope every request to the configured repo (TRAKLET_REPO) + /rate_limit.
 *   3. Allow only GET/POST/PATCH — PUT/DELETE are rejected.
 *   4. Rate-limit per IP.
 */

const ALLOWED_METHODS = new Set(['GET', 'POST', 'PATCH']);
const DEFAULT_REPO = 'rvegajr/blessbox';

function notFound() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

async function handle(request: NextRequest, method: string): Promise<Response> {
  // Non-prod only, off by default: a 404 hides the route's existence in the
  // production environment or whenever Traklet is not explicitly enabled.
  // Gate on the resolved *environment* (APP_ENV), NOT NODE_ENV — Vercel builds
  // dev/uat with NODE_ENV=production too, which would 404 the proxy on the very
  // environments where Traklet is meant to run.
  if (isProductionEnv() || getEnv('NEXT_PUBLIC_TRAKLET_ENABLED') !== 'true') {
    return notFound();
  }

  // Authenticate to the relay (Vercel OIDC preferred, NOCTUSOFT_DEPLOY_KEY
  // fallback for local dev). The relay holds/injects the GitHub token.
  const auth = await gatewayAuthToken();
  if (!auth) {
    return NextResponse.json(
      { error: 'Relay auth not configured (set NOCTUSOFT_DEPLOY_KEY for local dev)' },
      { status: 503 },
    );
  }

  const rl = rateLimit(request, { key: 'traklet-proxy:ip', limit: 30, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSec);

  if (!ALLOWED_METHODS.has(method)) {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  // Build upstream path: everything after `/api/dev/traklet-proxy`.
  const url = new URL(request.url);
  const prefix = '/api/dev/traklet-proxy';
  const idx = url.pathname.indexOf(prefix);
  const subpath = idx >= 0 ? url.pathname.slice(idx + prefix.length) : '';

  // Scope to the one configured repo (belt-and-suspenders with the relay).
  const repo = getEnv('TRAKLET_REPO', DEFAULT_REPO);
  const repoPrefix = `/repos/${repo}`;
  const allowedExact = new Set(['/rate_limit', repoPrefix]);
  const scoped =
    !subpath.includes('..') &&
    (allowedExact.has(subpath) || subpath.startsWith(`${repoPrefix}/`));
  if (!scoped) {
    return NextResponse.json({ error: 'Forbidden: path is out of scope' }, { status: 403 });
  }

  // Forward to the relay's /github proxy; it injects the GitHub token.
  const upstream = `${relayBaseUrl()}/github${subpath}${url.search}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${auth}`,
    Accept: request.headers.get('accept') ?? 'application/vnd.github.v3+json',
  };
  const contentType = request.headers.get('content-type');
  if (contentType) headers['Content-Type'] = contentType;

  const init: RequestInit = { method, headers };
  if (method !== 'GET' && method !== 'HEAD') {
    init.body = await request.text();
  }

  const upstreamRes = await fetch(upstream, init);
  const body = await upstreamRes.text();
  return new NextResponse(body, {
    status: upstreamRes.status,
    headers: {
      'Content-Type':
        upstreamRes.headers.get('content-type') ?? 'application/json',
    },
  });
}

export async function GET(req: NextRequest) {
  return handle(req, 'GET');
}
export async function POST(req: NextRequest) {
  return handle(req, 'POST');
}
export async function PATCH(req: NextRequest) {
  return handle(req, 'PATCH');
}
// PUT and DELETE are intentionally not exported: destructive GitHub operations
// (repo/issue deletion, collaborator/branch-protection changes) must not be
// reachable through an unauthenticated proxy. Next.js returns 405 for them.
