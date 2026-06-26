import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/utils/env';

/**
 * Proxy for the Traklet widget (QA testing tool).
 *
 * The Traklet GitHub adapter is configured client-side with `baseUrl` pointing
 * to this route. We strip the placeholder Authorization header sent by the
 * widget and re-attach the server-side `TRAKLET_PAT` before forwarding to
 * `https://api.github.com`. The PAT is therefore never exposed to the browser.
 *
 * Available in production when NEXT_PUBLIC_TRAKLET_ENABLED and TRAKLET_PAT are
 * both explicitly set, enabling QA testing on live production site.
 */

const GITHUB_API = 'https://api.github.com';

async function handle(request: NextRequest, method: string): Promise<Response> {
  // Off by default: this route re-attaches the server-side GitHub PAT, so it must
  // only be reachable when Traklet is explicitly enabled (matches the documented
  // contract). A 404 hides its existence otherwise.
  if (getEnv('NEXT_PUBLIC_TRAKLET_ENABLED') !== 'true') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const token = getEnv('TRAKLET_PAT');
  if (!token) {
    return NextResponse.json(
      { error: 'TRAKLET_PAT is not configured on the server' },
      { status: 503 },
    );
  }

  // Build upstream URL: everything after `/api/dev/traklet-proxy` is forwarded
  // verbatim (including the query string) to `api.github.com`.
  const url = new URL(request.url);
  const prefix = '/api/dev/traklet-proxy';
  const idx = url.pathname.indexOf(prefix);
  const subpath = idx >= 0 ? url.pathname.slice(idx + prefix.length) : '';
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
export async function PUT(req: NextRequest) {
  return handle(req, 'PUT');
}
export async function DELETE(req: NextRequest) {
  return handle(req, 'DELETE');
}
