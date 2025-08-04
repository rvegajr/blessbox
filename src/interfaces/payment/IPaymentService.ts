// 💰 PAYMENT SERVICE INTERFACE - PURE ISP FINANCIAL BLISS! ✨
// REAL MONEY FLOW! NO MOCKS! SQUARE INTEGRATION POWER! 🚀

export interface IPaymentService {
  // 🎯 Create payment intent for subscription
  createPaymentIntent(data: PaymentIntentData): Promise<PaymentIntentResult>;
  
  // ✅ Process payment completion
  processPayment(paymentToken: string, paymentData: PaymentData): Promise<PaymentResult>;
  
  // 🔍 Get payment status
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
  
  // 🔄 Process refund
  processRefund(paymentId: string, amount?: number): Promise<RefundResult>;
  
  // 💳 Get payment methods for customer
  getCustomerPaymentMethods(customerId: string): Promise<PaymentMethod[]>;
  
  // 🎫 Apply coupon code
  validateCoupon(couponCode: string, planType: string): Promise<CouponResult>;
}

export interface PaymentIntentData {
  organizationId: string;
  planType: 'standard' | 'enterprise';
  amount: number; // in cents
  currency: string;
  customerEmail: string;
  couponCode?: string;
  billingAddress?: BillingAddress;
}

export interface PaymentData {
  organizationId: string;
  planType: 'standard' | 'enterprise';
  amount: number;
  currency: string;
  paymentMethodId: string;
  billingAddress: BillingAddress;
  couponCode?: string;
}

export interface BillingAddress {
  firstName: string;
  lastName: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface PaymentIntentResult {
  success: boolean;
  clientSecret?: string;
  paymentIntentId?: string;
  amount?: number;
  currency?: string;
  message: string;
  error?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  transactionId?: string;
  amount?: number;
  currency?: string;
  status?: 'completed' | 'pending' | 'failed';
  receiptUrl?: string;
  message: string;
  error?: string;
}

export interface PaymentStatus {
  paymentId: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  amount: number;
  currency: string;
  createdAt: Date;
  completedAt?: Date;
  failureReason?: string;
  receiptUrl?: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  amount?: number;
  status?: 'pending' | 'completed' | 'failed';
  message: string;
  error?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  createdAt: Date;
}

export interface CouponResult {
  valid: boolean;
  couponCode?: string;
  discountType?: 'percentage' | 'fixed_amount';
  discountValue?: number;
  discountAmount?: number; // calculated discount in cents
  finalAmount?: number; // final amount after discount
  expiresAt?: Date;
  message: string;
  error?: string;
}

// Square-specific types
export interface SquarePaymentRequest {
  sourceId: string;
  amountMoney: {
    amount: number;
    currency: string;
  };
  idempotencyKey: string;
  buyerEmailAddress?: string;
  billingAddress?: SquareAddress;
  note?: string;
}

export interface SquareAddress {
  addressLine1?: string;
  addressLine2?: string;
  locality?: string;
  administrativeDistrictLevel1?: string;
  postalCode?: string;
  country?: string;
  firstName?: string;
  lastName?: string;
}

export interface SquarePaymentResponse {
  payment?: {
    id: string;
    status: string;
    amountMoney: {
      amount: number;
      currency: string;
    };
    receiptUrl?: string;
    createdAt: string;
    updatedAt: string;
  };
  errors?: Array<{
    category: string;
    code: string;
    detail: string;
  }>;
}