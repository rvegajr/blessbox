// Gmail Email Provider using Nodemailer
import type { EmailProvider, EmailMessage, EmailResponse } from '../interfaces/EmailProvider';

export class GmailProvider implements EmailProvider {
  private transporter: any;
  private fromEmail: string;
  private fromName: string;
  private config: {
    user: string;
    pass: string;
    fromEmail?: string;
    fromName?: string;
  };

  constructor(config: {
    user: string;
    pass: string; // App password
    fromEmail?: string;
    fromName?: string;
  }) {
    this.config = config;
    this.fromEmail = config.fromEmail || config.user;
    this.fromName = config.fromName || 'BlessBox Contact';
  }

  private async initializeTransporter() {
    if (!this.transporter) {
      // Use dynamic import to avoid SSR issues
      const nodemailer = await import('nodemailer');
      
      this.transporter = nodemailer.default.createTransport({
        service: 'gmail',
        auth: {
          user: this.config.user,
          pass: this.config.pass, // Use App Password, not regular password
        },
      });
    }
    return this.transporter;
  }

  async send(message: EmailMessage): Promise<EmailResponse> {
    try {
      const transporter = await this.initializeTransporter();
      
      const mailOptions = {
        from: `"${this.fromName}" <${message.from || this.fromEmail}>`,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html || message.text.replace(/\n/g, '<br>'),
      };

      const result = await transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      console.error('Gmail send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async verify(): Promise<{ success: boolean; message: string }> {
    try {
      const transporter = await this.initializeTransporter();
      await transporter.verify();
      return {
        success: true,
        message: '✅ Gmail configuration is working correctly!',
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Gmail configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  getProviderName(): string {
    return 'Gmail SMTP';
  }
}