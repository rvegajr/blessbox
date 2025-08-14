#!/usr/bin/env node

import { createClient } from '@libsql/client';

// Set environment variables
process.env.TURSO_DATABASE_URL = 'libsql://blessbox-local-rvegajr.aws-us-east-2.turso.io';
// Use environment variable for auth token (set in environment)
process.env.TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN || 'test-token-placeholder';

console.log('🚀 Testing Turso connection...');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

try {
  const result = await client.execute('SELECT 1 as test');
  console.log('✅ Connection successful!', result.rows);
  
  // Test creating a table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS test_connection (
      id TEXT PRIMARY KEY,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Table creation successful!');
  
  // Clean up
  await client.execute('DROP TABLE IF EXISTS test_connection');
  console.log('✅ Cleanup successful!');
  
  client.close();
} catch (error) {
  console.error('❌ Connection failed:', error);
  process.exit(1);
}