import { NextResponse, type NextRequest } from 'next/server'

/**
 * Per-request CSP nonce middleware.
 *
 * Generates a cryptographic nonce per request and exposes it via the `x-nonce`
 * request header so server components / app/layout.tsx can read it through
 * `headers()`.
 *
 * IMPORTANT (prod-readiness): we intentionally KEEP `'unsafe-inline'` in
 * script-src and do NOT inject `'strict-dynamic'`. The previous version dropped
 * `'unsafe-inline'` and added `'strict-dynamic'`, but the generated nonce is not
 * actually applied to Next.js's framework/Flight `<script>` tags (app/layout.tsx
 * reads the nonce but never passes it to a `<Script nonce>`), and Next's
 * automatic nonce propagation only triggers when the CSP is set on the *request*
 * header. The result was a latent site-wide client-JS break under strict-dynamic.
 * The nonce plumbing is left in place; enabling strict-dynamic requires wiring the
 * nonce onto every script per Next's official CSP pattern AND verifying hydration
 * of /register + checkout in a real browser first.
 */
export function middleware(request: NextRequest) {
  // crypto.randomUUID() is available in the Edge runtime.
  const nonce = crypto.randomUUID().replace(/-/g, '')

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // Expose the nonce for future strict-dynamic adoption. We do NOT tighten the
  // baseline CSP from next.config.js here — see the note above.
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
