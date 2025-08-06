#!/usr/bin/env node

/**
 * Direct SendGrid Email Test
 * Sends a test email using your verified sender address
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

// Color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Configuration - Update the TO_EMAIL to where you want to receive the test
// Try different verified sender options
const senderOptions = [
  'contact@yolovibecodebootcamp.com',
  'rvegajr@yolovibecodebootcamp.com',
  'contact@em1057.yolovibecodebootcamp.com',  // Using domain auth subdomain
  'noreply@em1057.yolovibecodebootcamp.com',  // Using domain auth subdomain
];

const config = {
  apiKey: process.env.SENDGRID_API_KEY,
  fromEmail: process.argv[3] || senderOptions[0],  // Can override sender with 3rd arg
  fromName: 'BlessBox Test',
  toEmail: process.argv[2] || 'rvegajr@darkware.net',  // Can override with command line arg
};

// Send email function
async function sendEmail() {
  console.log(`${colors.bright}${colors.blue}SendGrid Direct Email Test${colors.reset}\n`);
  
  if (!config.apiKey) {
    console.error(`${colors.red}✗ No SENDGRID_API_KEY found in .env.local${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.cyan}Configuration:${colors.reset}`);
  console.log(`  API Key: ${config.apiKey.substring(0, 10)}...${config.apiKey.substring(config.apiKey.length - 4)}`);
  console.log(`  From: ${config.fromEmail} (${config.fromName})`);
  console.log(`  To: ${config.toEmail}\n`);

  const emailData = {
    personalizations: [{
      to: [{ email: config.toEmail }],
      subject: `BlessBox SendGrid Test - ${new Date().toLocaleString()}`
    }],
    from: {
      email: config.fromEmail,
      name: config.fromName
    },
    content: [{
      type: 'text/plain',
      value: `This is a test email from BlessBox using SendGrid.

Timestamp: ${new Date().toISOString()}

If you received this email, your SendGrid configuration is working correctly!

Configuration Details:
- Sent via: SendGrid API
- From: ${config.fromEmail}
- API Key: ${config.apiKey.substring(0, 10)}...`
    }, {
      type: 'text/html',
      value: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎉 SendGrid Test Success!</h1>
  </div>
  
  <div style="background: #f7f7f7; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
    <h2 style="color: #667eea; margin-top: 0;">Test Email from BlessBox</h2>
    
    <p style="font-size: 16px;">This is a test email sent via SendGrid API to verify your email configuration.</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #333; margin-top: 0;">📊 Configuration Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #666;">Status:</td>
          <td style="padding: 8px 0; color: #28a745; font-weight: bold;">✅ Working</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Timestamp:</td>
          <td style="padding: 8px 0;">${new Date().toISOString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">From:</td>
          <td style="padding: 8px 0;">${config.fromEmail}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #666;">Provider:</td>
          <td style="padding: 8px 0;">SendGrid API v3</td>
        </tr>
      </table>
    </div>
    
    <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50;">
      <p style="margin: 0; color: #2e7d32;">
        <strong>✓ Success!</strong> Your SendGrid integration is working correctly. You can now send emails from your BlessBox application.
      </p>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #999; text-align: center;">
      This is an automated test email from BlessBox. No action required.
    </p>
  </div>
</body>
</html>`
    }]
  };

  console.log(`${colors.cyan}Sending email...${colors.reset}`);

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(emailData);
    
    const options = {
      hostname: 'api.sendgrid.com',
      port: 443,
      path: '/v3/mail/send',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
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
        if (res.statusCode === 202) {
          console.log(`${colors.green}✅ Email sent successfully!${colors.reset}`);
          console.log(`  Status: ${res.statusCode} (Accepted)`);
          console.log(`  Message ID: ${res.headers['x-message-id'] || 'Check SendGrid dashboard'}`);
          console.log(`\n${colors.green}Check ${config.toEmail} for the test email!${colors.reset}`);
          resolve();
        } else {
          console.log(`${colors.red}✗ Failed to send email${colors.reset}`);
          console.log(`  Status Code: ${res.statusCode}`);
          if (body) {
            try {
              const error = JSON.parse(body);
              console.log(`  Error Details:`);
              if (error.errors) {
                error.errors.forEach(err => {
                  console.log(`    - ${err.message}`);
                  if (err.field) console.log(`      Field: ${err.field}`);
                  if (err.help) console.log(`      Help: ${err.help}`);
                });
              } else {
                console.log(`    ${body}`);
              }
            } catch (e) {
              console.log(`  Response: ${body}`);
            }
          }
          reject(new Error(`Failed with status ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error(`${colors.red}✗ Request failed: ${error.message}${colors.reset}`);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Run the test
sendEmail()
  .then(() => {
    console.log(`\n${colors.bright}${colors.green}Test completed successfully!${colors.reset}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`\n${colors.bright}${colors.red}Test failed!${colors.reset}`);
    process.exit(1);
  });