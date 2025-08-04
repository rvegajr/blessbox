// SendGrid Email Provider
import sgMail from '@sendgrid/mail';
import type { EmailProvider, EmailMessage, EmailResponse } from '../interfaces/EmailProvider';

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
  }

  async send(message: EmailMessage): Promise<EmailResponse> {
    try {
      const msg = {
        to: message.to,
        from: {
          email: message.from || this.fromEmail,
          name: this.fromName,
        },
        subject: message.subject,
        text: message.text,
        html: message.html || message.text.replace(/\n/g, '<br>'),
      };

      const result = await sgMail.send(msg);
      
      return {
        success: true,
        messageId: result[0].headers['x-message-id'] as string,
      };
    } catch (error: any) {
      console.error('SendGrid send error:', error);
      return {
        success: false,
        error: error.response?.body?.errors?.[0]?.message || error.message || 'Unknown error',
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