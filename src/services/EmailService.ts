// Email Service - Factory and main interface
import type { EmailProvider, EmailMessage, EmailResponse } from '../interfaces/EmailProvider';
import { GmailProvider } from '../providers/GmailProvider';
import { SendGridProvider } from '../providers/SendGridProvider';

export class EmailService {
  private provider: EmailProvider;

  constructor(provider: EmailProvider) {
    this.provider = provider;
  }

  async send(message: EmailMessage): Promise<EmailResponse> {
    return this.provider.send(message);
  }

  async verify(): Promise<{ success: boolean; message: string }> {
    return this.provider.verify();
  }

  getProviderName(): string {
    return this.provider.getProviderName();
  }

  // Factory methods for easy provider creation
  static createGmailService(config: {
    user: string;
    pass: string;
    fromEmail?: string;
    fromName?: string;
  }): EmailService {
    return new EmailService(new GmailProvider(config));
  }

  static createSendGridService(config: {
    apiKey: string;
    fromEmail?: string;
    fromName?: string;
  }): EmailService {
    return new EmailService(new SendGridProvider(config));
  }

  // Create service based on environment configuration
  static createFromEnv(): EmailService {
    const provider = process.env.EMAIL_PROVIDER || import.meta.env.EMAIL_PROVIDER || 'gmail';

    switch (provider.toLowerCase()) {
      case 'gmail':
        return EmailService.createGmailService({
          user: process.env.GMAIL_USER || import.meta.env.GMAIL_USER || '',
          pass: process.env.GMAIL_PASS || import.meta.env.GMAIL_PASS || '',
          fromEmail: process.env.EMAIL_FROM || import.meta.env.EMAIL_FROM,
          fromName: process.env.EMAIL_FROM_NAME || import.meta.env.EMAIL_FROM_NAME || 'BlessBox Contact',
        });

      case 'sendgrid':
        return EmailService.createSendGridService({
          apiKey: process.env.SENDGRID_API_KEY || import.meta.env.SENDGRID_API_KEY || '',
          fromEmail: process.env.SENDGRID_FROM_EMAIL || import.meta.env.SENDGRID_FROM_EMAIL,
          fromName: process.env.SENDGRID_FROM_NAME || import.meta.env.SENDGRID_FROM_NAME || 'BlessBox Contact',
        });

      default:
        throw new Error(`Unsupported email provider: ${provider}`);
    }
  }
}