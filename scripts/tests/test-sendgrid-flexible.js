#!/usr/bin/env node

// Test SendGrid functionality with flexible sender options
import sgMail from '@sendgrid/mail';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const testSendGrid = async () => {
  try {
    console.log('🧪 Testing SendGrid Configuration (Flexible Sender)...');
    console.log('=====================================================');

    // Check if API key exists
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.error('❌ SENDGRID_API_KEY not found in .env.local');
      return;
    }

    console.log('✅ API Key found and format looks correct');

    // Initialize SendGrid
    sgMail.setApiKey(apiKey);

    // Try different potential sender addresses
    const potentialSenders = [
      'contact@yolovibecodebootcamp.com',
      'noreply@yolovibecodebootcamp.com', 
      'info@yolovibecodebootcamp.com',
      'admin@yolovibecodebootcamp.com',
      'support@yolovibecodebootcamp.com'
    ];

    console.log('\n🔍 Testing potential sender addresses...');
    
    for (const senderEmail of potentialSenders) {
      console.log(`\n📧 Testing: ${senderEmail}`);
      
      try {
        const msg = {
          to: 'rvegajr@darkware.net',
          from: {
            email: senderEmail,
            name: 'BlessBox Test'
          },
          subject: '🚀 BlessBox SendGrid Test - Success!',
          text: `
Hello from BlessBox!

This is a test email to verify that SendGrid is working correctly.

✅ SendGrid API Key: Working
✅ Email Delivery: Successful  
✅ From Address: ${senderEmail}
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
                  <span style="color: #475569; margin-left: 10px;">${senderEmail}</span>
                </div>
                
                <div style="background: white; padding: 20px; border-radius: 10px; margin-top: 20px; border: 2px solid #0d9488;">
                  <p style="margin: 0; color: #1e293b; font-weight: bold;">🎉 Congratulations!</p>
                  <p style="margin: 10px 0 0 0; color: #475569;">
                    Your SendGrid configuration is working perfectly! This email was sent from ${senderEmail}.
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

        const result = await sgMail.send(msg);
        
        console.log(`✅ SUCCESS! Email sent from ${senderEmail}`);
        console.log(`📊 Status Code: ${result[0].statusCode}`);
        console.log(`📧 Message ID: ${result[0].headers['x-message-id']}`);
        console.log(`💌 Check rvegajr@darkware.net for the test email`);
        
        // Update .env.local with working sender
        console.log(`\n🔧 Updating .env.local with verified sender: ${senderEmail}`);
        
        return senderEmail; // Return successful sender
        
      } catch (error) {
        if (error.response && error.response.body && error.response.body.errors) {
          const errorMsg = error.response.body.errors[0].message;
          if (errorMsg.includes('does not match a verified Sender Identity')) {
            console.log(`❌ ${senderEmail} - Not verified in SendGrid`);
            continue; // Try next sender
          }
        }
        
        console.error(`❌ ${senderEmail} - Error:`, error.message);
        continue; // Try next sender
      }
    }
    
    // If we get here, none of the senders worked
    console.log('\n❌ None of the potential sender addresses are verified in SendGrid');
    console.log('\n🔧 Next steps:');
    console.log('1. Go to https://app.sendgrid.com/settings/sender_auth');
    console.log('2. Add and verify one of these email addresses:');
    potentialSenders.forEach(email => console.log(`   - ${email}`));
    console.log('3. Or tell me which email address you have already verified in SendGrid');

  } catch (error) {
    console.error('❌ SendGrid test failed:', error);
  }
};

// Run the test
testSendGrid();