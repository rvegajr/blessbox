/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@libsql/client'],
  images: {
    domains: ['localhost:7777', 'blessbox.org', 'dev.blessbox.org']
  },
  // Default port configuration
  env: {
    PORT: '7777'
  }
}

export default nextConfig
