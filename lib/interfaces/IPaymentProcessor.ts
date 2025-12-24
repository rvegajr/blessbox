import type { PaymentIntent, PaymentResult, RefundResult } from './IPaymentService';

// IPaymentProcessor - ISP compliant
// Single responsibility: take a payment token and charge/refund money
export interface IPaymentProcessor {
  createPaymentIntent(amount: number, currency: string, metadata?: Record<string, any>): Promise<PaymentIntent>;
  processPayment(sourceId: string, amount: number, currency: string, customerId?: string): Promise<PaymentResult>;
  refundPayment(paymentId: string, amount?: number, reason?: string): Promise<RefundResult>;
}

