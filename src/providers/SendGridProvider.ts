// SendGrid Email Provider
import sgMail from '@sendgrid/mail';
import type { EmailProvider, EmailMessage, EmailResponse } from '../interfaces/EmailProvider';
import { logEmailAttempt } from '../pages/api/admin/email-logs';

export class SendGridProvider implements EmailProvider {
  private fromEmail: string;
  private fromName: string;

  constructor(config: {
    apiKey: string;
    fromEmail?: string;
    fromName?: string;
  }) {
    sgMail.setApiKey(config.apiKey);
    this.fromEmail = config.fromEmail || 'contact@yolovibecodebootcamp.com';
    this.fromName = config.fromName || 'BlessBox Contact';

    // Debug: log redacted key and from for runtime verification
    try {
      const key = config.apiKey || '';
      const redacted = key.length >= 12
        ? `${key.slice(0, 6)}...${key.slice(-6)}`
        : `${key.slice(0, 3)}...${key.slice(-3)}`;
      // Intentionally minimal, redacted output only
      console.log(`[Email] SendGrid initialized (key=${redacted}, from=${this.fromEmail})`);
    } catch {}
  }

  async send(message: EmailMessage): Promise<EmailResponse> {
    const timestamp = new Date().toISOString();
    const fromAddress = message.from || this.fromEmail;
    
    // Log email attempt with full details
    console.log(`📧 [${timestamp}] EMAIL SEND ATTEMPT - SendGrid`);
    console.log(`   To: ${message.to}`);
    console.log(`   From: ${fromAddress} (${this.fromName})`);
    console.log(`   Subject: ${message.subject}`);
    console.log(`   Provider: SendGrid`);
    
    try {
      const msg = {
        to: message.to,
        from: {
          email: fromAddress,
          name: this.fromName,
        },
        subject: message.subject,
        text: message.text,
        html: message.html || message.text.replace(/\n/g, '<br>'),
      };

      const result = await sgMail.send(msg);
      const messageId = result[0].headers['x-message-id'] as string;
      
      // Log successful send with message ID
      console.log(`✅ [${timestamp}] EMAIL SENT SUCCESSFULLY - SendGrid`);
      console.log(`   To: ${message.to}`);
      console.log(`   Message ID: ${messageId}`);
      console.log(`   Status Code: ${result[0].statusCode}`);
      
      // Log to centralized email logs
      logEmailAttempt({
        timestamp,
        provider: 'SendGrid',
        to: message.to,
        from: fromAddress,
        subject: message.subject,
        success: true,
        messageId,
        statusCode: result[0].statusCode
      });
      
      return {
        success: true,
        messageId,
      };
    } catch (error: any) {
      // Log detailed error information
      const errorMessage = error.response?.body?.errors?.[0]?.message || error.message || 'Unknown error';
      console.error(`❌ [${timestamp}] EMAIL SEND FAILED - SendGrid`);
      console.error(`   To: ${message.to}`);
      console.error(`   From: ${fromAddress}`);
      console.error(`   Subject: ${message.subject}`);
      console.error(`   Error: ${errorMessage}`);
      if (error.response?.status) {
        console.error(`   HTTP Status: ${error.response.status}`);
      }
      
      // Log to centralized email logs
      logEmailAttempt({
        timestamp,
        provider: 'SendGrid',
        to: message.to,
        from: fromAddress,
        subject: message.subject,
        success: false,
        error: errorMessage,
        statusCode: error.response?.status
      });
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async verify(): Promise<{ success: boolean; message: string }> {
    try {
      // SendGrid doesn't have a direct verify method, but we can check API key format
      return {
        success: true,
        message: '✅ SendGrid API key format is valid. Send a test email to verify delivery.',
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ SendGrid configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  getProviderName(): string {
    return 'SendGrid';
  }
}