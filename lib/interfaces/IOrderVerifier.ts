/**
 * IOrderVerifier — narrow seam (ISP) for confirming a checkout order was paid.
 *
 * Provisioning depends ONLY on this contract, never on the Square SDK or the
 * Noctusoft gateway response shape. Backing implementations may pull the order
 * from the gateway or read a webhook-written record — both satisfy this.
 */

export interface VerifiedOrder {
  orderId: string;
  status: 'PAID' | 'PENDING' | 'FAILED' | 'CANCELED';
  amountCents: number;
  currency: string;
  /** Catalog plan id the order was for (e.g. 'single-org'). */
  planType: string;
}

export interface IOrderVerifier {
  /** Return the verified order, or null if unknown/not found. Never throws on "not found". */
  verifyOrder(orderId: string): Promise<VerifiedOrder | null>;
}
