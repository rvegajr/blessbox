#!/usr/bin/env node

// Test the new abstracted email system
import { EmailService } from './src/services/EmailService.js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const testEmailSystem = async () => {
  try {
    console.log('🚀 Testing Abstracted Email System');
    console.log('==================================');

    // Create email service from environment
    let emailService;
    try {
      emailService = EmailService.createFromEnv();
      console.log(`✅ Email service created: ${emailService.getProviderName()}`);
    } catch (error) {
      console.error('❌ Failed to create email service:', error.message);
      console.log('\n💡 Make sure you have configured your .env.local file:');
      console.log('   Run: ./setup-gmail.sh');
      console.log('   Or: ./setup-sendgrid.sh');
      return;
    }

    // Test configuration
    console.log('\n🔧 Testing email configuration...');
    const verifyResult = await emailService.verify();
    
    if (!verifyResult.success) {
      console.error('❌ Email configuration failed:', verifyResult.message);
      return;
    }
    
    console.log(verifyResult.message);

    // Send test email
    console.log('\n📤 Sending test email to rvegajr@darkware.net...');
    
    const testMessage = {
      to: 'rvegajr@darkware.net',
      subject: '🎉 BlessBox Abstracted Email System - SUCCESS!',
      text: `
Hello!

🎉 Fantastic! Your new abstracted email system is working perfectly!

✅ Email Provider: ${emailService.getProviderName()}
✅ Configuration: Valid
✅ Email Delivery: Successful
✅ BlessBox Integration: Complete

This new architecture provides:
- 🔄 Easy provider switching (Gmail ↔ SendGrid ↔ Others)
- 🛡️ Clean separation of concerns
- 🧪 Easy testing and mocking
- 📦 Modular and maintainable code
- ⚡ Provider-agnostic API

Your BlessBox contact form is now powered by a robust, 
swappable email system!

Next steps:
- Contact form: http://localhost:7777/forms/contact
- Email testing: http://localhost:7777/email-test
- Switch providers anytime by changing EMAIL_PROVIDER in .env.local

---
BlessBox - A Proud YOLOVibeCode Project
DBA Noctusoft, Inc

Technical Details:
- Provider: ${emailService.getProviderName()}
- Architecture: Abstracted Email Service
- Swappable: Yes ✅
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #1d4ed8 50%, #059669 100%); padding: 40px 30px; border-radius: 15px; margin-bottom: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold;">🎉 BlessBox Email System</h1>
            <h2 style="color: #e0f2fe; margin: 10px 0 0 0; font-size: 20px;">Abstracted & Swappable!</h2>
          </div>
          
          <!-- Success Message -->
          <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="display: inline-block; background: #dcfce7; padding: 15px; border-radius: 50%; margin-bottom: 15px;">
                <span style="font-size: 40px;">🏗️</span>
              </div>
              <h2 style="color: #1e293b; margin: 0; font-size: 24px;">Abstracted Email System Complete!</h2>
            </div>
            <p style="color: #475569; font-size: 16px; line-height: 1.6; text-align: center;">
              Fantastic! Your new email architecture is working perfectly with clean separation and easy provider switching.
            </p>
          </div>
          
          <!-- Architecture Benefits -->
          <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <h3 style="color: #1e293b; margin-top: 0; font-size: 20px; border-bottom: 2px solid #7c3aed; padding-bottom: 10px;">🏗️ Architecture Benefits</h3>
            
            <div style="display: grid; gap: 15px;">
              <div style="display: flex; align-items: center; padding: 15px; background: #faf5ff; border-radius: 10px; border-left: 4px solid #7c3aed;">
                <span style="color: #7c3aed; font-size: 20px; margin-right: 15px;">🔄</span>
                <div>
                  <strong style="color: #1e293b; display: block;">Easy Provider Switching</strong>
                  <span style="color: #475569; font-size: 14px;">Gmail ↔ SendGrid ↔ Others</span>
                </div>
              </div>
              
              <div style="display: flex; align-items: center; padding: 15px; background: #eff6ff; border-radius: 10px; border-left: 4px solid #1d4ed8;">
                <span style="color: #1d4ed8; font-size: 20px; margin-right: 15px;">🛡️</span>
                <div>
                  <strong style="color: #1e293b; display: block;">Clean Separation</strong>
                  <span style="color: #475569; font-size: 14px;">Interface-based design</span>
                </div>
              </div>
              
              <div style="display: flex; align-items: center; padding: 15px; background: #f0fdf4; border-radius: 10px; border-left: 4px solid #059669;">
                <span style="color: #059669; font-size: 20px; margin-right: 15px;">🧪</span>
                <div>
                  <strong style="color: #1e293b; display: block;">Easy Testing</strong>
                  <span style="color: #475569; font-size: 14px;">Mockable and testable</span>
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
          
          <!-- Current Status -->
          <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 20px;">
            <h3 style="color: #1e293b; margin-top: 0; font-size: 20px; border-bottom: 2px solid #059669; padding-bottom: 10px;">📊 Current Status</h3>
            <div style="background: #f0fdf4; padding: 20px; border-radius: 10px; border-left: 4px solid #059669;">
              <p style="margin: 0; color: #1e293b;"><strong>Active Provider:</strong> ${emailService.getProviderName()}</p>
              <p style="margin: 10px 0 0 0; color: #475569; font-size: 14px;">
                Switch anytime by changing EMAIL_PROVIDER in .env.local
              </p>
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
                🏗️ Powered by Abstracted Email Service<br>
                Provider: ${emailService.getProviderName()} | 🔄 Swappable Architecture
              </p>
            </div>
          </div>
        </div>
      `
    };

    const result = await emailService.send(testMessage);
    
    if (result.success) {
      console.log('\n🎉 EMAIL SENT SUCCESSFULLY!');
      console.log('=====================================');
      console.log(`📊 Provider: ${emailService.getProviderName()}`);
      console.log(`📧 Message ID: ${result.messageId}`);
      console.log(`📬 Delivered to: rvegajr@darkware.net`);
      
      console.log('\n🏗️ ABSTRACTED EMAIL SYSTEM COMPLETE!');
      console.log('💌 Check rvegajr@darkware.net for the test email');
      console.log('🔄 Switch providers anytime by changing EMAIL_PROVIDER in .env.local');
      console.log('🚀 Your BlessBox has enterprise-grade, swappable email architecture!');
    } else {
      console.error('❌ Email send failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

testEmailSystem();