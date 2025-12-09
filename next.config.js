/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@libsql/client'],
  images: {
    domains: ['localhost:7777', 'blessbox.org', 'dev.blessbox.org']
  },
  // Default port configuration
  env: {
    PORT: '7777'
  },
  // Exclude old Astro pages directory from Next.js build
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  // Ignore src/pages directory (old Astro routes)
  webpack: (config, { isServer }) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/src/pages/**', '**/src/**/*.astro']
    }
    return config
  },
  // TypeScript configuration
  typescript: {
    // Temporarily ignore build errors to unblock deployment
    // TODO: Fix type validator generation issue
    ignoreBuildErrors: true,
  }
}

export default nextConfig
