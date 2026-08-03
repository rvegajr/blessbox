/**
 * sendViaGatewayEmail — single email egress through the Noctusoft relay's
 * provider-agnostic native `/email/send` endpoint. The relay holds the upstream
 * email credential and picks the provider (SendGrid/Resend) internally, so the
 * app never learns which one sent the mail. The app authenticates with its
 * Vercel OIDC identity (or the NOCTUSOFT_DEPLOY_KEY fallback) and holds no
 * provider key.
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
    const res = await fetch(`${base}/email/send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'X-Test-Store': 'blessbox',
      },
      body: JSON.stringify({
        to: msg.to,
        subject: msg.subject,
        html: msg.html,
        ...(msg.text ? { text: msg.text } : {}),
        from: msg.from.email,
        fromName: msg.from.name,
        ...(msg.replyTo ? { replyTo: msg.replyTo } : {}),
        // Relay's native /email/send accepts the same attachment shape.
        ...(msg.attachments?.length ? { attachments: msg.attachments } : {}),
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return { success: false, error: `${res.status} ${res.statusText}${detail ? `: ${detail.slice(0, 300)}` : ''}` };
    }
    const data = (await res.json().catch(() => null)) as { email?: { messageId?: string } } | null;
    return { success: true, messageId: data?.email?.messageId };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Email send failed' };
  }
}
