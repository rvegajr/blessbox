import nodemailer from 'nodemailer';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailData {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Email configuration for YOLOVibeCode domain
export const getEmailConfig = (): EmailConfig => {
  // You'll need to set these environment variables
  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com', // Update with your actual SMTP host
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || 'contact@yolovibecodebootcamp.com',
      pass: process.env.SMTP_PASS || '', // App password or SMTP password
    },
  };
};

// Create transporter
export const createEmailTransporter = () => {
  const config = getEmailConfig();
  return nodemailer.createTransporter(config);
};

// Send email function
export const sendEmail = async (emailData: EmailData): Promise<boolean> => {
  try {
    const transporter = createEmailTransporter();
    
    // Verify connection configuration
    await transporter.verify();
    console.log('✅ SMTP server connection verified');
    
    // Send email
    const info = await transporter.sendMail(emailData);
    console.log('✅ Email sent successfully:', info.messageId);
    
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
};

// Test email function
export const testEmailConnection = async (): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> => {
  try {
    const transporter = createEmailTransporter();
    await transporter.verify();
    
    return {
      success: true,
      message: '✅ Email configuration is working correctly!',
    };
  } catch (error: any) {
    return {
      success: false,
      message: '❌ Email configuration failed',
      details: error.message,
    };
  }
};

// Email templates
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
          <span style="color: #64748b;">A Proud YOLOVibeCode Project - DBA Noctusoft, Inc</span>
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
A Proud YOLOVibeCode Project - DBA Noctusoft, Inc
  `;

  return { html, text };
};