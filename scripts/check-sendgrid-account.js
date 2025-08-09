#!/usr/bin/env node

/**
 * SendGrid Account Checker
 * Shows detailed information about which SendGrid account an API key belongs to
 */

import https from 'https';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (fs.existsSync(envPath)) {
    console.log('Loading environment from .env.local...');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      if (line.trim() && !line.trim().startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          const cleanValue = value.replace(/^["']|["']$/g, '');
          // Always set the value from .env.local (override any existing value)
          process.env[key.trim()] = cleanValue;
        }
      }
    });
    console.log('✓ Environment loaded\n');
  }
}

loadEnvFile();

const apiKey = process.env.SENDGRID_API_KEY;

if (!apiKey) {
  console.error('❌ No SENDGRID_API_KEY found in environment');
  process.exit(1);
}

console.log('🔍 SendGrid Account Information\n');
console.log(`API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}\n`);

// Helper function to make API requests
function makeRequest(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.sendgrid.com',
      port: 443,
      path: path,
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
        resolve({
          statusCode: res.statusCode,
          body: body ? JSON.parse(body) : null
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        statusCode: 0,
        error: error.message
      });
    });

    req.end();
  });
}

async function checkAccount() {
  // Get user profile
  console.log('📋 User Profile:');
  const profile = await makeRequest('/v3/user/profile');
  if (profile.statusCode === 200 && profile.body) {
    console.log(`  Email: ${profile.body.email || 'N/A'}`);
    console.log(`  Username: ${profile.body.username || 'N/A'}`);
    console.log(`  First Name: ${profile.body.first_name || 'N/A'}`);
    console.log(`  Last Name: ${profile.body.last_name || 'N/A'}`);
    console.log(`  Account ID: ${profile.body.id || 'N/A'}`);
  } else {
    console.log('  ❌ Could not retrieve profile');
  }

  // Get account details
  console.log('\n📊 Account Details:');
  const account = await makeRequest('/v3/user/account');
  if (account.statusCode === 200 && account.body) {
    console.log(`  Type: ${account.body.type || 'N/A'}`);
    console.log(`  Reputation: ${account.body.reputation || 'N/A'}`);
  }

  // Check subuser info (if this is a subuser API key)
  console.log('\n👥 Subuser Information:');
  const subuser = await makeRequest('/v3/subusers');
  if (subuser.statusCode === 200 && subuser.body) {
    if (Array.isArray(subuser.body) && subuser.body.length > 0) {
      console.log('  This appears to be a parent account with subusers:');
      subuser.body.forEach(su => {
        console.log(`    - ${su.username} (ID: ${su.id})`);
      });
    } else {
      console.log('  No subusers found (this might be a subuser account itself)');
    }
  } else if (subuser.statusCode === 401 || subuser.statusCode === 403) {
    console.log('  This might be a subuser account (cannot access subuser endpoint)');
  }

  // Get API key scopes
  console.log('\n🔑 API Key Permissions:');
  const scopes = await makeRequest('/v3/scopes');
  if (scopes.statusCode === 200 && scopes.body && scopes.body.scopes) {
    const scopeList = scopes.body.scopes;
    console.log(`  Total scopes: ${scopeList.length}`);
    
    // Check for important scopes
    const importantScopes = [
      'mail.send',
      'sender_verification_eligible',
      'email_activity.read',
      '2fa_required'
    ];
    
    importantScopes.forEach(scope => {
      if (scopeList.includes(scope)) {
        console.log(`  ✅ ${scope}`);
      } else {
        console.log(`  ❌ ${scope} (missing)`);
      }
    });
  }

  // Try to get verified senders (might fail due to permissions)
  console.log('\n✉️  Verified Senders:');
  const senders = await makeRequest('/v3/verified_senders');
  if (senders.statusCode === 200 && senders.body && senders.body.results) {
    if (senders.body.results.length > 0) {
      console.log(`  Found ${senders.body.results.length} verified sender(s):`);
      senders.body.results.forEach(sender => {
        console.log(`    - ${sender.from_email} (${sender.verified ? '✅ Verified' : '⏳ Pending'})`);
      });
    } else {
      console.log('  ⚠️  No verified senders found on this account');
    }
  } else if (senders.statusCode === 403) {
    console.log('  ❌ No permission to view verified senders (might be using domain authentication)');
  } else {
    console.log('  ❌ Could not retrieve verified senders');
  }

  // Check authenticated domains
  console.log('\n🌐 Authenticated Domains:');
  const domains = await makeRequest('/v3/whitelabel/domains');
  if (domains.statusCode === 200 && domains.body) {
    if (Array.isArray(domains.body) && domains.body.length > 0) {
      console.log(`  Found ${domains.body.length} authenticated domain(s):`);
      domains.body.forEach(domain => {
        console.log(`    - ${domain.domain} (${domain.valid ? '✅ Valid' : '❌ Invalid'})`);
        if (domain.subdomain) {
          console.log(`      Subdomain: ${domain.subdomain}`);
        }
      });
    } else {
      console.log('  No authenticated domains found');
    }
  } else {
    console.log('  Could not retrieve authenticated domains');
  }

  console.log('\n' + '='.repeat(50));
  console.log('\n💡 Troubleshooting Tips:\n');
  console.log('1. If you see "No verified senders" but have them in the UI:');
  console.log('   - You might be using an API key from a different account');
  console.log('   - Check if you have multiple SendGrid accounts\n');
  
  console.log('2. If this shows different account info than expected:');
  console.log('   - Generate a new API key from the correct account');
  console.log('   - Update SENDGRID_API_KEY in your .env.local\n');
  
  console.log('3. For domain authentication:');
  console.log('   - You can send from any address @yourdomain.com');
  console.log('   - No need to verify individual addresses');
}

checkAccount().catch(error => {
  console.error('Error:', error.message);
});