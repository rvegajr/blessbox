// Set environment variables
process.env.TURSO_DATABASE_URL = 'libsql://blessbox-local-rvegajr.aws-us-east-2.turso.io';
process.env.TURSO_AUTH_TOKEN = '***JWT_REDACTED***';

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