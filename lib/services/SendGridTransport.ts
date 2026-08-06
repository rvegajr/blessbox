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
import { getRequiredEnv, getEnv } from '../utils/env';
import { sendViaGatewayEmail } from './gatewayEmail';

export class SendGridTransport implements IEmailTransport {
  private _fromEmail: string | null = null;
  private _fromName: string | null = null;

  private get fromEmail(): string {
    if (!this._fromEmail) {
      this._fromEmail = getRequiredEnv('SENDGRID_FROM_EMAIL', 'SendGrid from email not configured. Set SENDGRID_FROM_EMAIL environment variable.');
    }
    return this._fromEmail;
  }

  private get fromName(): string {
    if (!this._fromName) {
      this._fromName = getEnv('SENDGRID_FROM_NAME', 'BlessBox');
    }
    return this._fromName;
  }

  async sendDirect(message: EmailMessage): Promise<EmailResult> {
    // All email egresses through the Noctusoft SendGrid relay using the gateway
    // deploy key — no direct SENDGRID_API_KEY in the app.
    try {
      const from = { email: this.fromEmail, name: this.fromName }; // throws if SENDGRID_FROM_EMAIL missing
      const result = await sendViaGatewayEmail({
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
        from,
        attachments: message.attachments,
      });
      if (!result.success && getEnv('NODE_ENV') !== 'test') {
        console.error('[SendGridTransport] Send failed:', result.error);
      }
      return result;
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
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
        
        if (getEnv("NODE_ENV") !== 'test') {
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

