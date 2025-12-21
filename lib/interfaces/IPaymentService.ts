// Payment types shared by payment-related interfaces.
// NOTE: The previous `IPaymentService` interface was too broad (it included customer + subscription concerns).
// For ISP compliance, use `IPaymentProcessor` (and add separate interfaces if/when needed).

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  clientSecret?: string;
  createdAt: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  error?: string;
  amount?: number;
  currency?: string;
  squarePaymentId?: string;
  squareCustomerId?: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  error?: string;
  amount?: number;
  squareRefundId?: string;
}

// Intentionally no exported interface here; see `IPaymentProcessor`.

