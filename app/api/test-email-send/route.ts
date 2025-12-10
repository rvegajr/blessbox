import { NextRequest, NextResponse } from 'next/server';

/**
 * Test endpoint to send a verification email directly
 * Bypasses database to test email sending only
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    console.log(`🧪 Testing email send to: ${email}`);
    console.log('📧 Email configuration:');
    console.log('  SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'SET ✅' : 'NOT SET ❌');
    console.log('  SENDGRID_FROM_EMAIL:', process.env.SENDGRID_FROM_EMAIL || 'NOT SET');
    console.log('  SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
    console.log('  SMTP_USER:', process.env.SMTP_USER ? 'SET ✅' : 'NOT SET ❌');
    console.log('  NODE_ENV:', process.env.NODE_ENV);

    // Generate a test code
    const testCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Try to send email directly
    let emailSent = false;
    let errorMessage = '';

    // Try SendGrid first
    if (process.env.SENDGRID_API_KEY) {
      try {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@blessbox.app';
        
        const html = `
          <h2>🧪 Test Email from BlessBox</h2>
          <p>This is a test verification email.</p>
          <p>Your test verification code is: <strong>${testCode}</strong></p>
          <p>This code will expire in 15 minutes.</p>
          <p>If you received this email, your email configuration is working! ✅</p>
        `;
        const text = `Test verification code: ${testCode}. This code will expire in 15 minutes.`;

        const result = await sgMail.send({
          to: email,
          from: fromEmail,
          subject: '🧪 BlessBox Test Email - Verification Code',
          html,
          text,
        });
        
        console.log(`✅ SendGrid email sent to ${email}, status: ${result[0]?.statusCode}`);
        emailSent = true;
      } catch (sendGridError: any) {
        console.error('❌ SendGrid error:', sendGridError);
        console.error('SendGrid response:', sendGridError.response?.body);
        errorMessage = `SendGrid failed: ${sendGridError.message}`;
        
        // Try SMTP fallback
        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
          try {
            const nodemailer = require('nodemailer');
            
            const transporter = nodemailer.createTransport({
              host: process.env.SMTP_HOST,
              port: Number(process.env.SMTP_PORT) || 587,
              secure: process.env.SMTP_PORT === '465',
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              },
            });

            const info = await transporter.sendMail({
              from: process.env.SMTP_FROM || process.env.SMTP_USER,
              to: email,
              subject: '🧪 BlessBox Test Email - Verification Code',
              html: `<h2>Test Email</h2><p>Test code: <strong>${testCode}</strong></p>`,
              text: `Test code: ${testCode}`,
            });
            
            console.log(`✅ SMTP email sent to ${email}, messageId: ${info.messageId}`);
            emailSent = true;
            errorMessage = '';
          } catch (smtpError: any) {
            console.error('❌ SMTP error:', smtpError);
            errorMessage += ` | SMTP also failed: ${smtpError.message}`;
          }
        }
      }
    } else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      // Try SMTP if SendGrid not available
      try {
        const nodemailer = require('nodemailer');
        
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_PORT === '465',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        const info = await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: email,
          subject: '🧪 BlessBox Test Email - Verification Code',
          html: `<h2>Test Email</h2><p>Test code: <strong>${testCode}</strong></p>`,
          text: `Test code: ${testCode}`,
        });
        
        console.log(`✅ SMTP email sent to ${email}, messageId: ${info.messageId}`);
        emailSent = true;
      } catch (smtpError: any) {
        console.error('❌ SMTP error:', smtpError);
        errorMessage = `SMTP failed: ${smtpError.message}`;
      }
    } else {
      // Development mode - just log
      if (process.env.NODE_ENV === 'development') {
        console.log(`📧 [DEV] Test verification code for ${email}: ${testCode}`);
        console.log('⚠️  [DEV] No email service configured - code logged to console only');
        return NextResponse.json({
          success: true,
          message: 'Email would be sent in production. In development, code is logged to console.',
          email: email,
          code: testCode,
          note: 'Check server console for the code'
        });
      } else {
        errorMessage = 'No email service configured';
      }
    }

    if (!emailSent && errorMessage) {
      return NextResponse.json(
        { 
          success: false, 
          error: errorMessage,
          details: 'Check server logs for more information',
          email: email,
          code: testCode, // Return code even on failure for testing
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully!',
      email: email,
      code: testCode,
      note: 'Check your email inbox and spam folder. The code is also returned here for testing.'
    });
  } catch (error) {
    console.error('❌ Test email send error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: 'Check server logs for more information'
      },
      { status: 500 }
    );
  }
}
