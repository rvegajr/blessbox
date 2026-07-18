// 🎉 JOYFUL TURSO SCHEMA UPDATE - Adding passwordless magic! ✨
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

// Load local env vars (DO NOT hardcode secrets)
dotenv.config({ path: '.env.local' });

// SECURITY: never run ad-hoc schema DDL against production. Use migrations for
// prod (scripts/migrate.ts). Explicit override for intentional prod init.
{
  const dbUrl = process.env.TURSO_DATABASE_URL || '';
  const allowProd = ['true', '1', 'yes'].includes((process.env.ALLOW_PROD_DB_SETUP || '').toLowerCase());
  if (/prod/i.test(dbUrl) && !allowProd) {
    console.error('[db-safety] Refusing to run schema DDL against a production-looking database (TURSO_DATABASE_URL contains "prod"). Set ALLOW_PROD_DB_SETUP=true to override.');
    process.exit(1);
  }
}

if (!process.env.TURSO_DATABASE_URL) {
  throw new Error('TURSO_DATABASE_URL is not set. Add it to your environment or .env.local');
}
if (!process.env.TURSO_AUTH_TOKEN) {
  throw new Error('TURSO_AUTH_TOKEN is not set. Add it to your environment or .env.local');
}

console.log('🎊 Updating Turso schema with PASSWORDLESS MAGIC! ✨');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

try {
  // 🔐 Add passwordHash column (nullable for passwordless!)
  console.log('🌟 Adding passwordHash column...');
  await client.execute(`
    ALTER TABLE organizations 
    ADD COLUMN password_hash TEXT;
  `);

  // ⏰ Add lastLoginAt column
  console.log('⏰ Adding lastLoginAt column...');
  await client.execute(`
    ALTER TABLE organizations 
    ADD COLUMN last_login_at TEXT;
  `);

  // ✨ Create login_codes table for passwordless magic!
  console.log('🚀 Creating login_codes table...');
  await client.execute(`
    CREATE TABLE IF NOT EXISTS login_codes (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      attempts INTEGER DEFAULT 0 NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      expires_at TEXT NOT NULL,
      verified INTEGER DEFAULT 0 NOT NULL
    )
  `);

  // 🎯 Create indexes for LIGHTNING FAST queries!
  console.log('⚡ Creating indexes...');
  await client.execute('CREATE INDEX IF NOT EXISTS login_codes_email_idx ON login_codes(email)');
  await client.execute('CREATE INDEX IF NOT EXISTS login_codes_expires_at_idx ON login_codes(expires_at)');

  console.log('🎉 SCHEMA UPDATE COMPLETE! Passwordless magic is READY! ✨');
  
  client.close();
} catch (error) {
  console.error('💔 Schema update failed:', error);
  process.exit(1);
}