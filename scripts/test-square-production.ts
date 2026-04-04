#!/usr/bin/env npx tsx
/**
 * Clean Production Square API Test
 * 
 * Uses ONLY the production credentials from .env.production
 * Does NOT load .env.local
 * 
 * Usage: npx tsx scripts/test-square-production.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// ONLY load .env.production - NOT .env.local
config({ path: resolve(process.cwd(), '.env.production') });

import { SquareClient, SquareEnvironment } from 'square';

async function testProductionSquare() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     PRODUCTION SQUARE API TEST                               ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  const applicationId = process.env.SQUARE_APPLICATION_ID;
  const locationId = process.env.SQUARE_LOCATION_ID;
  const environment = process.env.SQUARE_ENVIRONMENT || 'production';

  console.log('📋 Production Configuration:');
  console.log(`   Environment: ${environment}`);
  console.log(`   Application ID: ${applicationId}`);
  console.log(`   Location ID: ${locationId}`);
  console.log(`   Token: ${accessToken?.substring(0, 15)}...${accessToken?.substring(accessToken.length - 10)}`);
  console.log('');

  if (!accessToken) {
    console.log('❌ ERROR: SQUARE_ACCESS_TOKEN not found in .env.production');
    process.exit(1);
  }

  console.log('🔄 Testing Square Production API...\n');

  // SDK v43+ uses "token" not "accessToken"
  const client = new SquareClient({
    token: accessToken,
    environment: SquareEnvironment.Production,
  });

  // Test 1: List Locations
  console.log('1️⃣  Test: List Locations');
  try {
    const response = await client.locations.list();
    // SDK v43 changed response structure - locations directly on response
    const locations = (response as any).locations || (response as any).result?.locations || [];
    console.log(`   ✅ SUCCESS! Found ${locations.length} location(s):`);
    for (const loc of locations) {
      console.log(`      📍 ${loc.name} (${loc.id})`);
      console.log(`         Status: ${loc.status}`);
      console.log(`         Capabilities: ${loc.capabilities?.join(', ')}`);
    }
    console.log('');
  } catch (error: any) {
    console.log(`   ❌ FAILED: ${error.statusCode || ''} - ${error.message}`);
    if (error.body) console.log(`   Body: ${error.body}`);
    process.exit(1);
  }

  // Test 2: List Payments
  console.log('2️⃣  Test: List Payments');
  try {
    const response = await client.payments.list({ locationId });
    // SDK v43 changed response structure
    const payments = (response as any).payments || (response as any).result?.payments || [];
    console.log(`   ✅ SUCCESS! Found ${payments.length} recent payments`);
    console.log('');
  } catch (error: any) {
    console.log(`   ⚠️  Warning: ${error.message}`);
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🎉 PRODUCTION SQUARE TOKEN IS VALID!');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('The token works. If Vercel production is still failing:');
  console.log('1. Copy this EXACT token to Vercel: SQUARE_ACCESS_TOKEN');
  console.log(`   ${accessToken}`);
  console.log('2. Also update SQUARE_APPLICATION_ID and SQUARE_LOCATION_ID');
  console.log('3. Redeploy');
}

testProductionSquare().catch(console.error);

