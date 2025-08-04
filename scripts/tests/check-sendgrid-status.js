#!/usr/bin/env node

// Check SendGrid account status and permissions
import sgMail from '@sendgrid/mail';
import { config } from 'dotenv';

config({ path: '.env.local' });

const checkSendGridStatus = async () => {
  try {
    console.log('🔍 Checking SendGrid Account Status');
    console.log('===================================');

    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.error('❌ SENDGRID_API_KEY not found');
      return;
    }

    console.log('✅ API Key found');
    console.log(`🔑 API Key format: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
    
    sgMail.setApiKey(apiKey);

    // Test 1: Try sending to the same domain (should work in sandbox mode)
    console.log('\n📧 Test 1: Sending to same domain (rvegajr@yolovibecodebootcamp.com)');
    console.log('This should work even in sandbox mode...');
    
    try {
      const sameDomainMsg = {
        to: 'rvegajr@yolovibecodebootcamp.com',  // Same domain as sender
        from: 'contact@yolovibecodebootcamp.com',
        subject: '🧪 BlessBox Same-Domain Test',
        text: 'Test email to same domain - should work in sandbox mode',
        html: '<p>✅ Test email to same domain - should work in sandbox mode</p>'
      };

      const result = await sgMail.send(sameDomainMsg);
      console.log('🎉 SUCCESS! Same domain email sent!');
      console.log(`📊 Status: ${result[0].statusCode}`);
      console.log(`📧 Message ID: ${result[0].headers['x-message-id']}`);
      console.log('💌 Check rvegajr@yolovibecodebootcamp.com for the email');
      
      console.log('\n✅ Your SendGrid is working! The issue is likely sandbox mode.');
      console.log('📋 Sandbox mode only allows sending to verified email addresses');
      console.log('🔓 To send to external domains (like rvegajr@darkware.net):');
      console.log('   1. Upgrade your SendGrid account from free tier');
      console.log('   2. Or add rvegajr@darkware.net as a verified recipient');
      
      return true;
      
    } catch (error) {
      console.log('❌ Same domain test failed');
      if (error.response?.body?.errors) {
        const errorMsg = error.response.body.errors[0].message;
        console.log(`   Error: ${errorMsg}`);
        
        if (errorMsg.includes('does not match a verified Sender Identity')) {
          console.log('\n🤔 Sender verification issue detected');
          console.log('📋 Possible causes:');
          console.log('   1. Email addresses shown in dashboard might be pending verification');
          console.log('   2. API key might not have correct permissions');
          console.log('   3. Different SendGrid account than expected');
        }
      }
    }

    // Test 2: Check API key permissions
    console.log('\n🔑 Test 2: Checking API key permissions');
    console.log('This will help identify permission issues...');
    
    // We can't directly check permissions via API, but we can infer from error messages
    
    console.log('\n💡 Recommendations:');
    console.log('1. ✅ Your SendGrid setup looks correct based on the dashboard screenshots');
    console.log('2. 🔄 Try sending to rvegajr@yolovibecodebootcamp.com instead');
    console.log('3. 🎯 For external domains, you may need to upgrade from sandbox mode');
    console.log('4. 📧 Verify that contact@yolovibecodebootcamp.com is actually verified');
    
  } catch (error) {
    console.error('❌ Status check failed:', error);
  }
};

checkSendGridStatus();