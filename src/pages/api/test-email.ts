import type { APIRoute } from 'astro';
import { testEmailConnection, sendEmail, createContactEmailTemplate } from '../../utils/email';

export const GET: APIRoute = async () => {
  try {
    // Test email configuration
    const connectionTest = await testEmailConnection();
    
    if (!connectionTest.success) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Email configuration test failed',
          details: connectionTest.details,
          recommendations: [
            'Check your SMTP_HOST environment variable',
            'Verify SMTP_USER and SMTP_PASS credentials',
            'Ensure SMTP_PORT and SMTP_SECURE are correctly set',
            'Check if your email provider requires app-specific passwords',
          ],
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email configuration is working correctly!',
        config: {
          host: process.env.SMTP_HOST || 'Not set',
          port: process.env.SMTP_PORT || 'Not set',
          user: process.env.SMTP_USER || 'Not set',
          secure: process.env.SMTP_SECURE || 'Not set',
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Email test failed',
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

export const POST: APIRoute = async () => {
  try {
    // Send a test email
    const { html, text } = createContactEmailTemplate({
      name: 'BlessBox Test',
      email: 'test@example.com',
      company: 'YOLOVibeCode',
      message: 'This is a test email to verify the email functionality is working correctly. If you receive this, your email setup is successful!',
    });

    const emailSent = await sendEmail({
      from: `"BlessBox Test" <contact@yolovibecodebootcamp.com>`,
      to: 'contact@yolovibecodebootcamp.com',
      subject: '🧪 BlessBox Email Test - Configuration Working!',
      html,
      text,
    });

    if (emailSent) {
      return new Response(
        JSON.stringify({
          success: true,
          message: '✅ Test email sent successfully! Check your inbox at contact@yolovibecodebootcamp.com',
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: '❌ Failed to send test email',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Test email failed',
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};