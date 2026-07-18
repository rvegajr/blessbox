import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/utils/env';
import { rateLimit, rateLimitResponse } from '@/lib/security/rateLimit';

/**
 * Proxy for the Traklet widget (QA testing tool).
 *
 * The Traklet GitHub adapter is configured client-side with `baseUrl` pointing
 * to this route. We strip the placeholder Authorization header sent by the
 * widget and re-attach the server-side `TRAKLET_PAT` before forwarding to
 * `https://api.github.com`. The PAT is therefore never exposed to the browser.
 *
 * SECURITY — this route re-attaches the server's GitHub PAT with NO caller
 * authentication (the widget runs in the browser and cannot hold a secret), so
 * it is a confused-deputy by design. To contain the blast radius we:
 *   1. Only enable when NEXT_PUBLIC_TRAKLET_ENABLED === 'true'.
 *   2. Scope every request to the single configured repo (TRAKLET_REPO), so the
 *      PAT can never reach other repos or become a general api.github.com SSRF.
 *   3. Allow only GET/POST/PATCH — PUT/DELETE (repo/issue deletion, collaborator
 *      or branch-protection changes) are rejected.
 *   4. Rate-limit per IP.
 * The residual (anonymous, rate-limited issue/comment writes on one repo that is
 * already public) is low. Consider disabling on public hosts per env.template,
 * which documents this widget as DEVELOPMENT ONLY.
 */

const GITHUB_API = 'https://api.github.com';
const ALLOWED_METHODS = new Set(['GET', 'POST', 'PATCH']);
const DEFAULT_REPO = 'rvegajr/blessbox';

function notFound() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

async function handle(request: NextRequest, method: string): Promise<Response> {
  // Off by default: a 404 hides the route's existence unless Traklet is enabled.
  if (getEnv('NEXT_PUBLIC_TRAKLET_ENABLED') !== 'true') {
    return notFound();
  }

  const token = getEnv('TRAKLET_PAT');
  if (!token) {
    return NextResponse.json(
      { error: 'TRAKLET_PAT is not configured on the server' },
      { status: 503 },
    );
  }

  // Per-IP rate limit — the PAT has no per-caller auth, so throttle abuse.
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

  // Scope the PAT to the one configured repo. Reject anything else so the token
  // cannot reach other repos or arbitrary api.github.com endpoints.
  const repo = getEnv('TRAKLET_REPO', DEFAULT_REPO);
  const repoPrefix = `/repos/${repo}`;
  const allowedExact = new Set(['/rate_limit', repoPrefix]);
  const scoped =
    !subpath.includes('..') &&
    (allowedExact.has(subpath) || subpath.startsWith(`${repoPrefix}/`));
  if (!scoped) {
    return NextResponse.json({ error: 'Forbidden: path is out of scope' }, { status: 403 });
  }

  const upstream = `${GITHUB_API}${subpath}${url.search}`;

  // Forward only safe headers; replace Authorization with the server PAT.
  const headers: Record<string, string> = {
    Authorization: `token ${token}`,
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
