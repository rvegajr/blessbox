#!/usr/bin/env node
// 🎉 JOYFUL CHECK-IN MIGRATION SCRIPT - ADDING MAGICAL FIELDS! ✨

import { createClient } from '@libsql/client';
import { config } from 'dotenv';

// Load environment variables with PURE JOY! 🌟
config({ path: '.env.local' });

// SECURITY: never run ad-hoc schema DDL against production (use scripts/migrate.ts).
{
  const dbUrl = process.env.TURSO_DATABASE_URL || '';
  const allowProd = ['true', '1', 'yes'].includes((process.env.ALLOW_PROD_DB_SETUP || '').toLowerCase());
  if (/prod/i.test(dbUrl) && !allowProd) {
    console.error('[db-safety] Refusing to run schema DDL against a production-looking database (TURSO_DATABASE_URL contains "prod"). Set ALLOW_PROD_DB_SETUP=true to override.');
    process.exit(1);
  }
}

const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL || 'libsql://blessbox-local-rvegajr.aws-us-east-2.turso.io',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function addCheckInFields() {
  console.log('🚀 Starting CHECK-IN FIELDS migration with UNBRIDLED JOY! ✨');
  
  try {
    // Add the magical check-in fields to registrations table! 🎊
    console.log('📝 Adding checkInToken field...');
    await tursoClient.execute(`
      ALTER TABLE registrations ADD COLUMN checkInToken TEXT;
    `);

    console.log('📝 Adding checkedInAt field...');
    await tursoClient.execute(`
      ALTER TABLE registrations ADD COLUMN checkedInAt TEXT;
    `);

    console.log('📝 Adding checkedInBy field...');
    await tursoClient.execute(`
      ALTER TABLE registrations ADD COLUMN checkedInBy TEXT;
    `);

    console.log('📝 Adding tokenStatus field...');
    await tursoClient.execute(`
      ALTER TABLE registrations ADD COLUMN tokenStatus TEXT DEFAULT 'active' NOT NULL;
    `);

    // Create LIGHTNING FAST indexes! ⚡
    console.log('⚡ Creating UNIQUE check-in token index for SPEED OF LIGHT performance!');
    await tursoClient.execute(`
      CREATE UNIQUE INDEX IF NOT EXISTS registrations_check_in_token_idx ON registrations(checkInToken);
    `);

    console.log('⚡ Creating token status index for INSTANT queries!');
    await tursoClient.execute(`
      CREATE INDEX IF NOT EXISTS registrations_token_status_idx ON registrations(tokenStatus);
    `);

    console.log('🎊 CHECK-IN FIELDS MIGRATION COMPLETED WITH PURE JOY! ✨');
    console.log('🚀 Database is now ready for MAGICAL QR check-ins! 🎉');
    
  } catch (error) {
    console.error('💔 Migration failed, but we will overcome with DETERMINATION!', error);
    process.exit(1);
  } finally {
    tursoClient.close();
  }
}

// Execute with MAXIMUM ENTHUSIASM! 🎊
addCheckInFields();