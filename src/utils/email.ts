// Updated email utility using the new abstracted EmailService
import { EmailService } from '../services/EmailService';
import type { EmailMessage } from '../interfaces/EmailProvider';

// Lazy initialization of email service
let emailService: EmailService | null = null;

const getEmailService = (): EmailService => {
  if (!emailService) {
    try {
      emailService = EmailService.createFromEnv();
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      throw error;
    }
  }
  return emailService;
};

// Main send email function - now provider agnostic
export const sendEmail = async (message: EmailMessage) => {
  const service = getEmailService();
  return service.send(message);
};

// Verify email configuration
export const verifyEmailConfig = async () => {
  const service = getEmailService();
  return service.verify();
};

// Get current provider name
export const getEmailProvider = () => {
  const service = getEmailService();
  return service.getProviderName();
};

// Email templates (unchanged)
export const createContactEmailTemplate = (data: {
  name: string;
  email: string;
  company?: string;
  message: string;
}) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #0d9488 0%, #1e40af 100%); padding: 30px; border-radius: 10px; margin-bottom: 20px;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">BlessBox Contact Form</h1>
        <p style="color: #e0f2fe; margin: 10px 0 0 0;">New message received</p>
      </div>
      
      <div style="background: #f8fafc; padding: 30px; border-radius: 10px; border-left: 4px solid #0d9488;">
        <h2 style="color: #1e293b; margin-top: 0;">Contact Details</h2>
        
        <div style="margin-bottom: 15px;">
          <strong style="color: #0d9488;">Name:</strong>
          <p style="margin: 5px 0; color: #475569;">${data.name}</p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <strong style="color: #0d9488;">Email:</strong>
          <p style="margin: 5px 0; color: #475569;">
            <a href="mailto:${data.email}" style="color: #1e40af; text-decoration: none;">${data.email}</a>
          </p>
        </div>
        
        ${data.company ? `
        <div style="margin-bottom: 15px;">
          <strong style="color: #0d9488;">Company:</strong>
          <p style="margin: 5px 0; color: #475569;">${data.company}</p>
        </div>
        ` : ''}
        
        <div style="margin-bottom: 15px;">
          <strong style="color: #0d9488;">Message:</strong>
          <div style="background: white; padding: 15px; border-radius: 5px; margin-top: 5px; border: 1px solid #e2e8f0;">
            <p style="margin: 0; color: #475569; line-height: 1.6;">${data.message.replace(/\n/g, '<br>')}</p>
          </div>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding: 20px; background: #1e293b; border-radius: 10px;">
        <p style="color: #94a3b8; margin: 0; font-size: 14px;">
          This message was sent from the BlessBox contact form<br>
          <span style="color: #64748b;">A Proud YOLOVibeCode Project - Copyright 2025 Noctusoft, Inc ®</span>
        </p>
        <p style="color: #64748b; margin: 10px 0 0 0; font-size: 12px;">
          Sent via ${getEmailProvider()}
        </p>
      </div>
    </div>
  `;

  const text = `
BlessBox Contact Form - New Message

Name: ${data.name}
Email: ${data.email}
${data.company ? `Company: ${data.company}` : ''}

Message:
${data.message}

---
This message was sent from the BlessBox contact form
A Proud YOLOVibeCode Project - Copyright 2025 Noctusoft, Inc ®
Sent via ${getEmailProvider()}
  `;

  return { html, text };
};

// Email verification template
export const createVerificationEmailTemplate = (data: {
  email: string;
  code: string;
  organizationName?: string;
}) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #0d9488 0%, #1e40af 100%); padding: 30px; border-radius: 10px; margin-bottom: 20px;">
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">BlessBox Email Verification</h1>
        <p style="color: #e0f2fe; margin: 10px 0 0 0;">Verify your account to continue</p>
      </div>
      
      <div style="background: #f8fafc; padding: 30px; border-radius: 10px; border-left: 4px solid #0d9488;">
        <h2 style="color: #1e293b; margin-top: 0;">Verification Code</h2>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          Hello! We received a request to verify your email address for ${data.organizationName || 'your organization'}.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <div style="background: white; display: inline-block; padding: 20px 40px; border-radius: 10px; border: 2px solid #0d9488; font-size: 32px; font-weight: bold; color: #0d9488; letter-spacing: 8px; font-family: 'Courier New', monospace;">
            ${data.code}
          </div>
        </div>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          Enter this 6-digit code in your browser to verify your email address. This code will expire in <strong>15 minutes</strong>.
        </p>
        
        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="color: #92400e; margin: 0; font-size: 14px;">
            <strong>Security Note:</strong> If you didn't request this verification, please ignore this email. Never share this code with anyone.
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding: 20px; background: #1e293b; border-radius: 10px;">
        <p style="color: #94a3b8; margin: 0; font-size: 14px;">
          This verification email was sent from BlessBox<br>
          <span style="color: #64748b;">A Proud YOLOVibeCode Project - Copyright 2025 Noctusoft, Inc ®</span>
        </p>
        <p style="color: #64748b; margin: 10px 0 0 0; font-size: 12px;">
          Sent via ${getEmailProvider()}
        </p>
      </div>
    </div>
  `;

  const text = `
BlessBox Email Verification

Hello! We received a request to verify your email address for ${data.organizationName || 'your organization'}.

Your verification code is: ${data.code}

Enter this 6-digit code in your browser to verify your email address. This code will expire in 15 minutes.

Security Note: If you didn't request this verification, please ignore this email. Never share this code with anyone.

---
This verification email was sent from BlessBox
A Proud YOLOVibeCode Project - Copyright 2025 Noctusoft, Inc ®
Sent via ${getEmailProvider()}
  `;

  return { html, text };
};

// Verification code utilities
export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const isValidVerificationCode = (code: string): boolean => {
  return /^\d{6}$/.test(code);
};

// Legacy compatibility exports
export const testEmailConnection = verifyEmailConfig;