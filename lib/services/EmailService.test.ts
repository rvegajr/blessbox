import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const sendgridSetApiKey = vi.fn();
const sendgridSend = vi.fn();
const sendgridSetDefaultRequest = vi.fn();
vi.mock('@sendgrid/mail', () => ({
  default: {
    setApiKey: (...args: any[]) => sendgridSetApiKey(...args),
    send: (...args: any[]) => sendgridSend(...args),
    client: {
      setDefaultRequest: (...args: any[]) => sendgridSetDefaultRequest(...args),
    },
  },
}));

const smtpSendMail = vi.fn();
const createTransport = vi.fn((..._args: any[]) => ({ sendMail: smtpSendMail }));
vi.mock('nodemailer', () => ({
  default: { createTransport: (...args: any[]) => createTransport(...args) },
}));

vi.mock('../db', () => ({ getDbClient: vi.fn() }));

describe('EmailService', () => {
  let mockDb: any;
  let EmailService: typeof import('./EmailService').EmailService;
  let getDbClient: any;

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.stubEnv('NODE_ENV', 'test');

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

  it('sends via the Noctusoft gateway relay when the deploy key is set', async () => {
    process.env.NOCTUSOFT_DEPLOY_KEY = 'deploy-test';
    process.env.SENDGRID_FROM_EMAIL = 'from@example.com';
    process.env.SENDGRID_FROM_NAME = 'Test';
    delete process.env.SENDGRID_API_KEY;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true, status: 202, headers: { get: (k: string) => (k === 'x-message-id' ? 'm-1' : null) },
    });
    vi.stubGlobal('fetch', fetchMock);

    const service = new EmailService();
    const res = await service.sendEmail('org-1', 'to@example.com', 'admin_notification', {
      recipient_name: 'Ada',
      organization_name: 'Org',
      event_type: 'test',
    });

    expect(res.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.sendgrid.noctusoft.com/v3/mail/send');
    expect(init.headers.Authorization).toBe('Bearer deploy-test');
    expect(sendgridSend).not.toHaveBeenCalled();
    expect(createTransport).not.toHaveBeenCalled();
  });

  it('tolerates env-var pollution: deploy key with trailing newline + quoted from-email', async () => {
    // Vercel pulls + .env files commonly produce values like "key\n" or quoted "noreply@x.com".
    // getEnv() sanitizes these so the relay gets a clean Bearer + from-fields.
    process.env.NOCTUSOFT_DEPLOY_KEY = 'deploy-key-value\n';
    process.env.SENDGRID_FROM_EMAIL = '"noreply@blessbox.org"\n';
    process.env.SENDGRID_FROM_NAME = '  BlessBox Support  \r\n';
    delete process.env.SENDGRID_API_KEY;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true, status: 202, headers: { get: () => 'm-2' },
    });
    vi.stubGlobal('fetch', fetchMock);

    const service = new EmailService();
    const res = await service.sendEmail('org-1', 'to@example.com', 'admin_notification', {
      recipient_name: 'Ada',
      organization_name: 'Org',
      event_type: 'test',
    });

    expect(res.success).toBe(true);
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe('Bearer deploy-key-value');
    const body = JSON.parse(init.body);
    expect(body.from.email).toBe('noreply@blessbox.org');
    expect(body.from.name).toBe('BlessBox Support');
  });

  it('routes through SendGrid-compatible relay (v3 protocol + Bearer) when SENDGRID_API_URL is set', async () => {
    // Production scenario: SendGrid key has IP-allowlist; Vercel egress isn't
    // listed. The relay (api.sendgrid.noctusoft.com) is — its IP IS allowlisted.
    // Same v3 protocol, same Bearer auth — only the host changes.
    process.env.NOCTUSOFT_DEPLOY_KEY = 'SG-deploy-key';
    process.env.SENDGRID_FROM_EMAIL = 'noreply@blessbox.org';
    process.env.SENDGRID_FROM_NAME = 'BlessBox NoReply';
    process.env.SENDGRID_API_URL = 'https://api.sendgrid.noctusoft.com';
    delete process.env.SENDGRID_API_KEY;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 202,
      headers: { get: (k: string) => (k === 'x-message-id' ? 'm-relay' : null) },
    });
    vi.stubGlobal('fetch', fetchMock);

    const service = new EmailService();
    const res = await service.sendEmail('org-1', 'to@example.com', 'admin_notification', {
      recipient_name: 'Ada',
      organization_name: 'Org',
      event_type: 'test',
    });

    expect(res.success).toBe(true);
    // SDK should NOT have been called — relay path uses raw fetch.
    expect(sendgridSend).not.toHaveBeenCalled();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.sendgrid.noctusoft.com/v3/mail/send');
    expect(init.headers.Authorization).toBe('Bearer SG-deploy-key');
    const body = JSON.parse(init.body);
    expect(body.from.email).toBe('noreply@blessbox.org');
    expect(body.from.name).toBe('BlessBox NoReply');
    expect(body.personalizations[0].to[0].email).toBe('to@example.com');

    vi.unstubAllGlobals();
    delete process.env.SENDGRID_API_URL;
  });

  it('defaults to the gateway relay host when SENDGRID_API_URL is unset', async () => {
    process.env.NOCTUSOFT_DEPLOY_KEY = 'sg-direct-deploy';
    process.env.SENDGRID_FROM_EMAIL = 'noreply@blessbox.org';
    delete process.env.SENDGRID_API_KEY;
    delete process.env.SENDGRID_API_URL;
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;

    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true, status: 202, headers: { get: () => 'm-direct' },
    });
    vi.stubGlobal('fetch', fetchMock);

    const service = new EmailService();
    await service.sendEmail('org-1', 'to@example.com', 'admin_notification', {
      recipient_name: 'Ada',
      organization_name: 'Org',
      event_type: 'test',
    });

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.sendgrid.noctusoft.com/v3/mail/send');
    expect(sendgridSend).not.toHaveBeenCalled();
  });

  it('fails in production if no provider is configured', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    delete process.env.NOCTUSOFT_DEPLOY_KEY;
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

