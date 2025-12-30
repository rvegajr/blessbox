import { getDbClient } from '../db';
import { v4 as uuidv4 } from 'uuid';
import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';

export type EmailTemplateType =
  | 'class_invitation'
  | 'enrollment_confirmation'
  | 'class_reminder'
  | 'payment_receipt'
  | 'registration_confirmation'
  | 'admin_notification';

export interface EmailTemplate {
  id: string;
  organization_id: string;
  template_type: EmailTemplateType;
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

  private renderTemplate(template: EmailTemplate, variables: Record<string, any>) {
    let subject = template.subject;
    let htmlContent = template.html_content;
    let textContent = template.text_content;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      const re = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      subject = subject.replace(re, String(value));
      htmlContent = htmlContent.replace(re, String(value));
      if (textContent) textContent = textContent.replace(re, String(value));
    }

    return { subject, htmlContent, textContent };
  }

  private async createEmailLog(data: Omit<EmailLog, 'id' | 'sent_at'>): Promise<{ id: string }> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.db.execute({
      sql: `INSERT INTO email_logs (id, organization_id, recipient_email, template_type, subject, status, sent_at, error_message, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        data.organization_id,
        data.recipient_email,
        data.template_type,
        data.subject,
        data.status,
        now,
        data.error_message || null,
        data.metadata || null,
      ],
    });

    return { id };
  }

  private async updateEmailLog(id: string, updates: { status: EmailLog['status']; error_message?: string | null; metadata?: string | null }) {
    await this.db.execute({
      sql: `UPDATE email_logs
            SET status = ?, error_message = ?, metadata = ?
            WHERE id = ?`,
      args: [updates.status, updates.error_message || null, updates.metadata || null, id],
    });
  }

  private async sendViaSendGrid(args: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    fromEmailOverride?: string;
    replyTo?: string;
  }) {
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    const fromName = process.env.SENDGRID_FROM_NAME || 'BlessBox';

    if (!apiKey || !fromEmail) {
      throw new Error('SendGrid not configured (SENDGRID_API_KEY and SENDGRID_FROM_EMAIL are required)');
    }

    sgMail.setApiKey(apiKey);
    const from = { email: args.fromEmailOverride || fromEmail, name: fromName };
    const replyTo = args.replyTo || process.env.EMAIL_REPLY_TO;

    try {
      const [res] = await sgMail.send({
        to: args.to,
        from,
        ...(replyTo ? { replyTo } : {}),
        subject: args.subject,
        html: args.html,
        text: args.text,
      });

      return { provider: 'sendgrid' as const, messageId: (res as any)?.headers?.['x-message-id'] || undefined };
    } catch (e: any) {
      // SendGrid errors often contain useful response data.
      const statusCode = e?.code || e?.response?.statusCode || e?.response?.status;
      const body = e?.response?.body;
      const details =
        body && typeof body === 'object'
          ? JSON.stringify(body)
          : body
            ? String(body)
            : '';
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(
        `SendGrid error${statusCode ? ` (${statusCode})` : ''}: ${msg}${details ? ` | response: ${details}` : ''}`
      );
    }
  }

  private async sendViaSmtp(args: { to: string; subject: string; html: string; text?: string; replyTo?: string }) {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;
    const fromEmail = process.env.SMTP_FROM || user;
    const fromName = process.env.SMTP_FROM_NAME || 'BlessBox';

    if (!host || !user || !pass || !fromEmail) {
      throw new Error('SMTP not configured (SMTP_HOST, SMTP_USER, SMTP_PASS are required)');
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: args.to,
      ...(args.replyTo ? { replyTo: args.replyTo } : {}),
      subject: args.subject,
      html: args.html,
      text: args.text,
    });

    return { provider: 'smtp' as const, messageId: info.messageId };
  }

  private async sendViaGmailSmtp(args: { to: string; subject: string; html: string; text?: string; replyTo?: string }) {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_PASS;
    const fromEmail = process.env.EMAIL_FROM || user;
    const fromName = process.env.EMAIL_FROM_NAME || 'BlessBox';

    if (!user || !pass || !fromEmail) {
      throw new Error('Gmail SMTP not configured (GMAIL_USER and GMAIL_PASS are required)');
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: args.to,
      ...(args.replyTo ? { replyTo: args.replyTo } : {}),
      subject: args.subject,
      html: args.html,
      text: args.text,
    });

    return { provider: 'smtp' as const, messageId: info.messageId };
  }

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
    variables: Record<string, any> = {},
    options?: { replyTo?: string; fromEmailOverride?: string }
  ): Promise<{ success: boolean; error?: string }> {
    const logMeta: Record<string, any> = {};
    let emailLogId: string | null = null;
    try {
      // Ensure base templates exist (idempotent; safe)
      await this.ensureDefaultTemplates(organizationId);

      // Get template
      const template = await this.getTemplateByType(organizationId, templateType);
      if (!template) {
        return { success: false, error: 'Template not found' };
      }

      const { subject, htmlContent, textContent } = this.renderTemplate(template, variables);

      // Create log (pending)
      const created = await this.createEmailLog({
        organization_id: organizationId,
        recipient_email: recipientEmail,
        template_type: templateType,
        subject: subject,
        status: 'pending',
        metadata: JSON.stringify({ template_id: template.id }),
      });
      emailLogId = created.id;

      // Send via configured provider
      let sendResult: { provider: 'sendgrid' | 'smtp'; messageId?: string };
      if (process.env.SENDGRID_API_KEY) {
        const replyTo = options?.replyTo || process.env.EMAIL_REPLY_TO;
        sendResult = await this.sendViaSendGrid({
          to: recipientEmail,
          subject,
          html: htmlContent,
          text: textContent,
          replyTo,
          fromEmailOverride: options?.fromEmailOverride,
        });
      } else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        const replyTo = options?.replyTo || process.env.EMAIL_REPLY_TO;
        sendResult = await this.sendViaSmtp({ to: recipientEmail, subject, html: htmlContent, text: textContent, replyTo });
      } else if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
        const replyTo = options?.replyTo || process.env.EMAIL_REPLY_TO;
        sendResult = await this.sendViaGmailSmtp({ to: recipientEmail, subject, html: htmlContent, text: textContent, replyTo });
      } else {
        // In dev/test, allow "no-op" send so the app can still be exercised.
        if (process.env.NODE_ENV !== 'production') {
          sendResult = { provider: 'smtp' };
        } else {
          throw new Error('No email provider configured (set SENDGRID_* or SMTP_*)');
        }
      }

      logMeta.provider = sendResult.provider;
      logMeta.messageId = sendResult.messageId;

      if (emailLogId) {
        await this.updateEmailLog(emailLogId, {
          status: 'sent',
          metadata: JSON.stringify({ ...logMeta, template_id: template.id }),
        });
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (emailLogId) {
        try {
          await this.updateEmailLog(emailLogId, {
            status: 'failed',
            error_message: message,
            metadata: Object.keys(logMeta).length ? JSON.stringify(logMeta) : null,
          });
        } catch {
          // swallow secondary logging errors
        }
      } else {
        // best-effort: if we failed before creating the pending log, create a failed log entry
        try {
          await this.createEmailLog({
            organization_id: organizationId,
            recipient_email: recipientEmail,
            template_type: templateType,
            subject: 'Failed to send',
            status: 'failed',
            error_message: message,
          });
        } catch {
          // swallow
        }
      }

      return { success: false, error: message };
    }
  }

  /**
   * Send an Auth.js / NextAuth magic link email (no templates/logging).
   * 3-line max: Minimal auth email sender for passwordless sign-in.
   */
  async sendAuthMagicLinkEmail(args: { to: string; url: string }): Promise<void> {
    const subject = 'Sign in to BlessBox';
    const html = `
      <p>Click the link below to sign in to BlessBox:</p>
      <p><a href="${args.url}">Sign in</a></p>
      <p>If you did not request this email, you can safely ignore it.</p>
    `;
    const text = `Sign in to BlessBox: ${args.url}\n\nIf you did not request this email, you can ignore it.`;

    if (process.env.SENDGRID_API_KEY) {
      await this.sendViaSendGrid({ to: args.to, subject, html, text, replyTo: process.env.EMAIL_REPLY_TO });
      return;
    }

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      await this.sendViaSmtp({ to: args.to, subject, html, text, replyTo: process.env.EMAIL_REPLY_TO });
      return;
    }

    if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
      await this.sendViaGmailSmtp({ to: args.to, subject, html, text, replyTo: process.env.EMAIL_REPLY_TO });
      return;
    }

    if (process.env.NODE_ENV !== 'production') {
      // Dev/test: allow flows without email provider configured.
      return;
    }

    throw new Error('No email provider configured (set SENDGRID_* or SMTP_* or GMAIL_*)');
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

  /**
   * Ensure our default templates exist for this organization.
   * Safe to call on every request.
   */
  async ensureDefaultTemplates(organizationId: string): Promise<void> {
    const result = await this.db.execute({
      sql: 'SELECT COUNT(*) as count FROM email_templates WHERE organization_id = ? AND is_active = 1',
      args: [organizationId],
    });
    const count = Number((result.rows?.[0] as any)?.count || 0);
    if (count > 0) return;

    // Minimal set required by current app flows (registration + admin notifications)
    const essentials: Array<Pick<EmailTemplate, 'template_type' | 'subject' | 'html_content' | 'text_content'>> = [
      {
        template_type: 'registration_confirmation',
        subject: 'Registration Confirmed - {{organization_name}}',
        html_content: `
          <h2>Registration Confirmed</h2>
          <p>Hello {{recipient_name}},</p>
          <p>Thank you for registering with <strong>{{organization_name}}</strong>.</p>
          <p>Registration ID: <strong>{{registration_id}}</strong></p>
          <p>Entry point: {{qr_code_label}}</p>
        `,
        text_content: 'Thank you for registering with {{organization_name}}. Registration ID: {{registration_id}}',
      },
      {
        template_type: 'admin_notification',
        subject: 'New event activity - {{organization_name}}',
        html_content: `
          <h2>Admin Notification</h2>
          <p>Organization: {{organization_name}}</p>
          <p>Event: {{event_type}}</p>
        `,
        text_content: 'Admin notification for {{organization_name}}: {{event_type}}',
      },
    ];

    for (const t of essentials) {
      await this.createTemplate({
        organization_id: organizationId,
        template_type: t.template_type,
        subject: t.subject,
        html_content: t.html_content,
        text_content: t.text_content,
        is_active: true,
      });
    }
  }
}

