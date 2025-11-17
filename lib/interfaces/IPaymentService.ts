// IPaymentService - Interface Segregation Principle Compliant
// Single responsibility: Payment processing only (no coupons, no subscriptions)

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

export interface IPaymentService {
  // Payment processing
  createPaymentIntent(amount: number, currency: string, metadata?: Record<string, any>): Promise<PaymentIntent>;
  processPayment(sourceId: string, amount: number, currency: string, customerId?: string): Promise<PaymentResult>;
  refundPayment(paymentId: string, amount?: number, reason?: string): Promise<RefundResult>;
  
  // Customer management
  createCustomer(email: string, name?: string): Promise<{ id: string; squareCustomerId: string }>;
  getCustomer(customerId: string): Promise<any>;
  
  // Subscription processing (delegates to ISubscriptionService)
  createSubscription(customerId: string, planId: string, cardId: string): Promise<{ id: string; squareSubscriptionId: string }>;
}

