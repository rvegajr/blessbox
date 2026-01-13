#!/usr/bin/env tsx
/**
 * Test Email Forwarding for support@blessbox.org
 * 
 * Sends a test email to verify forwarding works
 */

import { config } from 'dotenv';
import sgMail from '@sendgrid/mail';

// Load environment variables
config({ path: '.env.local' });
config({ path: '.env.production.local' });

const TEST_TO = 'support@blessbox.org';
const EXPECTED_FORWARD_TO = 'rvegajr@yolovibecodebootcamp.com';

async function testEmailForwarding() {
  console.log('📧 Testing Email Forwarding\n');
  console.log('='.repeat(50));

  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  const sendgridFromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@blessbox.org';

  if (!sendgridApiKey) {
    console.log('❌ SENDGRID_API_KEY not found');
    return;
  }

  console.log(`\n📋 Configuration:`);
  console.log(`   FROM: ${sendgridFromEmail}`);
  console.log(`   TO: ${TEST_TO}`);
  console.log(`   Expected Forward To: ${EXPECTED_FORWARD_TO}`);

  sgMail.setApiKey(sendgridApiKey);

  const testMessage = {
    to: TEST_TO,
    from: {
      email: sendgridFromEmail,
      name: 'BlessBox Test',
    },
    replyTo: 'rvegajr@yolovibecodebootcamp.com',
    subject: '🧪 BlessBox Email Forwarding Test',
    text: `This is a test email to verify email forwarding.

If you received this email at ${EXPECTED_FORWARD_TO}, the forwarding is working correctly!

Test Details:
- Sent To: ${TEST_TO}
- Forwarded To: ${EXPECTED_FORWARD_TO}
- Time: ${new Date().toISOString()}
- From: ${sendgridFromEmail}

This is an automated test message.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #1e293b; margin-top: 0;">🧪 Email Forwarding Test</h2>
          
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            This is a test email to verify email forwarding is working correctly.
          </p>
          
          <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #166534; font-weight: bold;">
              ✅ If you received this at ${EXPECTED_FORWARD_TO}, forwarding is working!
            </p>
          </div>
          
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e293b; margin-top: 0; font-size: 14px; text-transform: uppercase;">Test Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 40%;">Sent To:</td>
                <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: bold;">${TEST_TO}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Forwarded To:</td>
                <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: bold;">${EXPECTED_FORWARD_TO}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">From:</td>
                <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${sendgridFromEmail}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Time:</td>
                <td style="padding: 8px 0; color: #1e293b; font-size: 14px;">${new Date().toLocaleString()}</td>
              </tr>
            </table>
          </div>
          
          <p style="color: #64748b; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            This is an automated test message from BlessBox email forwarding verification.
          </p>
        </div>
      </div>
    `,
  };

  try {
    console.log(`\n📤 Sending test email to ${TEST_TO}...`);
    await sgMail.send(testMessage);
    
    console.log(`\n✅ Email sent successfully!`);
    console.log(`\n📬 Next Steps:`);
    console.log(`   1. Check ${EXPECTED_FORWARD_TO} inbox`);
    console.log(`   2. Check spam folder if not in inbox`);
    console.log(`   3. Look for subject: "🧪 BlessBox Email Forwarding Test"`);
    console.log(`\n⏱️  Email forwarding usually happens within seconds, but can take up to a few minutes.`);
    
  } catch (error: any) {
    console.log(`\n❌ Failed to send email:`);
    console.log(`   Error: ${error.message}`);
    if (error.response?.body?.errors) {
      error.response.body.errors.forEach((err: any) => {
        console.log(`   - ${err.message}`);
        if (err.field) {
          console.log(`     Field: ${err.field}`);
        }
      });
    }
  }
}

testEmailForwarding().catch(console.error);

