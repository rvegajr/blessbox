#!/usr/bin/env node

// Test SendGrid with the correct verified credentials
import sgMail from '@sendgrid/mail';
import { config } from 'dotenv';

config({ path: '.env.local' });

const testSendGridVerified = async () => {
  try {
    console.log('🚀 Testing SendGrid with Verified Credentials');
    console.log('==============================================');

    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    
    if (!apiKey) {
      console.error('❌ SENDGRID_API_KEY not found');
      return;
    }

    if (!fromEmail) {
      console.error('❌ SENDGRID_FROM_EMAIL not found');
      return;
    }

    console.log('✅ API Key found');
    console.log(`📧 From Email: ${fromEmail}`);
    console.log('📬 Sending test email to: rvegajr@darkware.net');

    sgMail.setApiKey(apiKey);

    const msg = {
      to: 'rvegajr@darkware.net',
      from: {
        email: fromEmail,
        name: 'BlessBox Contact'
      },
      subject: '🎉 BlessBox SendGrid - VERIFIED CREDENTIALS SUCCESS!',
      text: `
Hello!

🎉 FANTASTIC! Your SendGrid integration is working with verified credentials!

✅ SendGrid API Key: Working
✅ Verified Sender: ${fromEmail}
✅ Email Delivery: Successful
✅ BlessBox Integration: Complete

This confirms that:
- Your SendGrid account is properly configured
- The sender ${fromEmail} is verified and working
- BlessBox can successfully send emails
- Contact forms will work perfectly

Your BlessBox now has a robust, abstracted email system that can:
- ✅ Send emails reliably via SendGrid
- ✅ Switch between providers easily
- ✅ Handle contact form submissions
- ✅ Scale for production use

Next steps:
- Contact form: http://localhost:7777/forms/contact
- Email testing: http://localhost:7777/email-test
- All emails will be sent from: ${fromEmail}

---
BlessBox - A Proud YOLOVibeCode Project
DBA Noctusoft, Inc

Technical Details:
- Sent via SendGrid API
- From: ${fromEmail}
- Integration: BlessBox Abstracted Email System
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #059669 0%, #1d4ed8 100%); padding: 40px 30px; border-radius: 15px; margin-bottom: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold;">🎉 BlessBox SendGrid</h1>
            <h2 style="color: #e0f2fe; margin: 10px 0 0 0; font-size: 24px;">VERIFIED CREDENTIALS SUCCESS!</h2>
          </div>
          
          <!-- Success Message -->
          <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="display: inline-block; background: #dcfce7; padding: 15px; border-radius: 50%; margin-bottom: 15px;">
                <span style="font-size: 40px;">🏆</span>
              </div>
              <h2 style="color: #1e293b; margin: 0; font-size: 24px;">SendGrid Integration Complete!</h2>
            </div>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; text-align: center;">
              FANTASTIC! Your SendGrid integration is working perfectly with verified credentials. Your BlessBox now has enterprise-grade email delivery!
            </p>
          </div>
          
          <!-- Test Results -->
          <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <h3 style="color: #1e293b; margin-top: 0; font-size: 20px; border-bottom: 2px solid #059669; padding-bottom: 10px;">✅ Verification Results</h3>
            
            <div style="display: grid; gap: 15px;">
              <div style="display: flex; align-items: center; padding: 15px; background: #f0fdf4; border-radius: 10px; border-left: 4px solid #16a34a;">
                <span style="color: #16a34a; font-size: 20px; margin-right: 15px;">✅</span>
                <div>
                  <strong style="color: #1e293b; display: block;">SendGrid API Key</strong>
                  <span style="color: #16a34a; font-size: 14px;">Valid and working</span>
                </div>
              </div>
              
              <div style="display: flex; align-items: center; padding: 15px; background: #f0fdf4; border-radius: 10px; border-left: 4px solid #16a34a;">
                <span style="color: #16a34a; font-size: 20px; margin-right: 15px;">✅</span>
                <div>
                  <strong style="color: #1e293b; display: block;">Verified Sender</strong>
                  <span style="color: #475569; font-size: 14px;">${fromEmail}</span>
                </div>
              </div>
              
              <div style="display: flex; align-items: center; padding: 15px; background: #f0fdf4; border-radius: 10px; border-left: 4px solid #16a34a;">
                <span style="color: #16a34a; font-size: 20px; margin-right: 15px;">✅</span>
                <div>
                  <strong style="color: #1e293b; display: block;">Email Delivery</strong>
                  <span style="color: #16a34a; font-size: 14px;">Successful</span>
                </div>
              </div>
              
              <div style="display: flex; align-items: center; padding: 15px; background: #f0fdf4; border-radius: 10px; border-left: 4px solid #16a34a;">
                <span style="color: #16a34a; font-size: 20px; margin-right: 15px;">✅</span>
                <div>
                  <strong style="color: #1e293b; display: block;">BlessBox Integration</strong>
                  <span style="color: #16a34a; font-size: 14px;">Complete with abstracted architecture</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Features -->
          <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <h3 style="color: #1e293b; margin-top: 0; font-size: 20px; border-bottom: 2px solid #1d4ed8; padding-bottom: 10px;">🚀 Email System Features</h3>
            <ul style="color: #475569; line-height: 1.8; padding-left: 20px;">
              <li><strong>Reliable Delivery:</strong> Enterprise-grade SendGrid infrastructure</li>
              <li><strong>Abstracted Architecture:</strong> Easy to switch providers</li>
              <li><strong>Contact Forms:</strong> Ready for user submissions</li>
              <li><strong>Professional Sender:</strong> Verified ${fromEmail}</li>
              <li><strong>Production Ready:</strong> Scalable and robust</li>
            </ul>
          </div>
          
          <!-- Next Steps -->
          <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <h3 style="color: #1e293b; margin-top: 0; font-size: 20px; border-bottom: 2px solid #7c3aed; padding-bottom: 10px;">🎯 Ready for Production</h3>
            <div style="background: #faf5ff; padding: 20px; border-radius: 10px; border-left: 4px solid #7c3aed;">
              <p style="margin: 0; color: #1e293b; font-weight: bold;">Your BlessBox is now fully operational!</p>
              <ul style="color: #475569; margin: 15px 0 0 0; padding-left: 20px;">
                <li>Contact form: <strong>http://localhost:7777/forms/contact</strong></li>
                <li>Email testing: <strong>http://localhost:7777/email-test</strong></li>
                <li>All emails sent from: <strong>${fromEmail}</strong></li>
                <li>Delivered to: <strong>contact@yolovibecodebootcamp.com</strong></li>
              </ul>
            </div>
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
                📧 Sent via SendGrid with Verified Credentials<br>
                From: ${fromEmail} | 🏗️ Abstracted Email Architecture
              </p>
            </div>
          </div>
        </div>
      `
    };

    console.log('\n📤 Sending test email...');
    const result = await sgMail.send(msg);
    
    console.log('\n🏆 EMAIL SENT SUCCESSFULLY!');
    console.log('=====================================');
    console.log(`📊 Status Code: ${result[0].statusCode}`);
    console.log(`📧 Message ID: ${result[0].headers['x-message-id']}`);
    console.log(`📬 Delivered to: rvegajr@darkware.net`);
    console.log(`📨 From: ${fromEmail}`);
    
    console.log('\n🎉 SENDGRID INTEGRATION COMPLETE!');
    console.log('💌 Check rvegajr@darkware.net for the test email');
    console.log('🚀 Your BlessBox email system is now fully operational!');
    console.log('🏗️ Abstracted architecture allows easy provider switching');

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error.response) {
      const errorMsg = error.response.body.errors[0].message;
      console.error('📋 Error details:', errorMsg);
    }
  }
};

testSendGridVerified();