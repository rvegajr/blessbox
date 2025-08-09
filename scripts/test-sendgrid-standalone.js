#!/usr/bin/env node

/**
 * Standalone SendGrid Test Script
 * 
 * This script tests SendGrid email functionality independently.
 * It automatically loads environment variables from .env.local if it exists.
 * 
 * Usage:
 *   1. Make sure your .env.local file contains SENDGRID_API_KEY
 *   
 *   2. Run the script:
 *      node test-sendgrid-standalone.js
 *   
 *   3. Or override with inline API key:
 *      SENDGRID_API_KEY="your-api-key" node test-sendgrid-standalone.js
 */

import https from 'https';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (fs.existsSync(envPath)) {
    console.log('Loading environment from .env.local...');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      // Skip comments and empty lines
      if (line.trim() && !line.trim().startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          // Remove quotes if present
          const cleanValue = value.replace(/^["']|["']$/g, '');
          // Always set the value from .env.local (override any existing value)
          process.env[key.trim()] = cleanValue;
        }
      }
    });
    console.log('✓ Environment loaded from .env.local\n');
  } else {
    console.log('Note: .env.local not found, using system environment variables\n');
  }
}

// Load env file before anything else
loadEnvFile();

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask questions
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Helper function to make HTTPS requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body ? JSON.parse(body) : null
        });
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test SendGrid API key validity
async function testApiKey(apiKey) {
  console.log(`\n${colors.cyan}Testing API Key...${colors.reset}`);
  
  const options = {
    hostname: 'api.sendgrid.com',
    path: '/v3/user/profile',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      console.log(`${colors.green}✓ API Key is valid${colors.reset}`);
      console.log(`  Account: ${response.body.email || 'N/A'}`);
      console.log(`  Username: ${response.body.username || 'N/A'}`);
      return true;
    } else {
      console.log(`${colors.red}✗ API Key validation failed${colors.reset}`);
      console.log(`  Status: ${response.statusCode}`);
      if (response.body && response.body.errors) {
        console.log(`  Error: ${response.body.errors[0].message}`);
      }
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Failed to validate API key${colors.reset}`);
    console.log(`  Error: ${error.message}`);
    return false;
  }
}

// Get verified senders
async function getVerifiedSenders(apiKey) {
  console.log(`\n${colors.cyan}Checking Verified Senders...${colors.reset}`);
  
  const options = {
    hostname: 'api.sendgrid.com',
    path: '/v3/verified_senders',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options);
    
    if (response.statusCode === 200 && response.body.results) {
      const senders = response.body.results;
      if (senders.length > 0) {
        console.log(`${colors.green}✓ Found ${senders.length} verified sender(s)${colors.reset}`);
        senders.forEach((sender, index) => {
          console.log(`  ${index + 1}. ${sender.from_email} (${sender.from_name || 'No name'})`);
          console.log(`     Status: ${sender.verified ? 'Verified' : 'Pending'}`);
        });
        return senders;
      } else {
        console.log(`${colors.yellow}⚠ No verified senders found${colors.reset}`);
        console.log(`  You need to add and verify a sender email address`);
        return [];
      }
    } else {
      console.log(`${colors.red}✗ Failed to get verified senders${colors.reset}`);
      return [];
    }
  } catch (error) {
    console.log(`${colors.red}✗ Error fetching verified senders${colors.reset}`);
    console.log(`  Error: ${error.message}`);
    return [];
  }
}

// Send test email
async function sendTestEmail(apiKey, fromEmail, toEmail, fromName = 'SendGrid Test') {
  console.log(`\n${colors.cyan}Sending Test Email...${colors.reset}`);
  console.log(`  From: ${fromEmail}`);
  console.log(`  To: ${toEmail}`);
  
  const emailData = {
    personalizations: [{
      to: [{ email: toEmail }]
    }],
    from: {
      email: fromEmail,
      name: fromName
    },
    subject: `SendGrid Test - ${new Date().toLocaleString()}`,
    content: [{
      type: 'text/plain',
      value: `This is a test email from SendGrid.\n\nTimestamp: ${new Date().toISOString()}\n\nIf you received this email, your SendGrid configuration is working correctly!`
    }, {
      type: 'text/html',
      value: `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #007bff;">SendGrid Test Email</h2>
            <p>This is a test email from SendGrid.</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="color: #28a745;">✓ If you received this email, your SendGrid configuration is working correctly!</p>
          </body>
        </html>
      `
    }]
  };

  const options = {
    hostname: 'api.sendgrid.com',
    path: '/v3/mail/send',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options, emailData);
    
    if (response.statusCode === 202) {
      console.log(`${colors.green}✓ Email sent successfully!${colors.reset}`);
      console.log(`  Status: ${response.statusCode} (Accepted)`);
      console.log(`  Message ID: ${response.headers['x-message-id'] || 'N/A'}`);
      return true;
    } else {
      console.log(`${colors.red}✗ Failed to send email${colors.reset}`);
      console.log(`  Status: ${response.statusCode}`);
      if (response.body && response.body.errors) {
        response.body.errors.forEach(error => {
          console.log(`  Error: ${error.message}`);
          if (error.field) console.log(`  Field: ${error.field}`);
        });
      }
      return false;
    }
  } catch (error) {
    console.log(`${colors.red}✗ Error sending email${colors.reset}`);
    console.log(`  Error: ${error.message}`);
    return false;
  }
}

// Check account limits
async function checkAccountLimits(apiKey) {
  console.log(`\n${colors.cyan}Checking Account Limits...${colors.reset}`);
  
  const options = {
    hostname: 'api.sendgrid.com',
    path: '/v3/user/credits',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      console.log(`${colors.green}✓ Account limits retrieved${colors.reset}`);
      if (response.body) {
        console.log(`  Remaining: ${response.body.remain || 'N/A'}`);
        console.log(`  Used: ${response.body.used || 'N/A'}`);
        console.log(`  Total: ${response.body.total || 'N/A'}`);
      }
    } else {
      // This endpoint might not be available for all plans
      console.log(`${colors.yellow}⚠ Could not retrieve account limits (might not be available for your plan)${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.yellow}⚠ Error checking account limits${colors.reset}`);
  }
}

// Main test function
async function runTests() {
  console.log(`${colors.bright}${colors.blue}=================================`);
  console.log(`SendGrid Standalone Test Script`);
  console.log(`=================================${colors.reset}\n`);

  // Get API key
  let apiKey = process.env.SENDGRID_API_KEY;
  
  if (!apiKey) {
    console.log(`${colors.yellow}No SENDGRID_API_KEY found in .env.local or environment.${colors.reset}`);
    apiKey = await question('Please enter your SendGrid API key: ');
    console.log();
  } else {
    console.log(`${colors.green}✓ Using SENDGRID_API_KEY from .env.local/environment${colors.reset}`);
    console.log(`  Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`);
  }

  if (!apiKey) {
    console.log(`${colors.red}✗ No API key provided. Exiting.${colors.reset}`);
    rl.close();
    process.exit(1);
  }

  // Test API key
  const isValidKey = await testApiKey(apiKey);
  if (!isValidKey) {
    console.log(`\n${colors.red}Cannot proceed with invalid API key.${colors.reset}`);
    rl.close();
    process.exit(1);
  }

  // Check verified senders
  const senders = await getVerifiedSenders(apiKey);

  // Check account limits
  await checkAccountLimits(apiKey);

  // Ask if user wants to send a test email
  const sendTest = await question(`\n${colors.cyan}Would you like to send a test email? (y/n): ${colors.reset}`);
  
  if (sendTest.toLowerCase() === 'y') {
    let fromEmail;
    
    if (senders.length > 0) {
      console.log('\nAvailable verified senders:');
      senders.forEach((sender, index) => {
        console.log(`  ${index + 1}. ${sender.from_email}`);
      });
      
      const choice = await question('\nSelect a sender (enter number) or press Enter to input manually: ');
      
      if (choice && !isNaN(choice) && choice > 0 && choice <= senders.length) {
        fromEmail = senders[choice - 1].from_email;
      }
    }
    
    if (!fromEmail) {
      fromEmail = await question('Enter FROM email address: ');
    }
    
    const toEmail = await question('Enter TO email address (where to send the test): ');
    
    if (fromEmail && toEmail) {
      await sendTestEmail(apiKey, fromEmail, toEmail);
    } else {
      console.log(`${colors.yellow}Skipping email test - missing email addresses${colors.reset}`);
    }
  }

  // Summary
  console.log(`\n${colors.bright}${colors.blue}=================================`);
  console.log(`Test Summary`);
  console.log(`=================================${colors.reset}`);
  console.log(`${colors.green}✓ API Key: Valid${colors.reset}`);
  console.log(`${senders.length > 0 ? colors.green : colors.yellow}${senders.length > 0 ? '✓' : '⚠'} Verified Senders: ${senders.length}${colors.reset}`);
  
  if (senders.length === 0) {
    console.log(`\n${colors.yellow}Next Steps:${colors.reset}`);
    console.log('1. Add and verify a sender email at: https://app.sendgrid.com/settings/sender_auth');
    console.log('2. Run this test again after verification');
  }

  console.log(`\n${colors.green}Test complete!${colors.reset}`);
  rl.close();
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error(`${colors.red}Unhandled error: ${error.message}${colors.reset}`);
  rl.close();
  process.exit(1);
});

// Run the tests
runTests().catch((error) => {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  rl.close();
  process.exit(1);
});