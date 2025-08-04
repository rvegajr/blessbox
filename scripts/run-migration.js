#!/usr/bin/env node

import { execSync } from 'child_process';

// Load environment variables
process.env.TURSO_DATABASE_URL = 'libsql://blessbox-local-rvegajr.aws-us-east-2.turso.io';
process.env.TURSO_AUTH_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTQ4ODEzNjQsImlhdCI6MTc1NDI3NjU2NCwiaWQiOiI4MjFmMjdkOS0zNDIzLTQ1YTAtYWFiMy01MzcyNTQ3MjcyNDAiLCJyaWQiOiJiM2MwZjdhYS05YzFjLTQ5NjUtYjgwNi1jZmI0OGEwMTFmZTAifQ.UBi6bacAdcSpA26FIhJgdWhh6Qos4jY5JuSMb3aWJ65gvjFiqAYcCqudtU_ddAko2c0wkd_meGF2x3rrLp_UCw';

console.log('🚀 Running Turso migration...');
console.log('Database URL:', process.env.TURSO_DATABASE_URL);

try {
  execSync('npx drizzle-kit push', { stdio: 'inherit' });
  console.log('✅ Migration completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}