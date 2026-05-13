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
 */

const IS_PRODUCTION = process.env.SQUARE_ENVIRONMENT === 'production';

const PROXY_BASE = IS_PRODUCTION
  ? 'https://connect.squareup.noctusoft.com'
  : 'https://connect.squareupsandbox.noctusoft.com';

const SQUARE_ENV = IS_PRODUCTION ? 'production' : 'sandbox';

export interface NoctusoftCheckoutParams {
  plan: string;      // catalog plan identifier, e.g. "single-org"
  email: string;     // customer email
  returnUrl: string; // Square redirects here after payment
}

export interface NoctusoftCheckoutResult {
  checkoutUrl: string;
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

  const res = await fetch(`${PROXY_BASE}/v2/checkout`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      plan: params.plan,
      email: params.email,
      returnUrl: params.returnUrl,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '(empty)');
    throw new Error(`Noctusoft checkout failed [${res.status}]: ${body}`);
  }

  const data = await res.json();
  if (!data?.checkoutUrl) {
    throw new Error('Noctusoft returned no checkoutUrl');
  }
  return { checkoutUrl: data.checkoutUrl };
}
