import type { Config } from 'drizzle-kit';

export default {
  schema: './src/database/schema.ts',
  out: './src/database/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL || 'libsql://blessbox-local-rvegajr.aws-us-east-2.turso.io',
    ...(process.env.TURSO_AUTH_TOKEN && { token: process.env.TURSO_AUTH_TOKEN }),
  },
} satisfies Config;