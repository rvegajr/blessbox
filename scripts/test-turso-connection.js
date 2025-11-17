#!/usr/bin/env node

import { createClient } from '@libsql/client';

// Set environment variables
process.env.TURSO_DATABASE_URL = 'libsql://blessbox-local-rvegajr.aws-us-east-2.turso.io';
<<<<<<< HEAD
process.env.TURSO_AUTH_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTQ4ODEzNjQsImlhdCI6MTc1NDI3NjU2NCwiaWQiOiI4MjFmMjdkOS0zNDIzLTQ1YTAtYWFiMy01MzcyNTQ3MjcyNDAiLCJyaWQiOiJiM2MwZjdhYS05YzFjLTQ5NjUtYjgwNi1jZmI0OGEwMTFmZTAifQ.UBi6bacAdcSpA26FIhJgdWhh6Qos4jY5JuSMb3aWJ65gvjFiqAYcCqudtU_ddAko2c0wkd_meGF2x3rrLp_UCw';
=======
// Use environment variable for auth token (set in environment)
process.env.TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN || 'test-token-placeholder';
>>>>>>> origin/main

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