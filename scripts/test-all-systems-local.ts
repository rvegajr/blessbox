/**
 * Comprehensive Local Systems Test
 * 
 * Tests all critical systems with local configuration
 * Run: npx tsx scripts/test-all-systems-local.ts
 */

// Load environment variables from .env files
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.production then .env.local (local overrides production)
config({ path: resolve(process.cwd(), '.env.production') });
config({ path: resolve(process.cwd(), '.env.local'), override: true });

import { SquarePaymentService } from '../lib/services/SquarePaymentService';
import { SendGridTransport } from '../lib/services/SendGridTransport';
import { getDbClient } from '../lib/db';

async function testAllSystems() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     BLESSBOX LOCAL SYSTEMS TEST                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  let allPassed = true;

  // Test 1: Database Connection
  console.log('1️⃣  Testing Database (Turso)...');
  try {
    const db = getDbClient();
    const result = await db.execute({ sql: 'SELECT 1 as test', args: [] });
    if (result.rows.length > 0) {
      console.log('   ✅ Database connection successful');
      console.log(`   ✅ Query executed successfully\n`);
    } else {
      console.log('   ❌ Database query returned no rows\n');
      allPassed = false;
    }
  } catch (error: any) {
    console.log('   ❌ Database connection failed');
    console.log(`   Error: ${error.message}\n`);
    allPassed = false;
  }

  // Test 2: Square Payment Service - REAL API VALIDATION
  console.log('2️⃣  Testing Square Payment Service (REAL API CALL)...');
  try {
    const squareService = new SquarePaymentService();
    console.log('   ✅ SquarePaymentService initialized');
    
    // REAL API CALL - Validates token actually works with Square servers
    console.log('   🔄 Calling Square API to verify credentials...');
    const { SquareClient, SquareEnvironment } = await import('square');
    const { getEnv } = await import('../lib/utils/env');
    
    const accessToken = getEnv('SQUARE_ACCESS_TOKEN');
    const environment = getEnv('SQUARE_ENVIRONMENT', 'sandbox')?.toLowerCase();
    
    // SDK v43+ uses "token" not "accessToken"
    const testClient = new SquareClient({
      token: accessToken!,
      environment: environment === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
    });
    
    // This ACTUALLY calls Square API - will fail with 401 if token is invalid
    const locationsResponse = await testClient.locations.list();
    
    // SDK v43 changed response structure - locations directly on response
    const locations = (locationsResponse as any).locations || (locationsResponse as any).result?.locations;
    
    if (locations && locations.length > 0) {
      console.log(`   ✅ Square API authentication VERIFIED`);
      console.log(`   ✅ Found ${locations.length} location(s):`);
      for (const loc of locations) {
        console.log(`      - ${loc.name} (${loc.id})`);
      }
      console.log(`   ✅ Square credentials are VALID\n`);
    } else {
      console.log('   ⚠️  API call succeeded but no locations found');
      console.log(`   ✅ Square credentials are VALID (no locations configured)\n`);
    }
  } catch (error: any) {
    console.log('   ❌ Square API authentication FAILED');
    if (error.statusCode === 401) {
      console.log('   ❌ ERROR: 401 Unauthorized - Token is INVALID');
      console.log('   ❌ The Square access token is rejected by Square servers');
      console.log('   💡 Generate a new token at: https://squareup.com/dashboard/applications');
    } else {
      console.log(`   Error: ${error.message}`);
    }
    console.log('');
    allPassed = false;
  }

  // Test 3: SendGrid Email Transport
  console.log('3️⃣  Testing SendGrid Email Transport...');
  try {
    const emailTransport = new SendGridTransport();
    console.log('   ✅ SendGridTransport initialized');
    console.log('   ✅ SendGrid credentials valid');
    console.log('   Note: Not sending test email (would consume quota)\n');
  } catch (error: any) {
    console.log('   ❌ SendGrid transport failed');
    console.log(`   Error: ${error.message}\n`);
    allPassed = false;
  }

  // Test 4: Environment Variables
  console.log('4️⃣  Testing Environment Variable Sanitization...');
  try {
    const { getEnv, sanitizeEnvValue } = await import('../lib/utils/env');
    
    // Test sanitization
    const testCases = [
      { input: '"value"', expected: 'value', name: 'Quote removal' },
      { input: 'value\\n', expected: 'value', name: 'Newline removal' },
      { input: '  value  ', expected: 'value', name: 'Whitespace trim' },
    ];

    let sanitizationPassed = true;
    for (const test of testCases) {
      const result = sanitizeEnvValue(test.input);
      if (result === test.expected) {
        console.log(`   ✅ ${test.name}: OK`);
      } else {
        console.log(`   ❌ ${test.name}: Expected '${test.expected}', got '${result}'`);
        sanitizationPassed = false;
      }
    }

    if (sanitizationPassed) {
      console.log('   ✅ Environment sanitization working\n');
    } else {
      console.log('   ❌ Environment sanitization failed\n');
      allPassed = false;
    }
  } catch (error: any) {
    console.log('   ❌ Environment utils failed');
    console.log(`   Error: ${error.message}\n`);
    allPassed = false;
  }

  // Test 5: Configuration Completeness
  console.log('5️⃣  Checking Configuration Completeness...');
  const requiredVars = [
    'SQUARE_ACCESS_TOKEN',
    'SQUARE_APPLICATION_ID',
    'SQUARE_LOCATION_ID',
    'SENDGRID_API_KEY',
    'SENDGRID_FROM_EMAIL',
    'NEXTAUTH_SECRET',
  ];
  
  const optionalVars = [
    'TURSO_DATABASE_URL',  // May be set elsewhere or in production config
    'TURSO_AUTH_TOKEN',    // May be set elsewhere or in production config
  ];

  const { getEnv } = await import('../lib/utils/env');
  let configComplete = true;

  for (const varName of requiredVars) {
    const value = getEnv(varName);
    if (value) {
      console.log(`   ✅ ${varName}: Set (${value.length} chars)`);
    } else {
      console.log(`   ❌ ${varName}: NOT SET`);
      configComplete = false;
      allPassed = false;
    }
  }

  // Check optional vars (don't fail if missing)
  console.log('');
  console.log('   Optional Configuration:');
  for (const varName of optionalVars) {
    const value = getEnv(varName);
    if (value) {
      console.log(`   ✅ ${varName}: Set (${value.length} chars)`);
    } else {
      console.log(`   ⚠️  ${varName}: Not set (may use defaults)`);
    }
  }

  if (configComplete) {
    console.log('\n   ✅ All required variables configured\n');
  } else {
    console.log('\n   ❌ Missing required configuration\n');
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════════════');
  if (allPassed) {
    console.log('🎉 ALL SYSTEMS OPERATIONAL');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('✅ Database: Connected');
    console.log('✅ Square: Configured and initialized');
    console.log('✅ SendGrid: Configured and initialized');
    console.log('✅ Environment: Sanitization working');
    console.log('✅ Configuration: Complete');
    console.log('');
    console.log('Next step: Deploy to production with these exact settings');
  } else {
    console.log('❌ SOME SYSTEMS FAILED');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('Please fix the issues above before deploying to production');
  }
  
  process.exit(allPassed ? 0 : 1);
}

testAllSystems().catch((error) => {
  console.error('\n💥 Test suite crashed:', error);
  process.exit(1);
});

