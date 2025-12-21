#!/usr/bin/env tsx
/**
 * Test Cron Endpoint Locally
 * 
 * Usage:
 *   CRON_SECRET=your-secret npm run test:cron
 *   or
 *   tsx scripts/test-cron.ts
 */

const CRON_SECRET = process.env.CRON_SECRET || 'test-secret-local';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testCron() {
  const endpoint = `${BASE_URL}/api/cron/finalize-cancellations`;
  
  console.log(`Testing cron endpoint: ${endpoint}`);
  console.log(`Using CRON_SECRET: ${CRON_SECRET.substring(0, 8)}...`);

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Cron test failed:', data);
      process.exit(1);
    }

    console.log('✅ Cron test successful:', data);
  } catch (error) {
    console.error('❌ Error testing cron:', error);
    process.exit(1);
  }
}

testCron();
