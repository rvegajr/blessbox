/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@libsql/client'],
  images: {
    domains: ['localhost:7777', 'blessbox.org', 'dev.blessbox.org']
  },
  experimental: {
    serverComponentsExternalPackages: ['@libsql/client']
  }
}

module.exports = nextConfig
