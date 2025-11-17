/**
 * Email Template Utilities
 * Creates email templates for verification codes and other notifications
 */

export interface VerificationEmailData {
  code: string;
  organizationName?: string;
  email?: string;
}

/**
 * Create HTML template for verification code email
 */
export function createVerificationEmailTemplate(data: VerificationEmailData): { html: string; text: string } {
  const { code, organizationName = 'BlessBox', email } = data;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - ${organizationName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">${organizationName}</h1>
  </div>
  
  <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>
    
    <p style="color: #666; font-size: 16px;">
      ${email ? `Hello,<br><br>We received a request to verify the email address <strong>${email}</strong> for your ${organizationName} account.` : `Hello,<br><br>We received a request to verify your email address for your ${organizationName} account.`}
    </p>
    
    <div style="background: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
      <p style="margin: 0 0 10px 0; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
      <div style="font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
        ${code}
      </div>
    </div>
    
    <p style="color: #666; font-size: 14px; margin-bottom: 0;">
      This code will expire in <strong>15 minutes</strong>. If you didn't request this code, please ignore this email.
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #999; font-size: 12px;">
    <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${organizationName}. All rights reserved.</p>
    <p style="margin: 5px 0 0 0;">This is an automated email, please do not reply.</p>
  </div>
</body>
</html>
  `.trim();

  const text = `
${organizationName}
${'='.repeat(organizationName.length)}

Verify Your Email Address

Hello,

${email ? `We received a request to verify the email address ${email} for your ${organizationName} account.` : `We received a request to verify your email address for your ${organizationName} account.`}

Your Verification Code: ${code}

This code will expire in 15 minutes. If you didn't request this code, please ignore this email.

---
© ${new Date().getFullYear()} ${organizationName}. All rights reserved.
This is an automated email, please do not reply.
  `.trim();

  return { html, text };
}

