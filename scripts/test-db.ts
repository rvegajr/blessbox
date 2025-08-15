// Set environment variables
process.env.TURSO_DATABASE_URL = 'libsql://blessbox-local-rvegajr.aws-us-east-2.turso.io';
// Use environment variable for auth token (set in environment)
process.env.TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN || 'test-token-placeholder';

import { testDatabaseConnection } from '../src/database/connection';

async function test() {
  console.log('🚀 Testing BlessBox app database connection...');
  
  const result = await testDatabaseConnection();
  console.log(result.message);
  
  if (!result.success) {
    process.exit(1);
  }
}

test();