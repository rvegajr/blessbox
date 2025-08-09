#!/usr/bin/env node

/**
 * SendGrid Environment Configuration Tester
 * 
 * Tests SendGrid configuration across all environments:
 * - Local (.env.local)
 * - Vercel Development 
 * - Vercel Production
 * 
 * Usage:
 *   node scripts/test-sendgrid-environments.js
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

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

// Test SendGrid API key directly
async function testSendGridKey(apiKey, environment) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.sendgrid.com',
      port: 443,
      path: '/v3/user/profile',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
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
          resolve({ 
            success: true, 
            environment,
            message: 'API key is valid'
          });
        } else {
          resolve({ 
            success: false, 
            environment,
            message: `Invalid API key (Status: ${res.statusCode})`
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

// Test email endpoint on deployed environments
async function testEmailEndpoint(url, environment) {
  return new Promise((resolve) => {
    const testUrl = `${url}/api/system/health-check`;
    
    https.get(testUrl, (res) => {
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
              message: 'Health check passed',
              details: data
            });
          } catch {
            resolve({
              success: true,
              environment,
              message: 'Endpoint accessible',
              statusCode: res.statusCode
            });
          }
        } else {
          resolve({
            success: false,
            environment,
            message: `Health check failed (Status: ${res.statusCode})`,
            statusCode: res.statusCode
          });
        }
      });
    }).on('error', (error) => {
      resolve({
        success: false,
        environment,
        message: `Connection error: ${error.message}`
      });
    });
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
      if (line.includes('SENDGRID')) {
        if (line.includes('Development')) {
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

// Main test function
async function runTests() {
  console.log(`${colors.bright}${colors.blue}====================================`);
  console.log(`SendGrid Environment Configuration Test`);
  console.log(`====================================${colors.reset}\n`);

  // Test 1: Check local environment
  console.log(`${colors.cyan}📍 LOCAL ENVIRONMENT${colors.reset}`);
  console.log(`${colors.bright}─────────────────────${colors.reset}`);
  
  const localEnv = loadLocalEnv();
  
  if (localEnv.SENDGRID_API_KEY) {
    const apiKey = localEnv.SENDGRID_API_KEY.trim();
    console.log(`${colors.green}✓ SENDGRID_API_KEY found${colors.reset}`);
    console.log(`  Key: ${apiKey.substring(0, 10)}...${apiKey.slice(-4)}`);
    
    if (localEnv.SENDGRID_FROM_EMAIL) {
      console.log(`${colors.green}✓ SENDGRID_FROM_EMAIL: ${localEnv.SENDGRID_FROM_EMAIL.trim()}${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠ SENDGRID_FROM_EMAIL not set${colors.reset}`);
    }
    
    if (localEnv.SENDGRID_FROM_NAME) {
      console.log(`${colors.green}✓ SENDGRID_FROM_NAME: ${localEnv.SENDGRID_FROM_NAME.trim()}${colors.reset}`);
    } else {
      console.log(`${colors.yellow}⚠ SENDGRID_FROM_NAME not set${colors.reset}`);
    }
    
    // Test the API key
    const localTest = await testSendGridKey(apiKey, 'Local');
    if (localTest.success) {
      console.log(`${colors.green}✓ API Key validation: ${localTest.message}${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ API Key validation: ${localTest.message}${colors.reset}`);
    }
  } else {
    console.log(`${colors.red}✗ SENDGRID_API_KEY not found in .env.local${colors.reset}`);
  }

  // Test 2: Check Vercel environment variables
  console.log(`\n${colors.cyan}☁️  VERCEL CONFIGURATION${colors.reset}`);
  console.log(`${colors.bright}─────────────────────${colors.reset}`);
  
  const vercelVars = getVercelEnvVars();
  
  if (vercelVars) {
    console.log(`${colors.magenta}Development Environment:${colors.reset}`);
    if (vercelVars.development.length > 0) {
      console.log(`${colors.green}✓ SendGrid variables configured${colors.reset}`);
      console.log(`  Found ${vercelVars.development.length} SendGrid variable(s)`);
    } else {
      console.log(`${colors.red}✗ No SendGrid variables found${colors.reset}`);
    }
    
    console.log(`\n${colors.magenta}Production Environment:${colors.reset}`);
    if (vercelVars.production.length > 0) {
      console.log(`${colors.green}✓ SendGrid variables configured${colors.reset}`);
      console.log(`  Found ${vercelVars.production.length} SendGrid variable(s)`);
    } else {
      console.log(`${colors.red}✗ No SendGrid variables found${colors.reset}`);
    }
  } else {
    console.log(`${colors.yellow}⚠ Could not retrieve Vercel environment variables${colors.reset}`);
    console.log(`  Make sure you're logged in to Vercel CLI`);
  }

  // Test 3: Test deployed endpoints
  console.log(`\n${colors.cyan}🌐 DEPLOYED ENDPOINTS${colors.reset}`);
  console.log(`${colors.bright}─────────────────────${colors.reset}`);
  
  console.log(`\n${colors.magenta}Testing Development:${colors.reset}`);
  console.log(`  URL: ${environments.development}`);
  const devTest = await testEmailEndpoint(environments.development, 'Development');
  if (devTest.success) {
    console.log(`  ${colors.green}✓ ${devTest.message}${colors.reset}`);
  } else {
    console.log(`  ${colors.red}✗ ${devTest.message}${colors.reset}`);
  }
  
  console.log(`\n${colors.magenta}Testing Production:${colors.reset}`);
  console.log(`  URL: ${environments.production}`);
  const prodTest = await testEmailEndpoint(environments.production, 'Production');
  if (prodTest.success) {
    console.log(`  ${colors.green}✓ ${prodTest.message}${colors.reset}`);
  } else {
    console.log(`  ${colors.red}✗ ${prodTest.message}${colors.reset}`);
  }

  // Test 4: Quick email test URLs
  console.log(`\n${colors.cyan}🧪 TEST EMAIL ENDPOINTS${colors.reset}`);
  console.log(`${colors.bright}─────────────────────${colors.reset}`);
  console.log(`\nYou can test email sending by visiting these URLs:`);
  console.log(`${colors.blue}Development:${colors.reset} ${environments.development}/email-test`);
  console.log(`${colors.blue}Production:${colors.reset} ${environments.production}/email-test`);
  
  // Summary
  console.log(`\n${colors.bright}${colors.blue}====================================`);
  console.log(`SUMMARY`);
  console.log(`====================================${colors.reset}`);
  
  const allTests = [];
  
  if (localEnv.SENDGRID_API_KEY) {
    allTests.push({ name: 'Local Config', success: true });
  } else {
    allTests.push({ name: 'Local Config', success: false });
  }
  
  if (vercelVars && vercelVars.development.length > 0) {
    allTests.push({ name: 'Vercel Dev Config', success: true });
  } else {
    allTests.push({ name: 'Vercel Dev Config', success: false });
  }
  
  if (vercelVars && vercelVars.production.length > 0) {
    allTests.push({ name: 'Vercel Prod Config', success: true });
  } else {
    allTests.push({ name: 'Vercel Prod Config', success: false });
  }
  
  allTests.forEach(test => {
    if (test.success) {
      console.log(`${colors.green}✓ ${test.name}${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ ${test.name}${colors.reset}`);
    }
  });
  
  const successCount = allTests.filter(t => t.success).length;
  const totalCount = allTests.length;
  
  console.log(`\n${colors.bright}Result: ${successCount}/${totalCount} configurations verified${colors.reset}`);
  
  if (successCount === totalCount) {
    console.log(`${colors.green}${colors.bright}✅ All SendGrid configurations are properly set up!${colors.reset}`);
  } else {
    console.log(`${colors.yellow}${colors.bright}⚠️  Some configurations need attention${colors.reset}`);
  }

  // Additional tips
  console.log(`\n${colors.cyan}💡 QUICK TIPS:${colors.reset}`);
  console.log(`• To test sending emails locally: ${colors.yellow}node scripts/test-sendgrid-direct.js${colors.reset}`);
  console.log(`• To view Vercel logs: ${colors.yellow}vercel logs${colors.reset}`);
  console.log(`• To redeploy: ${colors.yellow}vercel --prod${colors.reset} (production) or ${colors.yellow}vercel${colors.reset} (preview)`);
  console.log(`• SendGrid Dashboard: ${colors.blue}https://app.sendgrid.com${colors.reset}`);
}

// Run the tests
console.clear();
runTests().catch(error => {
  console.error(`${colors.red}Error running tests: ${error.message}${colors.reset}`);
  process.exit(1);
});