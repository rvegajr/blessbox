import { getDbClient } from '../db';
import { v4 as uuidv4 } from 'uuid';

export interface EmailTemplate {
  id: string;
  organization_id: string;
  template_type: 'class_invitation' | 'enrollment_confirmation' | 'class_reminder' | 'payment_receipt';
  subject: string;
  html_content: string;
  text_content?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailLog {
  id: string;
  organization_id: string;
  recipient_email: string;
  template_type: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending';
  sent_at: string;
  error_message?: string;
  metadata?: string;
}

export class EmailService {
  private db = getDbClient();

  // Email Template Management
  async createTemplate(data: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<EmailTemplate> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.db.execute({
      sql: `INSERT INTO email_templates (id, organization_id, template_type, subject, html_content, text_content, is_active, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, data.organization_id, data.template_type, data.subject, data.html_content, data.text_content || null, data.is_active ? 1 : 0, now, now]
    });

    return this.getTemplate(id) as Promise<EmailTemplate>;
  }

  async getTemplate(id: string): Promise<EmailTemplate | null> {
    const result = await this.db.execute({
      sql: 'SELECT * FROM email_templates WHERE id = ?',
      args: [id]
    });

    const row = result.rows[0] as any;
    return row ? {
      ...row,
      is_active: row.is_active === 1
    } : null;
  }

  async getTemplateByType(organizationId: string, templateType: EmailTemplate['template_type']): Promise<EmailTemplate | null> {
    const result = await this.db.execute({
      sql: 'SELECT * FROM email_templates WHERE organization_id = ? AND template_type = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1',
      args: [organizationId, templateType]
    });

    const row = result.rows[0] as any;
    return row ? {
      ...row,
      is_active: row.is_active === 1
    } : null;
  }

  // Email Logging
  async logEmail(data: Omit<EmailLog, 'id' | 'sent_at'>): Promise<EmailLog> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.db.execute({
      sql: `INSERT INTO email_logs (id, organization_id, recipient_email, template_type, subject, status, sent_at, error_message, metadata) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, data.organization_id, data.recipient_email, data.template_type, data.subject, data.status, now, data.error_message || null, data.metadata || null]
    });

    return this.getEmailLog(id) as Promise<EmailLog>;
  }

  async getEmailLog(id: string): Promise<EmailLog | null> {
    const result = await this.db.execute({
      sql: 'SELECT * FROM email_logs WHERE id = ?',
      args: [id]
    });

    return result.rows[0] as EmailLog || null;
  }

  // Email Sending (placeholder - integrate with your email provider)
  async sendEmail(
    organizationId: string,
    recipientEmail: string,
    templateType: EmailTemplate['template_type'],
    variables: Record<string, any> = {}
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get template
      const template = await this.getTemplateByType(organizationId, templateType);
      if (!template) {
        return { success: false, error: 'Template not found' };
      }

      // Replace variables in template
      let subject = template.subject;
      let htmlContent = template.html_content;
      let textContent = template.text_content;

      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
        htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), String(value));
        if (textContent) {
          textContent = textContent.replace(new RegExp(placeholder, 'g'), String(value));
        }
      });

      // Log email attempt
      await this.logEmail({
        organization_id: organizationId,
        recipient_email: recipientEmail,
        template_type: templateType,
        subject: subject,
        status: 'pending'
      });

      // TODO: Integrate with actual email provider (Gmail, SendGrid, etc.)
      // For now, just log success
      console.log(`📧 Email sent to ${recipientEmail}: ${subject}`);
      
      // Update log status
      await this.logEmail({
        organization_id: organizationId,
        recipient_email: recipientEmail,
        template_type: templateType,
        subject: subject,
        status: 'sent'
      });

      return { success: true };
    } catch (error) {
      // Log error
      await this.logEmail({
        organization_id: organizationId,
        recipient_email: recipientEmail,
        template_type: templateType,
        subject: 'Failed to send',
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });

      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Default Templates
  async createDefaultTemplates(organizationId: string): Promise<void> {
    const templates = [
      {
        template_type: 'class_invitation' as const,
        subject: 'You\'re invited to {{class_name}}!',
        html_content: `
          <h2>You're invited to {{class_name}}!</h2>
          <p>Hello {{participant_name}},</p>
          <p>You've been invited to join our class: <strong>{{class_name}}</strong></p>
          <p><strong>Class Details:</strong></p>
          <ul>
            <li>Date: {{session_date}}</li>
            <li>Time: {{session_time}}</li>
            <li>Duration: {{duration_minutes}} minutes</li>
            <li>Location: {{location}}</li>
            <li>Instructor: {{instructor_name}}</li>
          </ul>
          <p>Please confirm your attendance by clicking the link below:</p>
          <a href="{{confirmation_link}}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Confirm Attendance</a>
          <p>If you have any questions, please contact us.</p>
          <p>Best regards,<br>{{organization_name}}</p>
        `,
        text_content: `
          You're invited to {{class_name}}!
          
          Hello {{participant_name}},
          
          You've been invited to join our class: {{class_name}}
          
          Class Details:
          - Date: {{session_date}}
          - Time: {{session_time}}
          - Duration: {{duration_minutes}} minutes
          - Location: {{location}}
          - Instructor: {{instructor_name}}
          
          Please confirm your attendance by visiting: {{confirmation_link}}
          
          If you have any questions, please contact us.
          
          Best regards,
          {{organization_name}}
        `
      },
      {
        template_type: 'enrollment_confirmation' as const,
        subject: 'Enrollment Confirmed - {{class_name}}',
        html_content: `
          <h2>Enrollment Confirmed!</h2>
          <p>Hello {{participant_name}},</p>
          <p>Your enrollment in <strong>{{class_name}}</strong> has been confirmed.</p>
          <p><strong>Class Details:</strong></p>
          <ul>
            <li>Date: {{session_date}}</li>
            <li>Time: {{session_time}}</li>
            <li>Location: {{location}}</li>
          </ul>
          <p>We look forward to seeing you there!</p>
          <p>Best regards,<br>{{organization_name}}</p>
        `,
        text_content: `
          Enrollment Confirmed!
          
          Hello {{participant_name}},
          
          Your enrollment in {{class_name}} has been confirmed.
          
          Class Details:
          - Date: {{session_date}}
          - Time: {{session_time}}
          - Location: {{location}}
          
          We look forward to seeing you there!
          
          Best regards,
          {{organization_name}}
        `
      },
      {
        template_type: 'class_reminder' as const,
        subject: 'Reminder: {{class_name}} tomorrow!',
        html_content: `
          <h2>Class Reminder</h2>
          <p>Hello {{participant_name}},</p>
          <p>This is a friendly reminder that you have class tomorrow:</p>
          <p><strong>{{class_name}}</strong></p>
          <p><strong>Time:</strong> {{session_time}}</p>
          <p><strong>Location:</strong> {{location}}</p>
          <p>See you there!</p>
          <p>Best regards,<br>{{organization_name}}</p>
        `,
        text_content: `
          Class Reminder
          
          Hello {{participant_name}},
          
          This is a friendly reminder that you have class tomorrow:
          
          {{class_name}}
          Time: {{session_time}}
          Location: {{location}}
          
          See you there!
          
          Best regards,
          {{organization_name}}
        `
      },
      {
        template_type: 'payment_receipt' as const,
        subject: 'Payment Receipt - {{organization_name}}',
        html_content: `
          <h2>Payment Receipt</h2>
          <p>Hello {{participant_name}},</p>
          <p>Thank you for your payment. Here are the details:</p>
          <p><strong>Payment Details:</strong></p>
          <ul>
            <li>Amount: ${{amount}}</li>
            <li>Date: {{payment_date}}</li>
            <li>Transaction ID: {{transaction_id}}</li>
            <li>Class: {{class_name}}</li>
          </ul>
          <p>Thank you for your business!</p>
          <p>Best regards,<br>{{organization_name}}</p>
        `,
        text_content: `
          Payment Receipt
          
          Hello {{participant_name}},
          
          Thank you for your payment. Here are the details:
          
          Payment Details:
          - Amount: ${{amount}}
          - Date: {{payment_date}}
          - Transaction ID: {{transaction_id}}
          - Class: {{class_name}}
          
          Thank you for your business!
          
          Best regards,
          {{organization_name}}
        `
      }
    ];

    for (const template of templates) {
      await this.createTemplate({
        organization_id: organizationId,
        ...template,
        is_active: true
      });
    }
  }
}

