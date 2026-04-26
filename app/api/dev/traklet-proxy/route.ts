import { NextRequest, NextResponse } from 'next/server';

/**
 * Dev-only proxy for the Traklet widget.
 *
 * The Traklet GitHub adapter is configured client-side with `baseUrl` pointing
 * to this route. We strip the placeholder Authorization header sent by the
 * widget and re-attach the server-side `TRAKLET_PAT` before forwarding to
 * `https://api.github.com`. The PAT is therefore never exposed to the browser.
 *
 * Hard-gated to non-production: even if `TRAKLET_PAT` is accidentally set in
 * a production environment this handler returns 404.
 */

const GITHUB_API = 'https://api.github.com';

function isDev(): boolean {
  return process.env.NODE_ENV !== 'production';
}

async function handle(request: NextRequest, method: string): Promise<Response> {
  if (!isDev()) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const token = process.env.TRAKLET_PAT;
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
