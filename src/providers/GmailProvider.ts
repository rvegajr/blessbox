// Gmail Email Provider using Nodemailer
import type { EmailProvider, EmailMessage, EmailResponse } from '../interfaces/EmailProvider';
import { logEmailAttempt } from '../pages/api/admin/email-logs';

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
    const timestamp = new Date().toISOString();
    const fromAddress = message.from || this.fromEmail;
    
    // Log email attempt with full details
    console.log(`📧 [${timestamp}] EMAIL SEND ATTEMPT - Gmail`);
    console.log(`   To: ${message.to}`);
    console.log(`   From: ${fromAddress} (${this.fromName})`);
    console.log(`   Subject: ${message.subject}`);
    console.log(`   Provider: Gmail`);
    
    try {
      const transporter = await this.initializeTransporter();
      
      const mailOptions = {
        from: `"${this.fromName}" <${fromAddress}>`,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html || message.text.replace(/\n/g, '<br>'),
      };

      const result = await transporter.sendMail(mailOptions);
      
      // Log successful send with message ID
      console.log(`✅ [${timestamp}] EMAIL SENT SUCCESSFULLY - Gmail`);
      console.log(`   To: ${message.to}`);
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Response: ${result.response}`);
      
      // Log to centralized email logs
      logEmailAttempt({
        timestamp,
        provider: 'Gmail',
        to: message.to,
        from: fromAddress,
        subject: message.subject,
        success: true,
        messageId: result.messageId
      });
      
      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      // Log detailed error information
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ [${timestamp}] EMAIL SEND FAILED - Gmail`);
      console.error(`   To: ${message.to}`);
      console.error(`   From: ${fromAddress}`);
      console.error(`   Subject: ${message.subject}`);
      console.error(`   Error: ${errorMessage}`);
      
      // Log to centralized email logs
      logEmailAttempt({
        timestamp,
        provider: 'Gmail',
        to: message.to,
        from: fromAddress,
        subject: message.subject,
        success: false,
        error: errorMessage
      });
      
      return {
        success: false,
        error: errorMessage,
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