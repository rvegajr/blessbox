#!/usr/bin/env node

// Test SendGrid with exact verified sender from dashboard
import sgMail from '@sendgrid/mail';
import { config } from 'dotenv';

config({ path: '.env.local' });

const testExactVerified = async () => {
  try {
    console.log('🔍 Testing exact verified sender from dashboard');
    console.log('===============================================');

    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.error('❌ SENDGRID_API_KEY not found');
      return;
    }

    console.log('✅ API Key found');
    sgMail.setApiKey(apiKey);

    // Test the exact verified senders from your dashboard
    const verifiedSenders = [
      'contact@yolovibecodebootcamp.com',  // From Single Sender Verification
      'rvegajr@yolovibecodebootcamp.com'   // Also from Single Sender Verification
    ];

    for (const sender of verifiedSenders) {
      try {
        console.log(`\n📧 Testing: ${sender}`);
        
        const msg = {
          to: 'rvegajr@darkware.net',
          from: sender,  // Simple string format
          subject: `🧪 BlessBox Test from ${sender}`,
          text: `Test email from ${sender} - SUCCESS!`,
          html: `<p>✅ Test email from <strong>${sender}</strong> - SUCCESS!</p>`
        };

        console.log('📤 Sending...');
        const result = await sgMail.send(msg);
        
        console.log(`🎉 SUCCESS! ${sender} works!`);
        console.log(`📊 Status: ${result[0].statusCode}`);
        console.log(`📧 Message ID: ${result[0].headers['x-message-id']}`);
        
        // Update configuration with working sender
        console.log(`\n🔧 Found working sender: ${sender}`);
        console.log('💌 Check rvegajr@darkware.net for the test email');
        
        return sender; // Return the working sender
        
      } catch (error) {
        if (error.response?.body?.errors?.[0]?.message?.includes('does not match a verified Sender Identity')) {
          console.log(`❌ ${sender} - Not verified (despite dashboard showing it)`);
        } else if (error.response?.body?.errors?.[0]?.message?.includes('sandbox')) {
          console.log(`⚠️  ${sender} - SendGrid account in sandbox mode`);
          console.log('   You may need to upgrade your SendGrid account to send to external emails');
        } else {
          console.log(`❌ ${sender} - Error: ${error.message}`);
          if (error.response?.body) {
            console.log(`   Details: ${JSON.stringify(error.response.body, null, 2)}`);
          }
        }
      }
    }
    
    console.log('\n🤔 Neither verified sender worked. Possible issues:');
    console.log('1. SendGrid account might be in sandbox mode');
    console.log('2. API key might not have full permissions');
    console.log('3. Sender verification might be pending');
    console.log('\n💡 Let me check your SendGrid account status...');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

testExactVerified();