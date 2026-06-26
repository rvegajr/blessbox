import { describe, it, expect, vi, afterEach } from 'vitest';
import { sendViaGatewayEmail } from './gatewayEmail';

const from = { email: 'no-reply@blessbox.org', name: 'BlessBox' };

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('sendViaGatewayEmail', () => {
  it('posts to the Noctusoft relay using the gateway deploy key as Bearer', async () => {
    vi.stubEnv('NOCTUSOFT_DEPLOY_KEY', 'deploy_123');
    vi.stubEnv('SENDGRID_API_URL', '');
    const fetchMock = vi.fn(async () => new Response(null, { status: 202, headers: { 'x-message-id': 'm1' } }));
    vi.stubGlobal('fetch', fetchMock);

    const res = await sendViaGatewayEmail({ to: 'a@b.com', subject: 'Hi', html: '<p>x</p>', from });
    expect(res.success).toBe(true);
    expect(res.messageId).toBe('m1');
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.sendgrid.noctusoft.com/v3/mail/send');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer deploy_123');
  });

  it('returns an error (does not throw) when no gateway key is configured', async () => {
    vi.stubEnv('NOCTUSOFT_DEPLOY_KEY', '');
    vi.stubEnv('SENDGRID_API_KEY', '');
    const res = await sendViaGatewayEmail({ to: 'a@b.com', subject: 'Hi', html: 'x', from });
    expect(res.success).toBe(false);
  });

  it('fails gracefully on a non-2xx relay response', async () => {
    vi.stubEnv('NOCTUSOFT_DEPLOY_KEY', 'deploy_123');
    vi.stubGlobal('fetch', vi.fn(async () => new Response('bad', { status: 500, statusText: 'Server Error' })));
    const res = await sendViaGatewayEmail({ to: 'a@b.com', subject: 'Hi', html: 'x', from });
    expect(res.success).toBe(false);
    expect(res.error).toContain('500');
  });
});
