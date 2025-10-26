/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@libsql/client'],
  images: {
    domains: ['localhost:7777', 'blessbox.org']
  }
}

module.exports = nextConfig
