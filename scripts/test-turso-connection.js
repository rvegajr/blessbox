#!/usr/bin/env node

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

// Load env vars (DO NOT hardcode secrets)
dotenv.config({ path: '.env.local' });

if (!process.env.TURSO_DATABASE_URL) {
  throw new Error('TURSO_DATABASE_URL is not set');
}
if (!process.env.TURSO_AUTH_TOKEN) {
  throw new Error('TURSO_AUTH_TOKEN is not set');
}

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