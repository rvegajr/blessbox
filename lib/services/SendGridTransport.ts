/**
 * SendGridTransport - Direct SendGrid email transport
 * 
 * Implements IEmailTransport for SendGrid
 * Single responsibility: Send emails via SendGrid API
 */

import type { 
  IEmailTransport, 
  EmailMessage, 
  EmailResult 
} from '../interfaces/IEmailTransport';

export class SendGridTransport implements IEmailTransport {
  private apiKey: string;
  private fromEmail: string;
  private fromName: string;

  constructor() {
    // Validate required configuration
    this.apiKey = process.env.SENDGRID_API_KEY?.trim() || '';
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL?.trim() || '';
    this.fromName = process.env.SENDGRID_FROM_NAME?.trim() || 'BlessBox';

    if (!this.apiKey) {
      throw new Error('SendGrid API key not configured. Set SENDGRID_API_KEY environment variable.');
    }

    if (!this.fromEmail) {
      throw new Error('SendGrid from email not configured. Set SENDGRID_FROM_EMAIL environment variable.');
    }
  }

  async sendDirect(message: EmailMessage): Promise<EmailResult> {
    try {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(this.apiKey);

      const payload = {
        to: message.to,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: message.subject,
        html: message.html,
        ...(message.text ? { text: message.text } : {}),
        ...(message.attachments ? { attachments: message.attachments } : {}),
      };

      const response = await sgMail.send(payload);

      return {
        success: true,
        messageId: response[0]?.headers?.['x-message-id'] || undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown SendGrid error';
      
      // Log error for debugging
      if (process.env.NODE_ENV !== 'test') {
        console.error('[SendGridTransport] Send failed:', errorMessage);
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async sendWithRetry(
    message: EmailMessage,
    maxAttempts: number = 3
  ): Promise<EmailResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await this.sendDirect(message);

        if (result.success) {
          return {
            ...result,
            attempts: attempt,
          };
        }

        lastError = new Error(result.error || 'SendGrid send failed');
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
      }

      // If not last attempt, wait before retrying
      if (attempt < maxAttempts) {
        const backoffMs = 1000 * attempt; // Linear backoff: 1s, 2s, 3s
        
        if (process.env.NODE_ENV !== 'test') {
          console.warn(`[SendGridTransport] Attempt ${attempt} failed, retrying in ${backoffMs}ms...`);
        }

        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Failed after retries',
      attempts: maxAttempts,
    };
  }
}

