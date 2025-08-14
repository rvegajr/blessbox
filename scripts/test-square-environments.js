#!/usr/bin/env node

/**
 * Square Payment Environment Configuration Tester
 * 
 * Tests Square payment configuration across all environments:
 * - Local (.env.local)
 * - Vercel Development/Preview
 * - Vercel Production
 * 
 * Usage:
 *   node scripts/test-square-environments.js
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import crypto from 'crypto';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Environment URLs
const environments = {
  local: 'http://localhost:4321',
  development: 'https://dev.blessbox.org',
  production: 'https://www.blessbox.org'
};

// Expected Square configuration
const expectedConfig = {
  sandbox: {
    applicationId: 'sandbox-sq0idb-wmodH19wX_VVwhJOkrunbw',
    environment: 'sandbox'
  },
  production: {
    applicationId: 'sq0idp-ILxW5EBGufGuE1-FsJTpbg',
    environment: 'production'
  }
};

// Load local environment variables
function loadLocalEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  const env = {};
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      if (line.trim() && !line.trim().startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          env[key.trim()] = value.replace(/^["']|["']$/g, '');
        }
      }
    });
  }
  
  return env;
}

// Test Square API connection
async function testSquareAPI(accessToken, environment) {
  return new Promise((resolve) => {
    const hostname = environment === 'sandbox' 
      ? 'connect.squareupsandbox.com'
      : 'connect.squareup.com';
    
    const options = {
      hostname,
      port: 443,
      path: '/v2/merchants/me',
      method: 'GET',
      headers: {
        'Square-Version': '2024-01-18',
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(body);
            resolve({ 
              success: true, 
              environment,
              merchantId: data.merchant?.id || 'N/A',
              businessName: data.merchant?.business_name || 'N/A',
              country: data.merchant?.country || 'N/A',
              currency: data.merchant?.currency || 'N/A'
            });
          } catch {
            resolve({ 
              success: true, 
              environment,
              message: 'API connection successful'
            });
          }
        } else if (res.statusCode === 401) {
          resolve({ 
            success: false, 
            environment,
            message: 'Invalid access token or authentication failed'
          });
        } else {
          resolve({ 
            success: false, 
            environment,
            message: `API request failed (Status: ${res.statusCode})`
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ 
        success: false, 
        environment,
        message: `Connection error: ${error.message}`
      });
    });

    req.end();
  });
}

// Test payment endpoints on deployed environments
async function testPaymentEndpoint(url, environment) {
  return new Promise((resolve) => {
    const testUrl = `${url}/api/payment/validate-coupon`;
    
    const postData = JSON.stringify({ code: 'TEST' });
    
    const urlParts = new URL(testUrl);
    const options = {
      hostname: urlParts.hostname,
      port: 443,
      path: urlParts.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        // We expect either a 200 (valid coupon) or 400 (invalid coupon)
        // Both indicate the payment system is working
        if (res.statusCode === 200 || res.statusCode === 400) {
          resolve({
            success: true,
            environment,
            message: 'Payment endpoint accessible',
            statusCode: res.statusCode
          });
        } else if (res.statusCode === 500) {
          resolve({
            success: false,
            environment,
            message: 'Payment system error - check Square configuration',
            statusCode: res.statusCode
          });
        } else {
          resolve({
            success: false,
            environment,
            message: `Unexpected response (Status: ${res.statusCode})`,
            statusCode: res.statusCode
          });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({
        success: false,
        environment,
        message: `Connection error: ${error.message}`
      });
    });
    
    req.write(postData);
    req.end();
  });
}

// Get Vercel environment variables
function getVercelEnvVars() {
  try {
    const output = execSync('vercel env ls', { encoding: 'utf8' });
    const lines = output.split('\n');
    const envVars = {
      development: [],
      production: []
    };
    
    lines.forEach(line => {
      if (line.includes('SQUARE_')) {
        if (line.includes('Development') || line.includes('Preview')) {
          envVars.development.push(line.trim());
        }
        if (line.includes('Production')) {
          envVars.production.push(line.trim());
        }
      }
    });
    
    return envVars;
  } catch (error) {
    return null;
  }
}

// Generate test payment data
function generateTestPayment() {
  const nonce = `test_nonce_${Date.now()}`;
  const amount = Math.floor(Math.random() * 10000) + 100; // Random amount between $1 and $100
  
  return {
    sourceId: nonce,
    amountMoney: {
      amount: amount,
      currency: 'USD'
    },
    idempotencyKey: crypto.randomUUID()
  };
}

// Main test function
async function runTests() {
  console.log(`${colors.bright}${colors.blue}====================================`);
  console.log(`Square Payment Configuration Test`);
  console.log(`====================================${colors.reset}\n`);

  // Test 1: Check local environment
  console.log(`${colors.cyan}📍 LOCAL ENVIRONMENT${colors.reset}`);
  console.log(`${colors.bright}─────────────────────${colors.reset}`);
  
  const localEnv = loadLocalEnv();
  let localSquareValid = false;
  
  if (localEnv.SQUARE_APPLICATION_ID) {
    console.log(`${colors.green}✓ SQUARE_APPLICATION_ID found${colors.reset}`);
    console.log(`  ID: ${localEnv.SQUARE_APPLICATION_ID}`);
    
    // Check if it matches expected sandbox ID
    if (localEnv.SQUARE_APPLICATION_ID === expectedConfig.sandbox.applicationId) {
      console.log(`  ${colors.green}✓ Matches expected sandbox ID${colors.reset}`);
    } else if (localEnv.SQUARE_APPLICATION_ID === expectedConfig.production.applicationId) {
      console.log(`  ${colors.yellow}⚠ Using production ID locally (should use sandbox)${colors.reset}`);
    } else {
      console.log(`  ${colors.yellow}⚠ Unknown application ID${colors.reset}`);
    }
  } else {
    console.log(`${colors.red}✗ SQUARE_APPLICATION_ID not found${colors.reset}`);
  }
  
  if (localEnv.SQUARE_ACCESS_TOKEN) {
    const maskedToken = localEnv.SQUARE_ACCESS_TOKEN.substring(0, 10) + '...' + 
                       localEnv.SQUARE_ACCESS_TOKEN.slice(-4);
    console.log(`${colors.green}✓ SQUARE_ACCESS_TOKEN found${colors.reset}`);
    console.log(`  Token: ${maskedToken}`);
  } else {
    console.log(`${colors.red}✗ SQUARE_ACCESS_TOKEN not found${colors.reset}`);
  }
  
  if (localEnv.SQUARE_ENVIRONMENT) {
    console.log(`${colors.green}✓ SQUARE_ENVIRONMENT: ${localEnv.SQUARE_ENVIRONMENT}${colors.reset}`);
    
    if (localEnv.SQUARE_ENVIRONMENT === 'sandbox') {
      console.log(`  ${colors.green}✓ Correctly set to sandbox for local development${colors.reset}`);
    } else if (localEnv.SQUARE_ENVIRONMENT === 'production') {
      console.log(`  ${colors.yellow}⚠ Using production environment locally (be careful!)${colors.reset}`);
    }
  } else {
    console.log(`${colors.red}✗ SQUARE_ENVIRONMENT not found${colors.reset}`);
  }
  
  // Test the Square API connection if we have credentials
  if (localEnv.SQUARE_ACCESS_TOKEN && localEnv.SQUARE_ENVIRONMENT) {
    console.log(`\n${colors.cyan}Testing Square API connection...${colors.reset}`);
    const apiTest = await testSquareAPI(localEnv.SQUARE_ACCESS_TOKEN, localEnv.SQUARE_ENVIRONMENT);
    
    if (apiTest.success) {
      localSquareValid = true;
      console.log(`${colors.green}✓ Square API connection successful${colors.reset}`);
      if (apiTest.merchantId) {
        console.log(`  Merchant ID: ${apiTest.merchantId}`);
        console.log(`  Business: ${apiTest.businessName}`);
        console.log(`  Country: ${apiTest.country}`);
        console.log(`  Currency: ${apiTest.currency}`);
      }
    } else {
      console.log(`${colors.red}✗ Square API connection failed${colors.reset}`);
      console.log(`  ${apiTest.message}`);
    }
  }

  // Test 2: Check Vercel environment variables
  console.log(`\n${colors.cyan}☁️  VERCEL CONFIGURATION${colors.reset}`);
  console.log(`${colors.bright}─────────────────────${colors.reset}`);
  
  const vercelVars = getVercelEnvVars();
  
  if (vercelVars) {
    console.log(`${colors.magenta}Development/Preview Environment:${colors.reset}`);
    if (vercelVars.development.length > 0) {
      console.log(`${colors.green}✓ Square variables configured${colors.reset}`);
      console.log(`  Found ${vercelVars.development.length} Square variable(s)`);
      
      // Check for all required variables
      const hasAppId = vercelVars.development.some(v => v.includes('SQUARE_APPLICATION_ID'));
      const hasToken = vercelVars.development.some(v => v.includes('SQUARE_ACCESS_TOKEN'));
      const hasEnv = vercelVars.development.some(v => v.includes('SQUARE_ENVIRONMENT'));
      
      if (hasAppId && hasToken && hasEnv) {
        console.log(`  ${colors.green}✓ All required variables present${colors.reset}`);
      } else {
        console.log(`  ${colors.yellow}⚠ Missing some required variables${colors.reset}`);
        if (!hasAppId) console.log(`    - SQUARE_APPLICATION_ID`);
        if (!hasToken) console.log(`    - SQUARE_ACCESS_TOKEN`);
        if (!hasEnv) console.log(`    - SQUARE_ENVIRONMENT`);
      }
    } else {
      console.log(`${colors.red}✗ No Square variables found${colors.reset}`);
    }
    
    console.log(`\n${colors.magenta}Production Environment:${colors.reset}`);
    if (vercelVars.production.length > 0) {
      console.log(`${colors.green}✓ Square variables configured${colors.reset}`);
      console.log(`  Found ${vercelVars.production.length} Square variable(s)`);
      
      const hasAppId = vercelVars.production.some(v => v.includes('SQUARE_APPLICATION_ID'));
      const hasToken = vercelVars.production.some(v => v.includes('SQUARE_ACCESS_TOKEN'));
      const hasEnv = vercelVars.production.some(v => v.includes('SQUARE_ENVIRONMENT'));
      
      if (hasAppId && hasToken && hasEnv) {
        console.log(`  ${colors.green}✓ All required variables present${colors.reset}`);
      } else {
        console.log(`  ${colors.yellow}⚠ Missing some required variables${colors.reset}`);
        if (!hasAppId) console.log(`    - SQUARE_APPLICATION_ID`);
        if (!hasToken) console.log(`    - SQUARE_ACCESS_TOKEN`);
        if (!hasEnv) console.log(`    - SQUARE_ENVIRONMENT`);
      }
    } else {
      console.log(`${colors.red}✗ No Square variables found${colors.reset}`);
    }
  } else {
    console.log(`${colors.yellow}⚠ Could not retrieve Vercel environment variables${colors.reset}`);
    console.log(`  Make sure you're logged in to Vercel CLI`);
  }

  // Test 3: Test deployed payment endpoints
  console.log(`\n${colors.cyan}💳 PAYMENT ENDPOINTS${colors.reset}`);
  console.log(`${colors.bright}─────────────────────${colors.reset}`);
  
  console.log(`\n${colors.magenta}Testing Development:${colors.reset}`);
  console.log(`  URL: ${environments.development}`);
  const devTest = await testPaymentEndpoint(environments.development, 'Development');
  if (devTest.success) {
    console.log(`  ${colors.green}✓ ${devTest.message}${colors.reset}`);
  } else {
    console.log(`  ${colors.red}✗ ${devTest.message}${colors.reset}`);
  }
  
  console.log(`\n${colors.magenta}Testing Production:${colors.reset}`);
  console.log(`  URL: ${environments.production}`);
  const prodTest = await testPaymentEndpoint(environments.production, 'Production');
  if (prodTest.success) {
    console.log(`  ${colors.green}✓ ${prodTest.message}${colors.reset}`);
  } else {
    console.log(`  ${colors.red}✗ ${prodTest.message}${colors.reset}`);
  }

  // Test 4: Show test payment data
  console.log(`\n${colors.cyan}🧪 TEST PAYMENT DATA${colors.reset}`);
  console.log(`${colors.bright}─────────────────────${colors.reset}`);
  
  const testPayment = generateTestPayment();
  console.log(`\nSample test payment request:`);
  console.log(`${colors.yellow}${JSON.stringify(testPayment, null, 2)}${colors.reset}`);
  
  console.log(`\n${colors.cyan}Test Card Numbers:${colors.reset}`);
  console.log(`  Visa: ${colors.blue}4111 1111 1111 1111${colors.reset}`);
  console.log(`  Mastercard: ${colors.blue}5105 1051 0510 5100${colors.reset}`);
  console.log(`  Amex: ${colors.blue}3400 0000 0000 009${colors.reset}`);
  console.log(`  Declined: ${colors.blue}4000 0000 0000 0002${colors.reset}`);
  
  // Summary
  console.log(`\n${colors.bright}${colors.blue}====================================`);
  console.log(`SUMMARY`);
  console.log(`====================================${colors.reset}`);
  
  const allTests = [];
  
  if (localEnv.SQUARE_APPLICATION_ID && localEnv.SQUARE_ACCESS_TOKEN && localEnv.SQUARE_ENVIRONMENT) {
    allTests.push({ name: 'Local Config', success: true });
    if (localSquareValid) {
      allTests.push({ name: 'Local API Connection', success: true });
    } else {
      allTests.push({ name: 'Local API Connection', success: false });
    }
  } else {
    allTests.push({ name: 'Local Config', success: false });
  }
  
  if (vercelVars && vercelVars.development.length >= 3) {
    allTests.push({ name: 'Vercel Dev Config', success: true });
  } else {
    allTests.push({ name: 'Vercel Dev Config', success: false });
  }
  
  if (vercelVars && vercelVars.production.length >= 3) {
    allTests.push({ name: 'Vercel Prod Config', success: true });
  } else {
    allTests.push({ name: 'Vercel Prod Config', success: false });
  }
  
  allTests.push({ name: 'Dev Payment Endpoint', success: devTest.success });
  allTests.push({ name: 'Prod Payment Endpoint', success: prodTest.success });
  
  allTests.forEach(test => {
    if (test.success) {
      console.log(`${colors.green}✓ ${test.name}${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ ${test.name}${colors.reset}`);
    }
  });
  
  const successCount = allTests.filter(t => t.success).length;
  const totalCount = allTests.length;
  
  console.log(`\n${colors.bright}Result: ${successCount}/${totalCount} checks passed${colors.reset}`);
  
  if (successCount === totalCount) {
    console.log(`${colors.green}${colors.bright}✅ All Square payment configurations are properly set up!${colors.reset}`);
  } else if (successCount >= totalCount - 2) {
    console.log(`${colors.yellow}${colors.bright}⚠️  Most configurations are working, but some need attention${colors.reset}`);
  } else {
    console.log(`${colors.red}${colors.bright}❌ Square payment configuration needs attention${colors.reset}`);
  }

  // Additional information
  console.log(`\n${colors.cyan}📚 DOCUMENTATION & RESOURCES:${colors.reset}`);
  console.log(`• Square Dashboard: ${colors.blue}https://squareup.com/dashboard${colors.reset}`);
  console.log(`• Sandbox Dashboard: ${colors.blue}https://sandbox.squareup.com/dashboard${colors.reset}`);
  console.log(`• API Explorer: ${colors.blue}https://developer.squareup.com/explorer/square${colors.reset}`);
  console.log(`• Test Cards: ${colors.blue}https://developer.squareup.com/docs/testing/test-bank-accounts${colors.reset}`);
  
  console.log(`\n${colors.cyan}💡 QUICK TIPS:${colors.reset}`);
  console.log(`• View Vercel logs: ${colors.yellow}vercel logs${colors.reset}`);
  console.log(`• Update Vercel env: ${colors.yellow}vercel env add SQUARE_ACCESS_TOKEN production${colors.reset}`);
  console.log(`• Pull latest env: ${colors.yellow}vercel env pull .env.local${colors.reset}`);
  console.log(`• Test locally: ${colors.yellow}npm run dev${colors.reset} then visit ${colors.blue}http://localhost:4321/api/payment/create-intent${colors.reset}`);
  
  if (!localSquareValid && localEnv.SQUARE_ACCESS_TOKEN) {
    console.log(`\n${colors.yellow}⚠️  Note: Your local Square API connection failed.${colors.reset}`);
    console.log(`   This might be because:`);
    console.log(`   1. The access token has expired`);
    console.log(`   2. The token doesn't match the environment (sandbox vs production)`);
    console.log(`   3. Network connectivity issues`);
    console.log(`   Try regenerating your access token in the Square dashboard.`);
  }
}

// Run the tests
console.clear();
runTests().catch(error => {
  console.error(`${colors.red}Error running tests: ${error.message}${colors.reset}`);
  process.exit(1);
});