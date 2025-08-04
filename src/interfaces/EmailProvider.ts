// Email Provider Interface - Easily swappable email backends
export interface EmailMessage {
  to: string;
  from?: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailConfig {
  provider: 'gmail' | 'sendgrid' | 'smtp';
  credentials: {
    // Gmail OAuth2 or App Password
    user?: string;
    pass?: string;
    // SendGrid
    apiKey?: string;
    // SMTP
    host?: string;
    port?: number;
    secure?: boolean;
  };
  defaults: {
    fromEmail: string;
    fromName: string;
  };
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<EmailResponse>;
  verify(): Promise<{ success: boolean; message: string }>;
  getProviderName(): string;
}