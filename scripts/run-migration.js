#!/usr/bin/env node

import { execSync } from 'child_process';

// Load environment variables
process.env.TURSO_DATABASE_URL = 'libsql://blessbox-local-rvegajr.aws-us-east-2.turso.io';
process.env.TURSO_AUTH_TOKEN = '***JWT_REDACTED***';

console.log('🚀 Running Turso migration...');
console.log('Database URL:', process.env.TURSO_DATABASE_URL);

try {
  execSync('npx drizzle-kit push', { stdio: 'inherit' });
  console.log('✅ Migration completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}