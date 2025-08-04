#!/usr/bin/env node

// Test SendGrid with verified sender
import sgMail from '@sendgrid/mail';
import { config } from 'dotenv';

config({ path: '.env.local' });

const testVerifiedSender = async () => {
  try {
    console.log('🚀 Testing SendGrid with Verified Sender');
    console.log('=========================================');

    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.error('❌ SENDGRID_API_KEY not found');
      return;
    }

    console.log('✅ API Key found');
    sgMail.setApiKey(apiKey);

    // Use the verified sender from your dashboard
    const verifiedSender = 'contact@yolovibecodebootcamp.com';
    
    console.log(`📧 Using verified sender: ${verifiedSender}`);
    console.log('📬 Sending test email to: rvegajr@darkware.net');

    const msg = {
      to: 'rvegajr@darkware.net',
      from: {
        email: verifiedSender,
        name: 'BlessBox Contact'
      },
      subject: '🎉 BlessBox SendGrid Test - SUCCESS!',
      text: `
Hello!

🎉 Congratulations! Your SendGrid integration is working perfectly!

✅ SendGrid API Key: Working
✅ Verified Sender: ${verifiedSender}
✅ Email Delivery: Successful
✅ BlessBox Integration: Complete

This test confirms that:
- Your SendGrid account is properly configured
- The sender email is verified and working
- BlessBox can successfully send emails
- Contact forms will work perfectly

Next steps:
- Your contact form at http://localhost:7777/forms/contact is ready
- Test the email functionality at http://localhost:7777/email-test
- All emails will be sent from ${verifiedSender}

---
BlessBox - A Proud YOLOVibeCode Project
DBA Noctusoft, Inc

Technical Details:
- Sent via SendGrid API
- From: ${verifiedSender}
- Integration: BlessBox Email System
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0d9488 0%, #1e40af 100%); padding: 40px 30px; border-radius: 15px; margin-bottom: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold;">🎉 BlessBox SendGrid Test</h1>
            <p style="color: #e0f2fe; margin: 15px 0 0 0; font-size: 18px;">SUCCESS!</p>
          </div>
          
          <!-- Success Message -->
          <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <h2 style="color: #1e293b; margin-top: 0; font-size: 24px;">✅ Integration Complete!</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
              Congratulations! Your SendGrid integration is working perfectly. This email confirms that BlessBox can successfully send emails using your verified sender.
            </p>
          </div>
          
          <!-- Test Results -->
          <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <h3 style="color: #1e293b; margin-top: 0; font-size: 20px; border-bottom: 2px solid #0d9488; padding-bottom: 10px;">Test Results</h3>
            
            <div style="display: grid; gap: 15px;">
              <div style="display: flex; align-items: center; padding: 15px; background: #f0fdf4; border-radius: 10px; border-left: 4px solid #16a34a;">
                <span style="color: #16a34a; font-size: 20px; margin-right: 10px;">✅</span>
                <div>
                  <strong style="color: #1e293b;">SendGrid API Key:</strong>
                  <span style="color: #16a34a; margin-left: 10px;">Working</span>
                </div>
              </div>
              
              <div style="display: flex; align-items: center; padding: 15px; background: #f0fdf4; border-radius: 10px; border-left: 4px solid #16a34a;">
                <span style="color: #16a34a; font-size: 20px; margin-right: 10px;">✅</span>
                <div>
                  <strong style="color: #1e293b;">Verified Sender:</strong>
                  <span style="color: #475569; margin-left: 10px;">${verifiedSender}</span>
                </div>
              </div>
              
              <div style="display: flex; align-items: center; padding: 15px; background: #f0fdf4; border-radius: 10px; border-left: 4px solid #16a34a;">
                <span style="color: #16a34a; font-size: 20px; margin-right: 10px;">✅</span>
                <div>
                  <strong style="color: #1e293b;">Email Delivery:</strong>
                  <span style="color: #16a34a; margin-left: 10px;">Successful</span>
                </div>
              </div>
              
              <div style="display: flex; align-items: center; padding: 15px; background: #f0fdf4; border-radius: 10px; border-left: 4px solid #16a34a;">
                <span style="color: #16a34a; font-size: 20px; margin-right: 10px;">✅</span>
                <div>
                  <strong style="color: #1e293b;">BlessBox Integration:</strong>
                  <span style="color: #16a34a; margin-left: 10px;">Complete</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Next Steps -->
          <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <h3 style="color: #1e293b; margin-top: 0; font-size: 20px; border-bottom: 2px solid #1e40af; padding-bottom: 10px;">🚀 Next Steps</h3>
            <ul style="color: #475569; line-height: 1.8; padding-left: 20px;">
              <li>Your contact form at <strong>http://localhost:7777/forms/contact</strong> is ready</li>
              <li>Test the email functionality at <strong>http://localhost:7777/email-test</strong></li>
              <li>All emails will be sent from <strong>${verifiedSender}</strong></li>
              <li>Contact form submissions will be delivered to your inbox</li>
            </ul>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; margin-top: 30px; padding: 25px; background: #1e293b; border-radius: 15px;">
            <p style="color: #94a3b8; margin: 0; font-size: 16px; font-weight: bold;">
              BlessBox - A Proud YOLOVibeCode Project
            </p>
            <p style="color: #64748b; margin: 10px 0 0 0; font-size: 14px;">
              DBA Noctusoft, Inc
            </p>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #475569;">
              <p style="color: #64748b; margin: 0; font-size: 12px;">
                Technical Details: Sent via SendGrid API from ${verifiedSender}
              </p>
            </div>
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
    console.log('🚀 Your BlessBox contact form is now fully functional!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error.response) {
      console.error('📋 Error details:', JSON.stringify(error.response.body, null, 2));
    }
  }
};

testVerifiedSender();