/**
 * NoctusoftCheckoutService
 *
 * Wraps the Noctusoft Square proxy to create hosted checkout sessions.
 * BlessBox uses catalog-based plans (e.g. "single-org") so Square handles
 * the payment UI and subscription creation on its hosted page. This avoids
 * PAN_FAILURE errors that occur when a test card is used in the wrong env.
 *
 * Proxy docs: https://docs.api.noctusoft.com
 * Routing headers: X-Test-Store, X-Square-Env
 * Auth: NOCTUSOFT_DEPLOY_KEY env var (Bearer token)
 *
 * POST /checkout body: { userId, email, plan, redirectUrl, idempotencyKey }
 * Response:           { url, orderId }
 */

const IS_PRODUCTION = process.env.SQUARE_ENVIRONMENT === 'production';

const PROXY_BASE = IS_PRODUCTION
  ? 'https://connect.squareup.noctusoft.com'
  : 'https://connect.squareupsandbox.noctusoft.com';

const SQUARE_ENV = IS_PRODUCTION ? 'production' : 'sandbox';

export interface NoctusoftCheckoutParams {
  plan: string;       // catalog plan identifier, e.g. "single-org"
  userId: string;     // org or user ID — used for idempotent customer creation
  email: string;      // customer email
  redirectUrl: string; // Square redirects here after payment
  sessionId?: string;  // P0 Fix: Optional session ID for stable idempotency key
}

export interface NoctusoftCheckoutResult {
  checkoutUrl: string;
  orderId: string;
}

export async function createNoctusoftCheckoutSession(
  params: NoctusoftCheckoutParams
): Promise<NoctusoftCheckoutResult> {
  const deployKey = process.env.NOCTUSOFT_DEPLOY_KEY;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Test-Store': 'blessbox',
    'X-Square-Env': SQUARE_ENV,
  };
  if (deployKey) {
    headers['Authorization'] = `Bearer ${deployKey}`;
  }

  // P0 Fix: Stable idempotency key per (org, plan, session) — no timestamp
  // If sessionId is not provided, use a hash of userId+plan for backwards compat
  const sessionPart = params.sessionId || `default-${params.userId}`;
  const idempotencyKey = `blessbox-checkout-${params.userId}-${params.plan}-${sessionPart}`;

  const res = await fetch(`${PROXY_BASE}/checkout`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      userId: params.userId,
      email: params.email,
      plan: params.plan,
      redirectUrl: params.redirectUrl,
      idempotencyKey,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '(empty)');
    throw new Error(`Noctusoft checkout failed [${res.status}]: ${body}`);
  }

  const data = await res.json();
  if (!data?.url) {
    throw new Error(`Noctusoft returned no checkout URL: ${JSON.stringify(data)}`);
  }
  return { checkoutUrl: data.url, orderId: data.orderId };
}
