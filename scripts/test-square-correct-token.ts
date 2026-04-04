#!/usr/bin/env npx tsx
/**
 * Test Square SDK with CORRECT property name
 * SDK v43 uses "token" not "accessToken"
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// ONLY load .env.production
config({ path: resolve(process.cwd(), '.env.production') });

async function test() {
  const { SquareClient, SquareEnvironment } = await import('square');
  
  const token = process.env.SQUARE_ACCESS_TOKEN!;
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  SQUARE SDK TEST - CORRECT PROPERTY NAME                     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  console.log(`Token: ${token.substring(0, 15)}...${token.substring(token.length - 5)}\n`);
  console.log('Creating client with: token (NOT accessToken)\n');

  // SDK v43 uses "token" instead of "accessToken"!
  const client = new SquareClient({
    token: token,  // <-- THIS IS THE FIX!
    environment: SquareEnvironment.Production,
  });

  try {
    const response = await client.locations.list();
    console.log('✅ SUCCESS!');
    console.log('Locations:');
    for (const loc of response.result?.locations || []) {
      console.log(`   📍 ${loc.name} (${loc.id})`);
    }
    console.log('\n🎉 The fix is: Use "token" instead of "accessToken" in SquareClient constructor!');
  } catch (error: any) {
    console.log('❌ FAILED:', error.statusCode, error.message?.substring(0, 200));
  }
}

test();


