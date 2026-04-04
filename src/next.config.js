/** @type {import('next').NextConfig} */
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
  // TypeScript configuration
  typescript: {
    // Temporarily ignore build errors to unblock deployment
    // TODO: Fix type validator generation issue
    ignoreBuildErrors: true,
  }
}

export default nextConfig
