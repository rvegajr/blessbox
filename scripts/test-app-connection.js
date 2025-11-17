// Set environment variables
process.env.TURSO_DATABASE_URL = 'libsql://blessbox-local-rvegajr.aws-us-east-2.turso.io';
<<<<<<< HEAD
process.env.TURSO_AUTH_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NTQ4ODEzNjQsImlhdCI6MTc1NDI3NjU2NCwiaWQiOiI4MjFmMjdkOS0zNDIzLTQ1YTAtYWFiMy01MzcyNTQ3MjcyNDAiLCJyaWQiOiJiM2MwZjdhYS05YzFjLTQ5NjUtYjgwNi1jZmI0OGEwMTFmZTAifQ.UBi6bacAdcSpA26FIhJgdWhh6Qos4jY5JuSMb3aWJ65gvjFiqAYcCqudtU_ddAko2c0wkd_meGF2x3rrLp_UCw';
=======
// Use environment variable for auth token (set in environment)
process.env.TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN || 'test-token-placeholder';
>>>>>>> origin/main

import { testDatabaseConnection } from '../src/database/connection';

console.log('🚀 Testing BlessBox app database connection...');

const result = await testDatabaseConnection();
console.log(result.message);

if (!result.success) {
  process.exit(1);
}