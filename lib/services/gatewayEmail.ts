/**
 * sendViaGatewayEmail — single email egress through the Noctusoft SendGrid relay
 * (a SendGrid /v3/mail/send drop-in that holds the real SendGrid key). The app
 * authenticates with the gateway deploy key only; it holds NO SENDGRID_API_KEY.
 */
import { sendgridRelayBaseUrl, gatewayAuthToken } from './gatewayConfig';

export interface GatewayEmailFrom {
  email: string;
  name: string;
}

export interface GatewayEmailAttachment {
  filename: string;
  content: string; // base64
  type: string;
  disposition?: 'attachment' | 'inline';
  contentId?: string;
}

export interface GatewayEmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from: GatewayEmailFrom;
  replyTo?: string;
  attachments?: GatewayEmailAttachment[];
}

export interface GatewayEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendViaGatewayEmail(msg: GatewayEmailMessage): Promise<GatewayEmailResult> {
  const base = sendgridRelayBaseUrl();
  // The relay holds the real SendGrid key; the app authenticates with its
  // Vercel OIDC identity (preferred) or the NOCTUSOFT_DEPLOY_KEY fallback.
  const key = await gatewayAuthToken();
  if (!key) {
    return { success: false, error: 'Email gateway not configured (no Vercel OIDC identity and NOCTUSOFT_DEPLOY_KEY missing)' };
  }

  try {
    const res = await fetch(`${base}/v3/mail/send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'X-Test-Store': 'blessbox',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: msg.to }] }],
        from: msg.from,
        ...(msg.replyTo ? { reply_to: { email: msg.replyTo } } : {}),
        subject: msg.subject,
        content: [
          ...(msg.text ? [{ type: 'text/plain', value: msg.text }] : []),
          { type: 'text/html', value: msg.html },
        ],
        ...(msg.attachments?.length
          ? {
              attachments: msg.attachments.map((a) => ({
                content: a.content,
                filename: a.filename,
                type: a.type,
                ...(a.disposition ? { disposition: a.disposition } : {}),
                ...(a.contentId ? { content_id: a.contentId } : {}),
              })),
            }
          : {}),
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return { success: false, error: `${res.status} ${res.statusText}${detail ? `: ${detail.slice(0, 300)}` : ''}` };
    }
    return { success: true, messageId: res.headers.get('x-message-id') || undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Email send failed' };
  }
}
