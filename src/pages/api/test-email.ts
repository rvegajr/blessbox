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
          'Check your SENDGRID_API_KEY environment variable',
          'Verify your SendGrid API key starts with "SG."',
          'Ensure SENDGRID_FROM_EMAIL is set to a verified sender',
          'Check if your SendGrid account is active and not suspended',
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
          apiKey: process.env.SENDGRID_API_KEY ? 'Set (hidden)' : 'Not set',
          fromEmail: process.env.SENDGRID_FROM_EMAIL || 'contact@yolovibecodebootcamp.com',
          fromName: process.env.SENDGRID_FROM_NAME || 'BlessBox Contact',
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