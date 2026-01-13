#!/usr/bin/env tsx
/**
 * Test BlessBox Email System
 * 
 * Tests if email addresses work and checks SendGrid configuration
 */

import { config } from 'dotenv';
import sgMail from '@sendgrid/mail';

// Load environment variables
config({ path: '.env.local' });
config({ path: '.env.production.local' });

const DIAGNOSTICS_SECRET = process.env.DIAGNOSTICS_SECRET || 'YhvE1G1WTwFZCIR8TkoiBPpY2I-N8mRwf1LAMNcynRQ';
const TEST_EMAIL = process.argv[2] || 'rvegajr@darkware.net';

async function testEmailSystem() {
  console.log('🧪 Testing BlessBox Email System\n');
  console.log('=' .repeat(50));

  // 1. Check environment variables
  console.log('\n📋 Step 1: Checking Environment Variables');
  console.log('-'.repeat(50));
  
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  const sendgridFromEmail = process.env.SENDGRID_FROM_EMAIL;
  const emailReplyTo = process.env.EMAIL_REPLY_TO;

  console.log(`SENDGRID_API_KEY: ${sendgridApiKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`SENDGRID_FROM_EMAIL: ${sendgridFromEmail || '❌ Missing'}`);
  console.log(`EMAIL_REPLY_TO: ${emailReplyTo || 'Not set (optional)'}`);

  if (!sendgridApiKey || !sendgridFromEmail) {
    console.log('\n❌ Missing required environment variables!');
    return;
  }

  // 2. Check SendGrid API key validity
  console.log('\n🔑 Step 2: Validating SendGrid API Key');
  console.log('-'.repeat(50));

  sgMail.setApiKey(sendgridApiKey);

  try {
    const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ API Key Valid`);
      console.log(`   Username: ${data.username || 'N/A'}`);
    } else {
      console.log(`❌ API Key Invalid: Status ${response.status}`);
      return;
    }
  } catch (error: any) {
    console.log(`❌ API Key Invalid: ${error.message}`);
    return;
  }

  // 3. Check verified sender identities
  console.log('\n📧 Step 3: Checking Verified Sender Identities');
  console.log('-'.repeat(50));

  try {
    const response = await fetch('https://api.sendgrid.com/v3/senders', {
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      const senders = data.result || [];
      const verified = senders.filter((s: any) => s.verified === true);
      const verifiedEmails = verified.map((s: any) => s.from?.email).filter(Boolean);

      console.log(`Total Senders: ${senders.length}`);
      console.log(`Verified Senders: ${verified.length}`);
      console.log(`\nVerified Email Addresses:`);
      verifiedEmails.forEach((email: string) => {
        const isConfigured = email.toLowerCase() === sendgridFromEmail.toLowerCase();
        console.log(`  ${isConfigured ? '✅' : '  '} ${email} ${isConfigured ? '(configured)' : ''}`);
      });

      const isFromEmailVerified = verifiedEmails.some(
        (e: string) => e.toLowerCase() === sendgridFromEmail.toLowerCase()
      );

      if (!isFromEmailVerified) {
        console.log(`\n⚠️  WARNING: ${sendgridFromEmail} is NOT verified in SendGrid!`);
        console.log(`   You need to verify this email address in SendGrid dashboard.`);
      } else {
        console.log(`\n✅ ${sendgridFromEmail} is verified!`);
      }
    } else {
      console.log(`❌ Error checking senders: Status ${response.status}`);
    }
  } catch (error: any) {
    console.log(`❌ Error checking senders: ${error.message}`);
  }

  // 4. Check domain authentication
  console.log('\n🌐 Step 4: Checking Domain Authentication');
  console.log('-'.repeat(50));

  try {
    const response = await fetch('https://api.sendgrid.com/v3/whitelabel/domains', {
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const domains = await response.json();
      const verifiedDomains = domains
        .filter((d: any) => d.valid === true)
        .map((d: any) => d.domain);

      console.log(`Total Domains: ${domains.length}`);
      console.log(`Verified Domains: ${verifiedDomains.length}`);
      if (verifiedDomains.length > 0) {
        console.log(`\nVerified Domains:`);
        verifiedDomains.forEach((domain: string) => {
          console.log(`  ✅ ${domain}`);
        });
      }

      const blessboxDomain = sendgridFromEmail.split('@')[1];
      const isDomainVerified = verifiedDomains.some(
        (d: string) => d.toLowerCase() === blessboxDomain.toLowerCase()
      );

      if (!isDomainVerified) {
        console.log(`\n⚠️  ${blessboxDomain} domain is NOT authenticated`);
        console.log(`   Domain authentication allows any email @${blessboxDomain} to send`);
      } else {
        console.log(`\n✅ ${blessboxDomain} domain is authenticated!`);
      }
    } else {
      console.log(`❌ Error checking domains: Status ${response.status}`);
    }
  } catch (error: any) {
    console.log(`❌ Error checking domains: ${error.message}`);
  }

  // 5. Test sending an email
  console.log('\n📤 Step 5: Testing Email Send');
  console.log('-'.repeat(50));
  console.log(`Sending test email to: ${TEST_EMAIL}`);
  console.log(`From: ${sendgridFromEmail}`);

  try {
    const msg = {
      to: TEST_EMAIL,
      from: {
        email: sendgridFromEmail,
        name: 'BlessBox Test',
      },
      replyTo: emailReplyTo || sendgridFromEmail,
      subject: 'BlessBox Email Test',
      text: `This is a test email from BlessBox.

If you received this email, the email system is working correctly!

From: ${sendgridFromEmail}
Time: ${new Date().toISOString()}

This is an automated test message.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1e293b;">✅ BlessBox Email Test</h2>
          <p>This is a test email from BlessBox.</p>
          <p>If you received this email, the email system is working correctly!</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="color: #64748b; font-size: 12px;">
            From: <strong>${sendgridFromEmail}</strong><br>
            Time: ${new Date().toISOString()}<br>
            This is an automated test message.
          </p>
        </div>
      `,
    };

    await sgMail.send(msg);
    console.log(`\n✅ Email sent successfully!`);
    console.log(`   Check ${TEST_EMAIL} inbox (and spam folder)`);
  } catch (error: any) {
    console.log(`\n❌ Failed to send email:`);
    console.log(`   Error: ${error.message}`);
    if (error.response?.body?.errors) {
      error.response.body.errors.forEach((err: any) => {
        console.log(`   - ${err.message}`);
      });
    }
  }

  // 6. Summary
  console.log('\n📊 Summary');
  console.log('='.repeat(50));
  console.log(`✅ API Key: Valid`);
  console.log(`📧 From Email: ${sendgridFromEmail}`);
  console.log(`📬 Test Email Sent To: ${TEST_EMAIL}`);
  console.log(`\n💡 Next Steps:`);
  console.log(`   1. Check ${TEST_EMAIL} inbox for the test email`);
  console.log(`   2. If email not received, check spam folder`);
  console.log(`   3. Verify ${sendgridFromEmail} in SendGrid dashboard if needed`);
  console.log(`   4. For support emails, use: contact@yolovibecodebootcamp.com`);
}

testEmailSystem().catch(console.error);

