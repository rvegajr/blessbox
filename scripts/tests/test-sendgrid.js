#!/usr/bin/env node

// Test SendGrid functionality
import sgMail from '@sendgrid/mail';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const testSendGrid = async () => {
  try {
    console.log('🧪 Testing SendGrid Configuration...');
    console.log('=====================================');

    // Check if API key exists
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.error('❌ SENDGRID_API_KEY not found in .env.local');
      console.log('\nPlease create .env.local with:');
      console.log('SENDGRID_API_KEY=your_api_key_here');
      console.log('SENDGRID_FROM_EMAIL=contact@yolovibecodebootcamp.com');
      console.log('SENDGRID_FROM_NAME=BlessBox Contact');
      return;
    }

    // Validate API key format
    if (!apiKey.startsWith('SG.')) {
      console.error('❌ Invalid SendGrid API key format. Should start with "SG."');
      return;
    }

    console.log('✅ API Key found and format looks correct');

    // Initialize SendGrid
    sgMail.setApiKey(apiKey);

    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'contact@yolovibecodebootcamp.com';
    const fromName = process.env.SENDGRID_FROM_NAME || 'BlessBox Contact';

    console.log(`📧 From: ${fromName} <${fromEmail}>`);
    console.log('📬 To: rvegajr@darkware.net');

    // Create test email
    const msg = {
      to: 'rvegajr@darkware.net',
      from: {
        email: fromEmail,
        name: fromName
      },
      subject: '🚀 BlessBox SendGrid Test - Success!',
      text: `
Hello from BlessBox!

This is a test email to verify that SendGrid is working correctly with your YOLOVibeCode setup.

✅ SendGrid API Key: Working
✅ Email Delivery: Successful
✅ From Address: ${fromEmail}
✅ Integration: Complete

If you're reading this, your SendGrid configuration is working perfectly!

---
BlessBox - A Proud YOLOVibeCode Project
DBA Noctusoft, Inc
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0d9488 0%, #1e40af 100%); padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🚀 BlessBox SendGrid Test</h1>
            <p style="color: #e0f2fe; margin: 10px 0 0 0;">Configuration Test Successful!</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 10px; border-left: 4px solid #0d9488;">
            <h2 style="color: #1e293b; margin-top: 0;">✅ Test Results</h2>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #0d9488;">SendGrid API Key:</strong>
              <span style="color: #16a34a; margin-left: 10px;">✅ Working</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #0d9488;">Email Delivery:</strong>
              <span style="color: #16a34a; margin-left: 10px;">✅ Successful</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #0d9488;">From Address:</strong>
              <span style="color: #475569; margin-left: 10px;">${fromEmail}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
              <strong style="color: #0d9488;">Integration:</strong>
              <span style="color: #16a34a; margin-left: 10px;">✅ Complete</span>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 10px; margin-top: 20px; border: 2px solid #0d9488;">
              <p style="margin: 0; color: #1e293b; font-weight: bold;">🎉 Congratulations!</p>
              <p style="margin: 10px 0 0 0; color: #475569;">
                Your SendGrid configuration is working perfectly! You can now receive contact form submissions and send emails through BlessBox.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding: 20px; background: #1e293b; border-radius: 10px;">
            <p style="color: #94a3b8; margin: 0; font-size: 14px;">
              BlessBox - A Proud YOLOVibeCode Project<br>
              <span style="color: #64748b;">DBA Noctusoft, Inc</span>
            </p>
          </div>
        </div>
      `
    };

    console.log('\n📤 Sending test email...');
    const result = await sgMail.send(msg);
    
    console.log('✅ Email sent successfully!');
    console.log(`📊 Status Code: ${result[0].statusCode}`);
    console.log(`📧 Message ID: ${result[0].headers['x-message-id']}`);
    console.log('\n🎉 SendGrid is working perfectly!');
    console.log('💌 Check rvegajr@darkware.net for the test email');

  } catch (error) {
    console.error('❌ SendGrid test failed:', error);
    
    if (error.response) {
      console.error('📋 Error details:');
      console.error('Status:', error.response.status);
      console.error('Body:', JSON.stringify(error.response.body, null, 2));
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Verify your SENDGRID_API_KEY in .env.local');
    console.log('2. Ensure contact@yolovibecodebootcamp.com is verified in SendGrid');
    console.log('3. Check your SendGrid account status');
    console.log('4. Verify API key permissions include "Mail Send"');
  }
};

// Run the test
testSendGrid();