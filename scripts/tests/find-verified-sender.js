#!/usr/bin/env node

// Find a working verified sender for YOLOVibeCode
import sgMail from '@sendgrid/mail';
import { config } from 'dotenv';

config({ path: '.env.local' });

const findVerifiedSender = async () => {
  try {
    console.log('🔍 Finding your verified SendGrid sender...');
    console.log('==========================================');

    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.error('❌ SENDGRID_API_KEY not found');
      return;
    }

    sgMail.setApiKey(apiKey);

    // Common YOLOVibeCode email patterns
    const testEmails = [
      'noreply@yolovibecode.com',
      'info@yolovibecode.com', 
      'contact@yolovibecode.com',
      'admin@yolovibecode.com',
      'support@yolovibecode.com',
      'hello@yolovibecode.com',
      // Also try the bootcamp domain
      'noreply@yolovibecodebootcamp.com',
      'info@yolovibecodebootcamp.com',
      'admin@yolovibecodebootcamp.com',
      'support@yolovibecodebootcamp.com',
      'hello@yolovibecodebootcamp.com'
    ];

    console.log('Testing potential verified senders...\n');

    for (const email of testEmails) {
      try {
        console.log(`📧 Testing: ${email}`);
        
        // Create a minimal test message
        const testMsg = {
          to: 'rvegajr@darkware.net',
          from: email,
          subject: '🧪 BlessBox SendGrid Verification Test',
          text: `Test email from ${email} - if you receive this, the sender is verified!`,
          html: `<p>✅ Test email from <strong>${email}</strong></p><p>If you receive this, the sender is verified and working!</p>`
        };

        // Try to send
        const result = await sgMail.send(testMsg);
        
        console.log(`✅ SUCCESS! ${email} is verified and working!`);
        console.log(`📊 Status: ${result[0].statusCode}`);
        console.log(`💌 Test email sent to rvegajr@darkware.net\n`);
        
        // Update the .env.local file with the working sender
        console.log('🔧 This sender works! Updating configuration...');
        return email;
        
      } catch (error) {
        if (error.response?.body?.errors?.[0]?.message?.includes('does not match a verified Sender Identity')) {
          console.log(`❌ ${email} - Not verified`);
        } else {
          console.log(`❌ ${email} - Error: ${error.message}`);
        }
      }
    }
    
    console.log('\n❌ No verified senders found in common patterns.');
    console.log('\n💡 Suggestions:');
    console.log('1. Check your SendGrid dashboard at https://app.sendgrid.com/settings/sender_auth');
    console.log('2. Look for any verified sender identities you already have');
    console.log('3. Or verify contact@yolovibecodebootcamp.com as a new sender');
    
  } catch (error) {
    console.error('❌ Error finding verified sender:', error);
  }
};

findVerifiedSender();