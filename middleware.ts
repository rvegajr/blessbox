import { NextResponse, type NextRequest } from 'next/server'

/**
 * Per-request CSP nonce middleware.
 *
 * Generates a cryptographic nonce per request, exposes it via the
 * `x-nonce` request header (so server components / app/layout.tsx can
 * read it through `headers()`), and rewrites the response
 * `Content-Security-Policy` header to replace `'unsafe-inline'` in
 * `script-src` with `'nonce-<nonce>' 'strict-dynamic'`.
 *
 * The static CSP defined in next.config.js's `headers()` is the
 * baseline; this middleware overwrites the script-src directive
 * per-request so Next.js Flight payload <script> tags carrying the
 * matching nonce are accepted while inline scripts without the nonce
 * are rejected.
 */
export function middleware(request: NextRequest) {
  // crypto.randomUUID() is available in the Edge runtime.
  const nonce = crypto.randomUUID().replace(/-/g, '')

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // Read the baseline CSP set by next.config.js (if present) and
  // replace 'unsafe-inline' inside script-src with the nonce + strict-dynamic.
  const baselineCsp =
    response.headers.get('content-security-policy') ||
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://web.squarecdn.com https://sandbox.web.squarecdn.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.squareup.com https://*.squarecdn.com https://*.turso.io wss:",
      "frame-src https://*.squarecdn.com https://*.squareup.com",
      "font-src 'self' data:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      'upgrade-insecure-requests',
    ].join('; ')

  const tightened = baselineCsp
    .split(';')
    .map((directive) => {
      const trimmed = directive.trim()
      if (!trimmed.toLowerCase().startsWith('script-src')) return trimmed
      // Drop 'unsafe-inline' and inject nonce + strict-dynamic.
      const withoutUnsafeInline = trimmed.replace(/'unsafe-inline'/g, '').trim()
      return `${withoutUnsafeInline} 'nonce-${nonce}' 'strict-dynamic'`.replace(/\s+/g, ' ')
    })
    .filter(Boolean)
    .join('; ')

  response.headers.set('content-security-policy', tightened)
  // Also expose the nonce on the response for downstream consumers (debug aid).
  response.headers.set('x-nonce', nonce)

  return response
}

export const config = {
  // Run on all routes except Next internals and static assets.
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|woff|woff2|ttf|eot)).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
