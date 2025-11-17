import type { APIRoute } from 'astro';
import { sendEmail, createVerificationEmailTemplate, generateVerificationCode } from '../../../utils/email';
import { validationService } from '../../../implementations/services/ValidationService';
import { storeVerificationCode, checkRateLimit } from '../../../utils/verification-storage';

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    const body = await request.json();
    const { email, organizationName } = body;

    // Validate required fields
    if (!email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email is required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate email format
    if (!validationService.validateEmail(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: validationService.getErrorMessage('email', 'format'),
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Check rate limiting
    const rateCheck = checkRateLimit(email);
    if (!rateCheck.allowed) {
      const resetTime = rateCheck.resetAt?.toLocaleTimeString() || 'later';
      return new Response(
        JSON.stringify({
          success: false,
          error: `Too many verification requests. Please try again after ${resetTime}.`,
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate verification code
    const hostname = new URL(request.url).hostname;
    const MAGIC_CODE = process.env.MAGIC_VERIFICATION_CODE || '111111';
    const ALLOW_MAGIC_HOSTS = (process.env.ALLOW_MAGIC_CODE_HOSTS || 'localhost,127.0.0.1')
      .split(',')
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean);
    const isMagicHost = ALLOW_MAGIC_HOSTS.includes(hostname.toLowerCase()) && (process.env.NODE_ENV !== 'production');
    const code = isMagicHost ? MAGIC_CODE : generateVerificationCode();

    // Store verification code
    storeVerificationCode(email, code);

    // Create email template
    const { html, text } = createVerificationEmailTemplate({
      email,
      code,
      organizationName,
    });

    // Send email using existing email service
    try {
      const emailResult = await sendEmail({
        to: email,
        subject: 'Verify Your BlessBox Account',
        html,
        text,
      });

      if (!emailResult.success) {
        throw new Error(emailResult.error || 'Failed to send email');
      }

      console.log(`✅ Verification email sent to ${email} with code: ${code}`);

      // Success response
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Verification code sent successfully',
          messageId: emailResult.messageId,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      
      // Fallback: log the code for testing but report email failure
      console.log(`📧 Email failed, but code generated for ${email}: ${code}`);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to send verification email. Please try again.',
          details: emailError instanceof Error ? emailError.message : 'Unknown email error'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

  } catch (error) {
    console.error('Send verification error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};