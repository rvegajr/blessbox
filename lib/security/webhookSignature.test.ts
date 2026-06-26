import { describe, it, expect } from 'vitest';
import { createHmac } from 'crypto';
import { verifyNoctusoftWebhook } from './webhookSignature';

const SECRET = 'whsec_test';
const BODY = JSON.stringify({ type: 'payment.created', data: { object: { id: 'p1' } } });
const goodSig = createHmac('sha256', SECRET).update(BODY).digest('hex');

describe('verifyNoctusoftWebhook (fail-closed)', () => {
  it('REJECTS when the secret is not configured (no fail-open)', () => {
    const r = verifyNoctusoftWebhook({ rawBody: BODY, signature: goodSig, secret: undefined });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(401);
  });

  it('rejects when the signature header is missing', () => {
    const r = verifyNoctusoftWebhook({ rawBody: BODY, signature: null, secret: SECRET });
    expect(r.ok).toBe(false);
  });

  it('rejects an invalid signature', () => {
    const r = verifyNoctusoftWebhook({ rawBody: BODY, signature: 'deadbeef', secret: SECRET });
    expect(r.ok).toBe(false);
  });

  it('accepts a valid HMAC signature', () => {
    const r = verifyNoctusoftWebhook({ rawBody: BODY, signature: goodSig, secret: SECRET });
    expect(r.ok).toBe(true);
  });
});
