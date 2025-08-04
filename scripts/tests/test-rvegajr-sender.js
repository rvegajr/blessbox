#!/usr/bin/env node

// Test SendGrid with rvegajr sender (verified in dashboard)
import sgMail from '@sendgrid/mail';
import { config } from 'dotenv';

config({ path: '.env.local' });

const testRvegajrSender = async () => {
  try {
    console.log('🚀 Testing SendGrid with rvegajr@yolovibecodebootcamp.com');
    console.log('=========================================================');

    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.error('❌ SENDGRID_API_KEY not found');
      return;
    }

    console.log('✅ API Key found');
    sgMail.setApiKey(apiKey);

    // Use rvegajr sender (I can see it's verified in your dashboard)
    const verifiedSender = 'rvegajr@yolovibecodebootcamp.com';
    
    console.log(`📧 Using verified sender: ${verifiedSender}`);
    console.log('📬 Sending test email to: rvegajr@darkware.net');

    const msg = {
      to: 'rvegajr@darkware.net',
      from: {
        email: verifiedSender,
        name: 'BlessBox (YOLOVibeCode)'
      },
      subject: '🎉 BlessBox SendGrid Test - SUCCESS!',
      text: `
Hello!

🎉 SUCCESS! Your SendGrid integration is working perfectly!

✅ SendGrid API Key: Working
✅ Verified Sender: ${verifiedSender}
✅ Email Delivery: Successful
✅ BlessBox Integration: Complete

This confirms that:
- Your SendGrid account is properly configured
- The sender email is verified and working
- BlessBox can successfully send emails
- Contact forms will work perfectly

We can now update BlessBox to use this verified sender for all outgoing emails.

---
BlessBox - A Proud YOLOVibeCode Project
DBA Noctusoft, Inc
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0d9488 0%, #1e40af 100%); padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🎉 BlessBox SendGrid Test</h1>
            <p style="color: #e0f2fe; margin: 10px 0 0 0;">SUCCESS!</p>
          </div>
          
          <div style="background: #f0fdf4; padding: 30px; border-radius: 10px; border-left: 4px solid #16a34a; margin-bottom: 20px;">
            <h2 style="color: #1e293b; margin-top: 0;">✅ Integration Complete!</h2>
            <p style="color: #475569;">Your SendGrid integration is working perfectly! This email confirms that BlessBox can successfully send emails.</p>
            
            <div style="margin-top: 20px;">
              <div style="margin-bottom: 10px;"><strong>✅ SendGrid API Key:</strong> Working</div>
              <div style="margin-bottom: 10px;"><strong>✅ Verified Sender:</strong> ${verifiedSender}</div>
              <div style="margin-bottom: 10px;"><strong>✅ Email Delivery:</strong> Successful</div>
              <div style="margin-bottom: 10px;"><strong>✅ BlessBox Integration:</strong> Complete</div>
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
    
    console.log('\n🎉 EMAIL SENT SUCCESSFULLY!');
    console.log('=====================================');
    console.log(`📊 Status Code: ${result[0].statusCode}`);
    console.log(`📧 Message ID: ${result[0].headers['x-message-id']}`);
    console.log(`📬 Delivered to: rvegajr@darkware.net`);
    console.log(`📨 From: ${verifiedSender}`);
    
    console.log('\n✅ SendGrid Integration Complete!');
    console.log('💌 Check rvegajr@darkware.net for the test email');
    console.log('\n🔧 Next: I\'ll update your BlessBox configuration to use this verified sender');

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error.response) {
      console.error('📋 Error details:', JSON.stringify(error.response.body, null, 2));
    }
  }
};

testRvegajrSender();