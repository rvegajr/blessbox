/** @type {import('next').NextConfig} */

const ContentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://web.squarecdn.com https://sandbox.web.squarecdn.com",
  "style-src 'self' 'unsafe-inline' https://*.squarecdn.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.squareup.com https://*.squarecdn.com https://*.turso.io https://*.browser-intake-datadoghq.com wss:",
  "frame-src https://*.squarecdn.com https://*.squareup.com",
  "font-src 'self' data: https://*.squarecdn.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests"
].join('; ')

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
  { key: 'Content-Security-Policy', value: ContentSecurityPolicy }
]

const nextConfig = {
  serverExternalPackages: ['@libsql/client'],
  images: {
    remotePatterns: [
      { hostname: 'localhost', port: '7777' },
      { hostname: 'blessbox.org' },
      { hostname: 'dev.blessbox.org' }
    ]
  },
  // Default port configuration
  env: {
    PORT: '7777'
  },
  // Exclude old Astro pages directory from Next.js build
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  // Turbopack configuration (Next.js 16 default)
  turbopack: {},
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders
      }
    ]
  }
}

export default nextConfig
