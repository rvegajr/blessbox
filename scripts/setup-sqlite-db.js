import { createClient } from '@libsql/client';

async function setupSQLiteDatabase() {
  console.log('🚀 Setting up BlessBox SQLite database...\n');

  // Create SQLite client
  const client = createClient({ 
    url: 'file:./blessbox.db',
    authToken: ''
  });

  // const db = drizzle(client, { schema });

  try {
    // Test connection
    console.log('1. Testing database connection...');
    await db.run('SELECT 1 as test');
    console.log('✅ SQLite connection successful!');

    // Create tables using the schema
    console.log('\n2. Creating database tables...');
    
    // Organizations table
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
        password_hash TEXT,
        last_login_at TEXT,
        email_verified INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
      );
    `);

    // QR Code Sets table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS qr_code_sets (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        name TEXT NOT NULL,
        language TEXT DEFAULT 'en' NOT NULL,
        form_fields TEXT NOT NULL,
        qr_codes TEXT NOT NULL,
        is_active INTEGER DEFAULT 1 NOT NULL,
        scan_count INTEGER DEFAULT 0 NOT NULL,
        created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
      );
    `);

    // Registrations table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS registrations (
        id TEXT PRIMARY KEY,
        qr_code_set_id TEXT NOT NULL,
        qr_code_id TEXT NOT NULL,
        registration_data TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        referrer TEXT,
        delivery_status TEXT DEFAULT 'pending' NOT NULL,
        delivered_at TEXT,
        registered_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        check_in_token TEXT UNIQUE,
        checked_in_at TEXT,
        checked_in_by TEXT,
        token_status TEXT DEFAULT 'active' NOT NULL,
        FOREIGN KEY (qr_code_set_id) REFERENCES qr_code_sets(id) ON DELETE CASCADE
      );
    `);

    // Verification codes table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS verification_codes (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        attempts INTEGER DEFAULT 0 NOT NULL,
        created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        expires_at TEXT NOT NULL,
        verified INTEGER DEFAULT 0 NOT NULL
      );
    `);

    // Login codes table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS login_codes (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        attempts INTEGER DEFAULT 0 NOT NULL,
        created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        expires_at TEXT NOT NULL,
        verified INTEGER DEFAULT 0 NOT NULL
      );
    `);

    // Create indexes
    console.log('3. Creating indexes...');
    
    await client.execute(`
      CREATE INDEX IF NOT EXISTS registrations_qr_code_set_id_idx ON registrations(qr_code_set_id);
    `);
    
    await client.execute(`
      CREATE INDEX IF NOT EXISTS registrations_delivery_status_idx ON registrations(delivery_status);
    `);
    
    await client.execute(`
      CREATE INDEX IF NOT EXISTS registrations_registered_at_idx ON registrations(registered_at);
    `);
    
    await client.execute(`
      CREATE INDEX IF NOT EXISTS registrations_check_in_token_idx ON registrations(check_in_token);
    `);
    
    await client.execute(`
      CREATE INDEX IF NOT EXISTS registrations_token_status_idx ON registrations(token_status);
    `);
    
    await client.execute(`
      CREATE INDEX IF NOT EXISTS login_codes_email_idx ON login_codes(email);
    `);
    
    await client.execute(`
      CREATE INDEX IF NOT EXISTS login_codes_expires_at_idx ON login_codes(expires_at);
    `);

    console.log('✅ Database tables and indexes created successfully!');
    
    // Test the database
    console.log('\n4. Testing database functionality...');
    const result = await client.execute('SELECT COUNT(*) as count FROM organizations');
    console.log(`✅ Database test successful! Found ${result.rows[0].count} organizations.`);

    console.log('\n🎉 SQLite database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Start the development server: npm run dev');
    console.log('   2. Visit http://localhost:7777');
    console.log('   3. Complete the onboarding flow to test database integration');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    client.close();
  }
}

// Run setup
setupSQLiteDatabase().catch(console.error);
