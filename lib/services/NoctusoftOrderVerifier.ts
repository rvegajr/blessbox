/**
 * NoctusoftOrderVerifier — IOrderVerifier backed by the Noctusoft gateway
 * (a Square API drop-in proxy that holds the upstream credentials/credits).
 *
 * Pull-verifies an order via the Square Retrieve Order endpoint through the proxy
 * using the Vercel OIDC identity (or NOCTUSOFT_DEPLOY_KEY fallback). Mirrors the base-URL/header pattern in
 * NoctusoftCheckoutService.ts.
 *
 * NOTE: the live docs (docs.api.noctusoft.com) are a JS-rendered SPA that could
 * not be scraped; the exact path is the Square drop-in `GET /v2/orders/{id}`.
 * Confirm against the gateway and adjust the mapping if the relay wraps the
 * payload. The interface (IOrderVerifier) is unchanged either way.
 */
import type { IOrderVerifier, VerifiedOrder } from '@/lib/interfaces/IOrderVerifier';
import { squareEnv, squareGatewayBaseUrl, gatewayAuthToken } from '@/lib/services/gatewayConfig';

const SQUARE_ENV = squareEnv();
const PROXY_BASE = squareGatewayBaseUrl(SQUARE_ENV);

/** Map a Square order state to our coarse paid/unpaid status. */
function mapState(state: string | undefined): VerifiedOrder['status'] {
  switch ((state || '').toUpperCase()) {
    case 'COMPLETED':
      return 'PAID';
    case 'CANCELED':
      return 'CANCELED';
    case 'OPEN':
    case 'DRAFT':
      return 'PENDING';
    default:
      return 'FAILED';
  }
}

export class NoctusoftOrderVerifier implements IOrderVerifier {
  async verifyOrder(orderId: string): Promise<VerifiedOrder | null> {
    const authToken = await gatewayAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Test-Store': 'blessbox',
      'X-Square-Env': SQUARE_ENV,
    };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    let res: Response;
    try {
      res = await fetch(`${PROXY_BASE}/v2/orders/${encodeURIComponent(orderId)}`, { method: 'GET', headers });
    } catch (err) {
      console.error('[NoctusoftOrderVerifier] fetch failed:', err);
      return null;
    }

    if (res.status === 404) return null;
    if (!res.ok) {
      console.error(`[NoctusoftOrderVerifier] verify failed [${res.status}]`);
      return null;
    }

    const data = await res.json().catch(() => null);
    const order = data?.order ?? data;
    if (!order?.id) return null;

    const totalMoney = order.total_money ?? order.totalMoney ?? {};
    // Square Money.amount is in the smallest currency unit (cents) as integer/bigint.
    const amountCents = Number(totalMoney.amount ?? 0);
    // Catalog plan id — prefer order metadata, else first line item's catalog ref.
    const planType = String(
      order.metadata?.plan ?? order.line_items?.[0]?.catalog_object_id ?? order.line_items?.[0]?.name ?? '',
    );

    return {
      orderId: String(order.id),
      status: mapState(order.state),
      amountCents,
      currency: String(totalMoney.currency ?? 'USD'),
      planType,
    };
  }
}
