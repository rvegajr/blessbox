import { describe, it, expect, beforeEach, vi } from 'vitest';

const sendgridSetApiKey = vi.fn();
const sendgridSend = vi.fn();
vi.mock('@sendgrid/mail', () => ({
  default: {
    setApiKey: (...args: any[]) => sendgridSetApiKey(...args),
    send: (...args: any[]) => sendgridSend(...args),
  },
}));

const smtpSendMail = vi.fn();
const createTransport = vi.fn(() => ({ sendMail: smtpSendMail }));
vi.mock('nodemailer', () => ({
  default: { createTransport: (...args: any[]) => createTransport(...args) },
}));

vi.mock('../db', () => ({ getDbClient: vi.fn() }));

describe('EmailService', () => {
  let mockDb: any;
  let EmailService: typeof import('./EmailService').EmailService;
  let getDbClient: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.NODE_ENV = 'test';

    mockDb = {
      execute: vi.fn(async ({ sql, args }: { sql: string; args?: any[] }) => {
        // EnsureDefaultTemplates: count
        if (/SELECT COUNT\(\*\) as count FROM email_templates/i.test(sql)) {
          return { rows: [{ count: 0 }] };
        }

        // Inserts are no-ops
        if (/INSERT INTO email_templates/i.test(sql)) {
          return { rows: [], rowsAffected: 1 };
        }
        if (/INSERT INTO email_logs/i.test(sql)) {
          return { rows: [], rowsAffected: 1 };
        }
        if (/UPDATE email_logs/i.test(sql)) {
          return { rows: [], rowsAffected: 1 };
        }

        // Template lookup
        if (/SELECT \* FROM email_templates/i.test(sql)) {
          const templateType = args?.[1];
          return {
            rows: [
              {
                id: 'tmpl-1',
                organization_id: args?.[0],
                template_type: templateType,
                subject: 'Hello {{recipient_name}}',
                html_content: '<p>Hello {{recipient_name}}</p>',
                text_content: 'Hello {{recipient_name}}',
                is_active: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ],
          };
        }

        // Fallback
        return { rows: [] };
      }),
    };

    ({ getDbClient } = await import('../db'));
    (getDbClient as any).mockReturnValue(mockDb);
    ({ EmailService } = await import('./EmailService'));
  });

  it('uses SendGrid when SENDGRID_API_KEY is set', async () => {
    process.env.SENDGRID_API_KEY = 'sg-test';
    process.env.SENDGRID_FROM_EMAIL = 'from@example.com';
    process.env.SENDGRID_FROM_NAME = 'Test';
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;

    sendgridSend.mockResolvedValueOnce([{ headers: { 'x-message-id': 'm-1' } }]);

    const service = new EmailService();
    const res = await service.sendEmail('org-1', 'to@example.com', 'admin_notification', {
      recipient_name: 'Ada',
      organization_name: 'Org',
      event_type: 'test',
    });

    expect(res.success).toBe(true);
    expect(sendgridSetApiKey).toHaveBeenCalledWith('sg-test');
    expect(sendgridSend).toHaveBeenCalled();
    expect(createTransport).not.toHaveBeenCalled();
  });

  it('uses SMTP when SendGrid is not configured but SMTP is', async () => {
    delete process.env.SENDGRID_API_KEY;
    delete process.env.SENDGRID_FROM_EMAIL;
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_USER = 'user';
    process.env.SMTP_PASS = 'pass';
    process.env.SMTP_FROM = 'from@example.com';

    smtpSendMail.mockResolvedValueOnce({ messageId: 'smtp-1' });

    const service = new EmailService();
    const res = await service.sendEmail('org-1', 'to@example.com', 'admin_notification', {
      recipient_name: 'Ada',
      organization_name: 'Org',
      event_type: 'test',
    });

    expect(res.success).toBe(true);
    expect(createTransport).toHaveBeenCalled();
    expect(smtpSendMail).toHaveBeenCalled();
    expect(sendgridSend).not.toHaveBeenCalled();
  });

  it('fails in production if no provider is configured', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.SENDGRID_API_KEY;
    delete process.env.SENDGRID_FROM_EMAIL;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;

    const service = new EmailService();
    const res = await service.sendEmail('org-1', 'to@example.com', 'admin_notification', {
      recipient_name: 'Ada',
      organization_name: 'Org',
      event_type: 'test',
    });

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/No email provider configured/i);
  });
});

