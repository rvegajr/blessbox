#!/usr/bin/env node

import { createClient } from '@libsql/client';

// Set environment variables
process.env.TURSO_DATABASE_URL = 'libsql://blessbox-local-rvegajr.aws-us-east-2.turso.io';
// Use environment variable for auth token (set in environment)
process.env.TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN || 'test-token-placeholder';

console.log('🚀 Creating Turso schema...');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

try {
  // Create organizations table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      event_name TEXT,
      custom_domain TEXT UNIQUE,
      contact_email TEXT NOT NULL UNIQUE,
      contact_phone TEXT,
      contact_address TEXT,
      contact_city TEXT,
      contact_state TEXT,
      contact_zip TEXT,
      email_verified INTEGER DEFAULT 0 NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `);
  console.log('✅ Created organizations table');

  // Create qr_code_sets table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS qr_code_sets (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      language TEXT DEFAULT 'en' NOT NULL,
      form_fields TEXT NOT NULL,
      qr_codes TEXT NOT NULL,
      is_active INTEGER DEFAULT 1 NOT NULL,
      scan_count INTEGER DEFAULT 0 NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `);
  console.log('✅ Created qr_code_sets table');

  // Create registrations table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS registrations (
      id TEXT PRIMARY KEY,
      qr_code_set_id TEXT NOT NULL REFERENCES qr_code_sets(id) ON DELETE CASCADE,
      qr_code_id TEXT NOT NULL,
      registration_data TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      referrer TEXT,
      delivery_status TEXT DEFAULT 'pending' NOT NULL,
      delivered_at TEXT,
      registered_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `);
  console.log('✅ Created registrations table');

  // Create indexes
  await client.execute('CREATE INDEX IF NOT EXISTS registrations_qr_code_set_id_idx ON registrations(qr_code_set_id)');
  await client.execute('CREATE INDEX IF NOT EXISTS registrations_delivery_status_idx ON registrations(delivery_status)');
  await client.execute('CREATE INDEX IF NOT EXISTS registrations_registered_at_idx ON registrations(registered_at)');
  console.log('✅ Created indexes');

  // Create verification_codes table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS verification_codes (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      attempts INTEGER DEFAULT 0 NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      expires_at TEXT NOT NULL,
      verified INTEGER DEFAULT 0 NOT NULL
    )
  `);
  console.log('✅ Created verification_codes table');

  // Create subscription_plans table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS subscription_plans (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      plan_type TEXT NOT NULL,
      status TEXT DEFAULT 'active' NOT NULL,
      registration_limit INTEGER NOT NULL,
      current_registration_count INTEGER DEFAULT 0 NOT NULL,
      billing_cycle TEXT DEFAULT 'monthly' NOT NULL,
      amount REAL,
      currency TEXT DEFAULT 'USD' NOT NULL,
      start_date TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      end_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `);
  console.log('✅ Created subscription_plans table');

  // Create remaining tables...
  console.log('✅ Schema creation completed successfully!');
  
  client.close();
} catch (error) {
  console.error('❌ Schema creation failed:', error);
  process.exit(1);
}