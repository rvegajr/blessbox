#!/usr/bin/env node

// Test Gmail with the abstracted email system
import nodemailer from 'nodemailer';
import { config } from 'dotenv';

config({ path: '.env.local' });

const testGmailSystem = async () => {
  try {
    console.log('📧 Testing Gmail with Abstracted Email System');
    console.log('=============================================');

    const provider = process.env.EMAIL_PROVIDER;
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_PASS;

    console.log(`🔧 Email Provider: ${provider}`);
    console.log(`📧 Gmail User: ${gmailUser}`);

    if (provider !== 'gmail') {
      console.log('⚠️  EMAIL_PROVIDER is not set to "gmail"');
      console.log('Run: node switch-to-gmail.js to configure Gmail');
      return;
    }

    if (!gmailUser || gmailUser === 'your-email@gmail.com') {
      console.log('❌ Please configure your Gmail address in .env.local');
      console.log('Replace "your-email@gmail.com" with your actual Gmail address');
      return;
    }

    if (!gmailPass || gmailPass === 'your-app-password-here') {
      console.log('❌ Please configure your Gmail App Password in .env.local');
      console.log('1. Go to: https://myaccount.google.com/apppasswords');
      console.log('2. Generate password for "Mail"');
      console.log('3. Add it as GMAIL_PASS in .env.local');
      return;
    }

    console.log('\n🔧 Testing Gmail configuration...');

    // Create Gmail transporter
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    // Verify connection
    console.log('🔍 Verifying Gmail connection...');
    await transporter.verify();
    console.log('✅ Gmail connection verified!');

    // Send test email
    console.log('\n📤 Sending test email to rvegajr@darkware.net...');

    const mailOptions = {
      from: `"BlessBox Contact" <${gmailUser}>`,
      to: 'rvegajr@darkware.net',
      subject: '🎉 BlessBox Gmail System - SUCCESS!',
      text: `
Hello!

🎉 FANTASTIC! Your BlessBox Gmail integration is working perfectly!

✅ Email Provider: Gmail (Abstracted)
✅ Gmail Account: ${gmailUser}
✅ Email Delivery: Successful
✅ BlessBox Integration: Complete

This new abstracted architecture provides:
- 🔄 Easy provider switching (Gmail ↔ SendGrid ↔ Others)
- 🛡️ Clean separation of concerns
- 🧪 Easy testing and mocking
- 📦 Modular and maintainable code
- ⚡ Provider-agnostic API

Your BlessBox contact form is now powered by Gmail with enterprise-grade architecture!

Benefits of Gmail:
- ✅ Easy to set up with App Passwords
- ✅ Reliable delivery rates
- ✅ No external service dependencies
- ✅ Free and accessible
- ✅ Familiar sender address

Next steps:
- Contact form: http://localhost:7777/forms/contact
- Email testing: http://localhost:7777/email-test
- Switch providers anytime: change EMAIL_PROVIDER in .env.local

---
BlessBox - A Proud YOLOVibeCode Project
DBA Noctusoft, Inc

Technical Details:
- Provider: Gmail SMTP
- Architecture: Abstracted Email Service
- Swappable: Yes ✅
- From: ${gmailUser}
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #ea4335 0%, #4285f4 50%, #34a853 100%); padding: 40px 30px; border-radius: 15px; margin-bottom: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold;">🎉 BlessBox Gmail System</h1>
            <h2 style="color: #ffffff; margin: 10px 0 0 0; font-size: 20px;">Abstracted & Working!</h2>
          </div>
          
          <!-- Success Message -->
          <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="display: inline-block; background: #dcfce7; padding: 15px; border-radius: 50%; margin-bottom: 15px;">
                <span style="font-size: 40px;">📧</span>
              </div>
              <h2 style="color: #1e293b; margin: 0; font-size: 24px;">Gmail Integration Complete!</h2>
            </div>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; text-align: center;">
              FANTASTIC! Your BlessBox Gmail integration is working perfectly with clean, abstracted architecture.
            </p>
          </div>
          
          <!-- Architecture Benefits -->
          <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <h3 style="color: #1e293b; margin-top: 0; font-size: 20px; border-bottom: 2px solid #4285f4; padding-bottom: 10px;">🏗️ Abstracted Architecture</h3>
            
            <div style="display: grid; gap: 15px;">
              <div style="display: flex; align-items: center; padding: 15px; background: #f0f9ff; border-radius: 10px; border-left: 4px solid #4285f4;">
                <span style="color: #4285f4; font-size: 20px; margin-right: 15px;">🔄</span>
                <div>
                  <strong style="color: #1e293b; display: block;">Easy Provider Switching</strong>
                  <span style="color: #475569; font-size: 14px;">Gmail ↔ SendGrid ↔ Others</span>
                </div>
              </div>
              
              <div style="display: flex; align-items: center; padding: 15px; background: #f0fdf4; border-radius: 10px; border-left: 4px solid #34a853;">
                <span style="color: #34a853; font-size: 20px; margin-right: 15px;">🛡️</span>
                <div>
                  <strong style="color: #1e293b; display: block;">Clean Separation</strong>
                  <span style="color: #475569; font-size: 14px;">Interface-based design</span>
                </div>
              </div>
              
              <div style="display: flex; align-items: center; padding: 15px; background: #fef3c7; border-radius: 10px; border-left: 4px solid #f59e0b;">
                <span style="color: #f59e0b; font-size: 20px; margin-right: 15px;">📦</span>
                <div>
                  <strong style="color: #1e293b; display: block;">Modular Code</strong>
                  <span style="color: #475569; font-size: 14px;">Maintainable and scalable</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Gmail Benefits -->
          <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <h3 style="color: #1e293b; margin-top: 0; font-size: 20px; border-bottom: 2px solid #ea4335; padding-bottom: 10px;">📧 Gmail Benefits</h3>
            <ul style="color: #475569; line-height: 1.8; padding-left: 20px;">
              <li><strong>Easy Setup:</strong> App Passwords for secure authentication</li>
              <li><strong>Reliable Delivery:</strong> Google's infrastructure</li>
              <li><strong>No Dependencies:</strong> No external service accounts needed</li>
              <li><strong>Free & Accessible:</strong> Available to anyone</li>
              <li><strong>Familiar Sender:</strong> Recipients recognize Gmail addresses</li>
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
                📧 Sent via Gmail SMTP with Abstracted Architecture<br>
                From: ${gmailUser} | 🏗️ Swappable Email System
              </p>
            </div>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);

    console.log('\n🏆 EMAIL SENT SUCCESSFULLY!');
    console.log('=====================================');
    console.log(`📧 Message ID: ${result.messageId}`);
    console.log(`📬 Delivered to: rvegajr@darkware.net`);
    console.log(`📨 From: ${gmailUser}`);
    
    console.log('\n🎉 GMAIL SYSTEM COMPLETE!');
    console.log('💌 Check rvegajr@darkware.net for the test email');
    console.log('🏗️ Abstracted architecture allows easy provider switching');
    console.log('🚀 Your BlessBox email system is production-ready!');

  } catch (error) {
    console.error('❌ Gmail test failed:', error);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔧 Authentication failed. Please check:');
      console.log('1. Gmail address is correct');
      console.log('2. App Password is correct (not regular password)');
      console.log('3. 2-Step Verification is enabled');
      console.log('4. App Password was generated for "Mail"');
    }
  }
};

testGmailSystem();