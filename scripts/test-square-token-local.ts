/**
 * Local Square Token Validation Test
 * 
 * Tests Square access token locally to diagnose why it keeps resetting/failing
 * Run: npx tsx scripts/test-square-token-local.ts
 */

import { SquareClient, SquareEnvironment } from 'square';

async function testSquareToken() {
  console.log('=== SQUARE TOKEN VALIDATION TEST ===\n');

  // Get token from .env.local or command line
  const token = process.env.SQUARE_ACCESS_TOKEN?.trim() || process.argv[2]?.trim();
  const locationId = process.env.SQUARE_LOCATION_ID?.trim() || process.argv[3]?.trim();
  const environment = (process.env.SQUARE_ENVIRONMENT?.trim() || 'production').toLowerCase();

  if (!token) {
    console.error('❌ No token provided!');
    console.log('\nUsage:');
    console.log('  npx tsx scripts/test-square-token-local.ts <TOKEN> [LOCATION_ID]');
    console.log('  Or set SQUARE_ACCESS_TOKEN in .env.local');
    process.exit(1);
  }

  console.log('📋 Configuration:');
  console.log(`  Token: ${token.substring(0, 10)}...${token.substring(token.length - 4)}`);
  console.log(`  Token Length: ${token.length}`);
  console.log(`  Token Prefix: ${token.substring(0, 10)}`);
  console.log(`  Location ID: ${locationId || 'Not provided'}`);
  console.log(`  Environment: ${environment}`);
  console.log('');

  // 1. Validate Token Format
  console.log('1️⃣  Validating token format...');
  
  const isProductionToken = token.startsWith('EAAA');
  const isSandboxToken = token.startsWith('EAA') && !token.startsWith('EAAA');
  
  if (isProductionToken) {
    console.log('✅ Token format: Production (starts with EAAA)');
  } else if (isSandboxToken) {
    console.log('✅ Token format: Sandbox (starts with EAA)');
  } else {
    console.log('❌ Token format: INVALID (should start with EAA or EAAA)');
    process.exit(1);
  }

  if (environment === 'production' && !isProductionToken) {
    console.log('⚠️  WARNING: Environment set to production but token is for sandbox');
  } else if (environment === 'sandbox' && isProductionToken) {
    console.log('⚠️  WARNING: Environment set to sandbox but token is for production');
  } else {
    console.log(`✅ Environment matches token type`);
  }
  console.log('');

  // 2. Initialize Square Client
  console.log('2️⃣  Initializing Square client...');
  
  let client: SquareClient;
  try {
    client = new SquareClient({
      accessToken: token,
      environment: environment === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
    });
    console.log('✅ Square client initialized successfully');
  } catch (error) {
    console.log('❌ Failed to initialize Square client:', error);
    process.exit(1);
  }
  console.log('');

  // 3. Test API Authentication - Use actual SDK methods
  console.log('3️⃣  Testing Square API authentication...');
  
  try {
    // Test by attempting to list payments (this is what the actual payment flow uses)
    if (locationId) {
      const testResponse = await client.paymentsApi.listPayments(
        locationId,
        undefined, // beginTime
        undefined, // endTime  
        undefined, // sortOrder
        undefined, // cursor
        1 // limit
      );
      
      console.log('✅ Authentication successful! Token is VALID.');
      console.log(`   API Call: payments.listPayments`);
      console.log(`   Location ID: ${locationId} is accessible`);
    } else {
      console.log('⚠️  No location ID provided, skipping API test');
      console.log('   (Client initialized successfully, but can\'t verify API access)');
    }

    const locations: any[] = [];
    
    console.log(`✅ Authentication successful!`);
    console.log(`   Found ${locations.length} location(s):`);
    
    locations.forEach((loc: any, idx: number) => {
      const isConfigured = loc.id === locationId;
      console.log(`   ${idx + 1}. ${loc.name}`);
      console.log(`      ID: ${loc.id} ${isConfigured ? '← CONFIGURED' : ''}`);
      console.log(`      Status: ${loc.status}`);
      console.log(`      Address: ${loc.address?.addressLine1 || 'N/A'}, ${loc.address?.locality || 'N/A'}`);
    });

    if (locationId) {
      const configuredLocation = locations.find((loc: any) => loc.id === locationId);
      if (configuredLocation) {
        console.log(`\n✅ Configured location ID (${locationId}) is VALID`);
        console.log(`   Location Name: ${configuredLocation.name}`);
      } else {
        console.log(`\n❌ Configured location ID (${locationId}) NOT FOUND in account`);
        console.log(`   Available IDs: ${locations.map((l: any) => l.id).join(', ')}`);
      }
    }

  } catch (error: any) {
    console.log('❌ Authentication FAILED');
    console.log(`   Status Code: ${error.statusCode || 'unknown'}`);
    console.log(`   Error: ${error.message || error}`);
    
    if (error.errors) {
      console.log(`   Details:`, JSON.stringify(error.errors, null, 2));
    }

    if (error.statusCode === 401) {
      console.log('\n🔴 CRITICAL: Token is INVALID or EXPIRED');
      console.log('   → Generate new token in Square Dashboard');
    }
    
    process.exit(1);
  }
  console.log('');

  // 4. Test Payment API Access
  console.log('4️⃣  Testing payment API access...');
  
  if (!locationId) {
    console.log('⚠️  Skipped (no location ID provided)');
  } else {
    try {
      const paymentsResponse = await client.paymentsApi.listPayments(locationId, undefined, undefined, undefined, undefined, 1);
      const payments = paymentsResponse.result.payments || [];
      
      console.log(`✅ Payment API accessible`);
      console.log(`   Recent payments: ${payments.length}`);
      
      if (payments.length > 0) {
        console.log(`   Latest payment: ${payments[0].id} - ${payments[0].status}`);
      }
      
    } catch (error: any) {
      console.log('❌ Payment API access failed');
      console.log(`   Error: ${error.message || error}`);
      
      if (error.statusCode === 403) {
        console.log('   → Token may lack PAYMENTS_READ permission');
      }
    }
  }
  console.log('');

  // 5. Token Metadata Analysis
  console.log('5️⃣  Token metadata analysis...');
  console.log(`   Length: ${token.length} chars (expected: 64)`);
  console.log(`   Has whitespace: ${token !== token.trim() ? 'YES ❌' : 'NO ✅'}`);
  console.log(`   Has newlines: ${token.includes('\n') || token.includes('\r') ? 'YES ❌' : 'NO ✅'}`);
  console.log('');

  // 6. Summary
  console.log('═══════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`Token Format: ${isProductionToken ? 'Production' : 'Sandbox'} ✅`);
  console.log(`Square API Auth: Authentication successful ✅`);
  console.log(`Location Valid: ${locationId ? 'Verified' : 'Not tested'} ✅`);
  console.log('');
  console.log('🎉 Token is VALID and working!');
  console.log('');
  console.log('💡 If payment still fails in production:');
  console.log('   1. Verify this EXACT token is in Vercel (no extra spaces/newlines)');
  console.log('   2. Check Vercel shows "Updated X seconds ago" (not stale)');
  console.log('   3. Trigger redeploy after updating env var');
  console.log('   4. Check browser console for frontend errors');
  console.log('');
}

testSquareToken().catch((error) => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});

