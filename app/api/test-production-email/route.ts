import { NextRequest, NextResponse } from 'next/server';

/**
 * Comprehensive production email test endpoint
 * Tests email sending and provides detailed diagnostics
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

    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      email: email,
      configuration: {
        sendGridApiKey: process.env.SENDGRID_API_KEY ? 'SET' : 'NOT SET',
        sendGridApiKeyLength: process.env.SENDGRID_API_KEY?.length || 0,
        sendGridApiKeyPrefix: process.env.SENDGRID_API_KEY?.substring(0, 10) || 'N/A',
        sendGridFromEmail: process.env.SENDGRID_FROM_EMAIL || 'NOT SET',
        smtpHost: process.env.SMTP_HOST || 'NOT SET',
        smtpUser: process.env.SMTP_USER ? 'SET' : 'NOT SET',
        emailProvider: process.env.EMAIL_PROVIDER || 'NOT SET',
      },
      tests: [] as any[],
    };

    // Generate test code
    const testCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Test 1: Try SendGrid
    if (process.env.SENDGRID_API_KEY) {
      try {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@blessbox.app';
        
        const html = `
          <h2>🧪 Production Email Test - BlessBox</h2>
          <p>This is a test email to verify production email configuration.</p>
          <p>Your test verification code is: <strong>${testCode}</strong></p>
          <p>If you received this email, production email is working! ✅</p>
          <hr>
          <p><small>Timestamp: ${new Date().toISOString()}</small></p>
        `;
        const text = `Production Email Test - BlessBox\n\nTest code: ${testCode}\n\nIf you received this, production email is working!`;

        const result = await sgMail.send({
          to: email,
          from: fromEmail,
          subject: '🧪 BlessBox Production Email Test',
          html,
          text,
        });
        
        diagnostics.tests.push({
          service: 'SendGrid',
          success: true,
          statusCode: result[0]?.statusCode,
          message: 'Email sent successfully',
        });
        
        return NextResponse.json({
          success: true,
          message: 'Test email sent successfully via SendGrid!',
          email: email,
          code: testCode,
          diagnostics: diagnostics,
          note: 'Check your email inbox and spam folder. The code is also returned here for verification.',
        });
      } catch (sendGridError: any) {
        diagnostics.tests.push({
          service: 'SendGrid',
          success: false,
          error: sendGridError.message,
          statusCode: sendGridError.code,
          response: sendGridError.response?.body,
        });

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
              subject: '🧪 BlessBox Production Email Test',
              html: `<h2>Production Email Test</h2><p>Test code: <strong>${testCode}</strong></p>`,
              text: `Test code: ${testCode}`,
            });
            
            diagnostics.tests.push({
              service: 'SMTP',
              success: true,
              messageId: info.messageId,
              message: 'Email sent successfully via SMTP',
            });
            
            return NextResponse.json({
              success: true,
              message: 'Test email sent successfully via SMTP!',
              email: email,
              code: testCode,
              diagnostics: diagnostics,
              note: 'SendGrid failed but SMTP worked. Check your email inbox.',
            });
          } catch (smtpError: any) {
            diagnostics.tests.push({
              service: 'SMTP',
              success: false,
              error: smtpError.message,
            });
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
          subject: '🧪 BlessBox Production Email Test',
          html: `<h2>Production Email Test</h2><p>Test code: <strong>${testCode}</strong></p>`,
          text: `Test code: ${testCode}`,
        });
        
        diagnostics.tests.push({
          service: 'SMTP',
          success: true,
          messageId: info.messageId,
          message: 'Email sent successfully',
        });
        
        return NextResponse.json({
          success: true,
          message: 'Test email sent successfully via SMTP!',
          email: email,
          code: testCode,
          diagnostics: diagnostics,
        });
      } catch (smtpError: any) {
        diagnostics.tests.push({
          service: 'SMTP',
          success: false,
          error: smtpError.message,
        });
      }
    }

    // No email service configured
    return NextResponse.json({
      success: false,
      error: 'No email service configured or all services failed',
      diagnostics: diagnostics,
      recommendations: [
        'Check SendGrid API key is valid and has Mail Send permission',
        'Verify SendGrid sender email is verified',
        'Check Vercel environment variables are set correctly',
        'Verify application was redeployed after env var updates',
        'Check SendGrid Activity dashboard for delivery status',
      ],
    }, { status: 500 });
  } catch (error) {
    console.error('❌ Production email test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

