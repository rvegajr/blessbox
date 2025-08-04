// 🎉 JOYFUL TURSO SCHEMA UPDATE - Adding passwordless magic! ✨
import { createClient } from '@libsql/client';

// 🚀 Set up our AMAZING Turso connection!
process.env.TURSO_DATABASE_URL = 'libsql://blessbox-local-rvegajr.aws-us-east-2.turso.io';
process.env.TURSO_AUTH_TOKEN = '***JWT_REDACTED***';

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