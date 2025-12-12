import dotenv from 'dotenv';

// Load env vars (DO NOT hardcode secrets)
dotenv.config({ path: '.env.local' });

import { testDatabaseConnection } from '../src/database/connection';

console.log('🚀 Testing BlessBox app database connection...');

const result = await testDatabaseConnection();
console.log(result.message);

if (!result.success) {
  process.exit(1);
}