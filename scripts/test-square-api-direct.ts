#!/usr/bin/env npx tsx
/**
 * Direct Square API Test - No Mocks, No Wrappers
 * 
 * This script makes REAL API calls to Square to verify your token works.
 * 
 * Usage:
 *   npx tsx scripts/test-square-api-direct.ts                    # Uses .env.local token
 *   npx tsx scripts/test-square-api-direct.ts "YOUR_TOKEN_HERE"  # Test specific token
 */

// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.production') });
config({ path: resolve(process.cwd(), '.env.local'), override: true });

import { SquareClient, SquareEnvironment } from 'square';

async function testSquareToken(tokenOverride?: string, envOverride?: string) {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     DIRECT SQUARE API TEST (NO MOCKS)                        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Get token
  const accessToken = tokenOverride || process.env.SQUARE_ACCESS_TOKEN;
  
  // Auto-detect environment from token prefix if not specified
  // Production tokens start with EAAA, sandbox tokens start with EAAAl (followed by sandbox-)
  let environment = envOverride || process.env.SQUARE_ENVIRONMENT || 'sandbox';
  if (tokenOverride?.startsWith('EAAA') && !tokenOverride.includes('sandbox')) {
    // Production token detected - override sandbox setting
    environment = 'production';
    console.log('🔍 Auto-detected PRODUCTION token (starts with EAAA)\n');
  }
  environment = environment.toLowerCase();
  
  const applicationId = process.env.SQUARE_APPLICATION_ID;
  const locationId = process.env.SQUARE_LOCATION_ID;

  console.log('📋 Configuration:');
  console.log(`   Environment: ${environment}`);
  console.log(`   Application ID: ${applicationId ? applicationId.substring(0, 20) + '...' : 'NOT SET'}`);
  console.log(`   Location ID: ${locationId || 'NOT SET'}`);
  console.log(`   Token source: ${tokenOverride ? 'Command line argument' : '.env file'}`);
  
  if (!accessToken) {
    console.log('\n❌ ERROR: No Square access token provided');
    console.log('   Provide token as argument or set SQUARE_ACCESS_TOKEN in .env.local');
    process.exit(1);
  }

  // Token info
  console.log(`   Token length: ${accessToken.length} characters`);
  console.log(`   Token prefix: ${accessToken.substring(0, 10)}...`);
  console.log(`   Token suffix: ...${accessToken.substring(accessToken.length - 10)}`);
  
  // Check for common issues
  if (accessToken.includes('\n') || accessToken.includes('\\n')) {
    console.log('   ⚠️  WARNING: Token contains newline characters!');
  }
  if (accessToken.startsWith('"') || accessToken.endsWith('"')) {
    console.log('   ⚠️  WARNING: Token wrapped in quotes!');
  }
  if (accessToken.startsWith("'") || accessToken.endsWith("'")) {
    console.log('   ⚠️  WARNING: Token wrapped in single quotes!');
  }
  
  // Sanitize token
  const cleanToken = accessToken.trim().replace(/^['"]|['"]$/g, '').replace(/\\n/g, '');
  if (cleanToken !== accessToken) {
    console.log(`   🔧 Sanitized token (removed ${accessToken.length - cleanToken.length} chars)`);
  }

  console.log('\n🔄 Testing Square API...\n');

  // Create client
  const client = new SquareClient({
    accessToken: cleanToken,
    environment: environment === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
  });

  // Test 1: List Locations (basic auth test)
  console.log('1️⃣  Test: List Locations (validates authentication)');
  try {
    const startTime = Date.now();
    const locationsResponse = await client.locations.list();
    const duration = Date.now() - startTime;
    
    console.log(`   ✅ API call successful (${duration}ms)`);
    
    if (locationsResponse.result?.locations) {
      console.log(`   ✅ Found ${locationsResponse.result.locations.length} location(s):`);
      for (const loc of locationsResponse.result.locations) {
        console.log(`      📍 ${loc.name}`);
        console.log(`         ID: ${loc.id}`);
        console.log(`         Status: ${loc.status}`);
        if (loc.capabilities) {
          console.log(`         Capabilities: ${loc.capabilities.join(', ')}`);
        }
      }
    }
    console.log('');
  } catch (error: any) {
    console.log(`   ❌ FAILED: ${error.message}`);
    if (error.statusCode === 401) {
      console.log('   ❌ 401 Unauthorized - TOKEN IS INVALID');
      console.log('');
      console.log('   🔴 Your Square access token is being REJECTED by Square servers.');
      console.log('   🔴 This is why payments fail in production.');
      console.log('');
      console.log('   💡 To fix: Generate a NEW token at:');
      console.log('      https://squareup.com/dashboard/applications');
      console.log('');
    }
    process.exit(1);
  }

  // Test 2: List Payments (verifies payment permission)
  console.log('2️⃣  Test: List Payments (validates PAYMENTS_READ permission)');
  try {
    const startTime = Date.now();
    const paymentsResponse = await client.payments.list({ locationId: locationId });
    const duration = Date.now() - startTime;
    
    console.log(`   ✅ API call successful (${duration}ms)`);
    const payments = paymentsResponse.result?.payments || [];
    console.log(`   ✅ Can access payments (${payments.length} recent payments found)`);
    console.log('');
  } catch (error: any) {
    console.log(`   ❌ FAILED: ${error.message}`);
    if (error.statusCode === 401) {
      console.log('   ❌ Token lacks PAYMENTS_READ permission');
    }
    console.log('');
    // Don't exit - this permission might not be needed for basic checkout
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🎉 SQUARE TOKEN IS VALID!');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('✅ Token authenticates successfully with Square API');
  console.log('✅ This token should work for production payments');
  console.log('');
  console.log('If this token works here but fails in Vercel production:');
  console.log('1. Ensure the EXACT same token is in Vercel (no extra characters)');
  console.log('2. Redeploy after updating Vercel environment variables');
  console.log('3. Wait 2-3 minutes for deployment to complete');
  console.log('');
}

// Run the test
const tokenArg = process.argv[2];
const envArg = process.argv[3]; // Optional: 'production' or 'sandbox'
testSquareToken(tokenArg, envArg).catch((error) => {
  console.error('\n💥 Test crashed:', error);
  process.exit(1);
});

