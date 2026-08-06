import type { IOrderVerifier, VerifiedOrder } from '@/lib/interfaces/IOrderVerifier';

/**
 * In-memory IOrderVerifier for tests — a real implementation seeded from a Map,
 * NOT a vi.mock, so the provisioning seam is exercised by real code paths.
 */
export class InMemoryOrderVerifier implements IOrderVerifier {
  private readonly orders = new Map<string, VerifiedOrder>();

  seed(order: VerifiedOrder): this {
    this.orders.set(order.orderId, order);
    return this;
  }

  async verifyOrder(orderId: string): Promise<VerifiedOrder | null> {
    return this.orders.get(orderId) ?? null;
  }
}
