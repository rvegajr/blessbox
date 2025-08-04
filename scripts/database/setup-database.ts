#!/usr/bin/env tsx
// Database setup script for BlessBox
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { testDatabaseConnection } from '../../src/database/connection';

async function setupDatabase() {
  console.log('🚀 Setting up BlessBox database...\n');

  // Test connection first
  console.log('1. Testing database connection...');
  const connectionTest = await testDatabaseConnection();
  
  if (!connectionTest.success) {
    console.error(connectionTest.message);
    console.log('\n💡 Make sure PostgreSQL is running and your .env.local file is configured correctly.');
    console.log('   Copy .env.example to .env.local and update the database credentials.');
    process.exit(1);
  }
  
  console.log(connectionTest.message);

  // Run migrations
  console.log('\n2. Running database migrations...');
  try {
    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'blessbox',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });

    const db = drizzle(pool);
    await migrate(db, { migrationsFolder: './src/database/migrations' });
    
    console.log('✅ Database migrations completed successfully!');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }

  console.log('\n🎉 Database setup completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('   1. Start the development server: npm run dev');
  console.log('   2. Visit http://localhost:7777');
  console.log('   3. Complete the onboarding flow to test database integration');
}

// Run setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase().catch(console.error);
}

export { setupDatabase };