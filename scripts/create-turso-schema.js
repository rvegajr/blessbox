#!/usr/bin/env node

import { createClient } from '@libsql/client';

// Load environment variables from .env.local
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

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

  // Create classes table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      capacity INTEGER NOT NULL,
      timezone TEXT DEFAULT 'UTC' NOT NULL,
      status TEXT DEFAULT 'active' NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `);
  console.log('✅ Created classes table');

  // Create class_sessions table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS class_sessions (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      session_date TEXT NOT NULL,
      session_time TEXT NOT NULL,
      duration_minutes INTEGER DEFAULT 60 NOT NULL,
      location TEXT,
      instructor_name TEXT,
      status TEXT DEFAULT 'scheduled' NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `);
  console.log('✅ Created class_sessions table');

  // Create participants table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS participants (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      emergency_contact TEXT,
      emergency_phone TEXT,
      notes TEXT,
      status TEXT DEFAULT 'active' NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `);
  console.log('✅ Created participants table');

  // Create enrollments table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS enrollments (
      id TEXT PRIMARY KEY,
      participant_id TEXT NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
      class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      session_id TEXT REFERENCES class_sessions(id) ON DELETE CASCADE,
      enrollment_status TEXT DEFAULT 'pending' NOT NULL,
      enrolled_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      confirmed_at TEXT,
      attended_at TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `);
  console.log('✅ Created enrollments table');

  // Create email_templates table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS email_templates (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      template_type TEXT NOT NULL,
      subject TEXT NOT NULL,
      html_content TEXT NOT NULL,
      text_content TEXT,
      is_active INTEGER DEFAULT 1 NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )
  `);
  console.log('✅ Created email_templates table');

  // Create email_logs table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS email_logs (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      recipient_email TEXT NOT NULL,
      template_type TEXT NOT NULL,
      subject TEXT NOT NULL,
      status TEXT NOT NULL,
      sent_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      error_message TEXT,
      metadata TEXT
    )
  `);
  console.log('✅ Created email_logs table');

  // Create additional indexes for performance
  await client.execute('CREATE INDEX IF NOT EXISTS classes_organization_id_idx ON classes(organization_id)');
  await client.execute('CREATE INDEX IF NOT EXISTS class_sessions_class_id_idx ON class_sessions(class_id)');
  await client.execute('CREATE INDEX IF NOT EXISTS participants_organization_id_idx ON participants(organization_id)');
  await client.execute('CREATE INDEX IF NOT EXISTS participants_email_idx ON participants(email)');
  await client.execute('CREATE INDEX IF NOT EXISTS enrollments_participant_id_idx ON enrollments(participant_id)');
  await client.execute('CREATE INDEX IF NOT EXISTS enrollments_class_id_idx ON enrollments(class_id)');
  await client.execute('CREATE INDEX IF NOT EXISTS enrollments_session_id_idx ON enrollments(session_id)');
  await client.execute('CREATE INDEX IF NOT EXISTS email_logs_organization_id_idx ON email_logs(organization_id)');
  await client.execute('CREATE INDEX IF NOT EXISTS email_logs_recipient_email_idx ON email_logs(recipient_email)');
  console.log('✅ Created additional indexes');

  // Create remaining tables...
  console.log('✅ Schema creation completed successfully!');
  
  client.close();
} catch (error) {
  console.error('❌ Schema creation failed:', error);
  process.exit(1);
}