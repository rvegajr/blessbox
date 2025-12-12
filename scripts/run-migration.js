#!/usr/bin/env node

import { execSync } from 'child_process';
import dotenv from 'dotenv';

// Load env vars (DO NOT hardcode secrets)
dotenv.config({ path: '.env.local' });

console.log('🚀 Running Turso migration...');
console.log('Database URL:', process.env.TURSO_DATABASE_URL);

try {
  execSync('npx drizzle-kit push', { stdio: 'inherit' });
  console.log('✅ Migration completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}