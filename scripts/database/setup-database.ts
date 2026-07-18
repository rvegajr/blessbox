#!/usr/bin/env tsx
// Database setup script for BlessBox (libsql/sqlite via Turso-compatible client)
import { config } from 'dotenv';
import { ensureDbReady } from '../../lib/db-ready';
import { assertNonProductionDatabase } from '../../lib/security/dbSafety';

config({ path: '.env.local' });

async function setupDatabase() {
  const isTest = process.argv.includes('--test');
  if (isTest) {
    // Force a throwaway local sqlite file for test scaffolding — do NOT inherit a
    // (possibly production) TURSO_DATABASE_URL from .env.local.
    process.env.TURSO_DATABASE_URL = 'file:./.tmp/test-db.sqlite';
    process.env.TURSO_AUTH_TOKEN = '';
  }

  // SECURITY: never scaffold/seed over production data. Explicit override for the
  // rare case of intentionally initializing a fresh prod DB.
  const allowProd = ['true', '1', 'yes'].includes((process.env.ALLOW_PROD_DB_SETUP || '').toLowerCase());
  if (!allowProd) {
    assertNonProductionDatabase('database setup');
  }

  console.log('🚀 Setting up BlessBox database...\n');
  await ensureDbReady();
  console.log('✅ Database schema is ready.');

  console.log('\n📋 Next steps:');
  console.log('   1. Start the development server: npm run dev');
  console.log('   2. Visit http://localhost:7777');
  console.log('   3. Complete onboarding to create your organization + QR codes');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase().catch((e) => {
    console.error('❌ Database setup failed:', e);
    process.exit(1);
  });
}

export { setupDatabase };