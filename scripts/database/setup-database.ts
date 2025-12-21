#!/usr/bin/env tsx
// Database setup script for BlessBox (libsql/sqlite via Turso-compatible client)
import { config } from 'dotenv';
import { ensureDbReady } from '../../lib/db-ready';

config({ path: '.env.local' });

async function setupDatabase() {
  const isTest = process.argv.includes('--test');
  if (isTest) {
    // Use a throwaway local sqlite file for test scaffolding.
    process.env.TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL || 'file:./.tmp/test-db.sqlite';
    process.env.TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN || '';
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