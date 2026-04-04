#!/usr/bin/env npx tsx
/**
 * Minimal Square SDK Test
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// ONLY load .env.production
config({ path: resolve(process.cwd(), '.env.production') });

async function test() {
  console.log('Minimal Square SDK Test\n');

  const token = process.env.SQUARE_ACCESS_TOKEN!;
  console.log(`Token: ${token.substring(0, 15)}...${token.substring(token.length - 5)}\n`);

  // Import after env is loaded
  const { SquareClient, SquareEnvironment } = await import('square');

  console.log('Creating client with:');
  console.log(`  accessToken: (64 chars)`);
  console.log(`  environment: SquareEnvironment.Production`);
  console.log(`  SquareEnvironment.Production = ${SquareEnvironment.Production}\n`);

  const client = new SquareClient({
    accessToken: token,
    environment: SquareEnvironment.Production,
  });

  console.log('Client created. Making API call...\n');

  try {
    const response = await client.locations.list();
    console.log('✅ SUCCESS!');
    console.log('Locations:', response.result?.locations?.map(l => l.name));
  } catch (error: any) {
    console.log('❌ FAILED');
    console.log('Status:', error.statusCode);
    console.log('Message:', error.message);
    console.log('');
    
    // Check what the SDK is actually sending
    console.log('Debug: Let me check the internal state...');
    console.log('Client config:', JSON.stringify({
      environment: SquareEnvironment.Production,
      tokenLength: token.length,
    }, null, 2));
  }
}

test();


