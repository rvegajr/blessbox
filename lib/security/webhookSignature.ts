/**
 * Fail-closed HMAC verification for the Noctusoft relay webhook.
 *
 * Previously the route warned and CONTINUED when NOCTUSOFT_WEBHOOK_SECRET was
 * unset — a fail-open hole letting anyone post subscription state changes. This
 * helper rejects unless a secret is configured AND the signature verifies.
 */
import { createHmac, timingSafeEqual } from 'crypto';

export interface WebhookAuthInput {
  rawBody: string;
  signature: string | null;
  secret: string | undefined;
}

export type WebhookAuthResult = { ok: true } | { ok: false; status: 401; error: string };

export function verifyNoctusoftWebhook(input: WebhookAuthInput): WebhookAuthResult {
  if (!input.secret) {
    return { ok: false, status: 401, error: 'Webhook secret not configured' };
  }
  if (!input.signature) {
    return { ok: false, status: 401, error: 'Missing signature' };
  }
  if (!hmacMatches(input.rawBody, input.signature, input.secret)) {
    return { ok: false, status: 401, error: 'Invalid signature' };
  }
  return { ok: true };
}

function hmacMatches(payload: string, signature: string, secret: string): boolean {
  try {
    const expected = createHmac('sha256', secret).update(payload).digest('hex');
    const sigBuf = Buffer.from(signature, 'hex');
    const expBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expBuf.length) return false;
    return timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}
