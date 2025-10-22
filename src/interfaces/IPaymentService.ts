/**
 * Payment Service Interface
 * 
 * Defines the contract for payment processing and subscription management operations
 * following Interface Segregation Principle (ISP)
 */

export interface PaymentIntent {
  id: string;
  organizationId: string;
  amount: number;
  currency: string;
  planType: PlanType;
  status: PaymentStatus;
  clientSecret: string;
  createdAt: string;
  expiresAt: string;
}

export interface PaymentData {
  paymentIntentId: string;
  paymentMethodId: string;
  billingDetails: BillingDetails;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  success: boolean;
  paymentId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  transactionId?: string;
  receiptUrl?: string;
  error?: string;
}

export interface BillingDetails {
  name: string;
  email: string;
  phone?: string;
  address: Address;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CouponValidation {
  isValid: boolean;
  discount: number;
  discountType: 'percentage' | 'fixed';
  description?: string;
  expiresAt?: string;
  error?: string;
}

export interface Subscription {
  id: string;
  organizationId: string;
  planType: PlanType;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  trialEnd?: string;
  price: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentServiceResult<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export type PlanType = 'free' | 'standard' | 'enterprise';
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'cancelled' | 'refunded';
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'past_due' | 'trialing';

/**
 * Payment Service Interface
 * 
 * Handles all payment-related operations including processing,
 * subscription management, and billing operations.
 */
export interface IPaymentService {
  // Payment Processing
  createPaymentIntent(orgId: string, planType: PlanType, couponCode?: string): Promise<PaymentServiceResult<PaymentIntent>>;
  processPayment(paymentData: PaymentData): Promise<PaymentServiceResult<PaymentResult>>;
  confirmPayment(paymentIntentId: string): Promise<PaymentServiceResult<PaymentResult>>;
  cancelPayment(paymentIntentId: string): Promise<PaymentServiceResult<void>>;
  
  // Subscription Management
  createSubscription(orgId: string, paymentResult: PaymentResult): Promise<PaymentServiceResult<Subscription>>;
  updateSubscription(subscriptionId: string, updates: SubscriptionUpdate): Promise<PaymentServiceResult<Subscription>>;
  cancelSubscription(subscriptionId: string, immediately?: boolean): Promise<PaymentServiceResult<Subscription>>;
  reactivateSubscription(subscriptionId: string): Promise<PaymentServiceResult<Subscription>>;
  getSubscription(subscriptionId: string): Promise<PaymentServiceResult<Subscription>>;
  getOrganizationSubscription(orgId: string): Promise<PaymentServiceResult<Subscription>>;
  
  // Billing & Invoicing
  createInvoice(subscriptionId: string): Promise<PaymentServiceResult<Invoice>>;
  getInvoices(orgId: string, filters?: InvoiceFilters): Promise<PaymentServiceResult<Invoice[]>>;
  downloadInvoice(invoiceId: string): Promise<PaymentServiceResult<Buffer>>;
  updateBillingDetails(orgId: string, billingDetails: BillingDetails): Promise<PaymentServiceResult<void>>;
  
  // Coupon & Discount Management
  validateCoupon(couponCode: string, planType: PlanType): Promise<PaymentServiceResult<CouponValidation>>;
  applyCoupon(paymentIntentId: string, couponCode: string): Promise<PaymentServiceResult<PaymentIntent>>;
  removeCoupon(paymentIntentId: string): Promise<PaymentServiceResult<PaymentIntent>>;
  
  // Plan Management
  getAvailablePlans(): Promise<PaymentServiceResult<Plan[]>>;
  getPlanDetails(planType: PlanType): Promise<PaymentServiceResult<Plan>>;
  upgradePlan(orgId: string, newPlanType: PlanType): Promise<PaymentServiceResult<Subscription>>;
  downgradePlan(orgId: string, newPlanType: PlanType): Promise<PaymentServiceResult<Subscription>>;
  
  // Payment Methods
  addPaymentMethod(orgId: string, paymentMethodData: PaymentMethodData): Promise<PaymentServiceResult<PaymentMethod>>;
  getPaymentMethods(orgId: string): Promise<PaymentServiceResult<PaymentMethod[]>>;
  updatePaymentMethod(paymentMethodId: string, updates: PaymentMethodUpdate): Promise<PaymentServiceResult<PaymentMethod>>;
  deletePaymentMethod(paymentMethodId: string): Promise<PaymentServiceResult<void>>;
  setDefaultPaymentMethod(orgId: string, paymentMethodId: string): Promise<PaymentServiceResult<void>>;
  
  // Refunds & Disputes
  createRefund(paymentId: string, amount?: number, reason?: string): Promise<PaymentServiceResult<Refund>>;
  getRefunds(orgId: string, filters?: RefundFilters): Promise<PaymentServiceResult<Refund[]>>;
  handleDispute(disputeId: string, evidence?: DisputeEvidence): Promise<PaymentServiceResult<Dispute>>;
  
  // Analytics & Reporting
  getPaymentAnalytics(orgId: string, timeRange?: TimeRange): Promise<PaymentServiceResult<PaymentAnalytics>>;
  getRevenueReport(orgId: string, timeRange?: TimeRange): Promise<PaymentServiceResult<RevenueReport>>;
  exportPaymentData(orgId: string, format: 'csv' | 'json' | 'xlsx', filters?: PaymentFilters): Promise<PaymentServiceResult<Buffer>>;
  
  // Webhooks & Events
  handleWebhook(payload: string, signature: string): Promise<PaymentServiceResult<WebhookEvent>>;
  getWebhookEvents(orgId: string, filters?: WebhookFilters): Promise<PaymentServiceResult<WebhookEvent[]>>;
  
  // Security & Compliance
  validatePaymentSecurity(paymentData: PaymentData): Promise<PaymentServiceResult<SecurityValidation>>;
  getComplianceStatus(orgId: string): Promise<PaymentServiceResult<ComplianceStatus>>;
}

export interface SubscriptionUpdate {
  planType?: PlanType;
  status?: SubscriptionStatus;
  cancelAtPeriodEnd?: boolean;
  trialEnd?: string;
}

export interface Invoice {
  id: string;
  organizationId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  dueDate: string;
  paidAt?: string;
  downloadUrl?: string;
  createdAt: string;
}

export interface InvoiceFilters {
  status?: InvoiceStatus[];
  dateRange?: TimeRange;
  amountRange?: {
    min: number;
    max: number;
  };
}

export interface Plan {
  id: string;
  name: string;
  type: PlanType;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: PlanFeature[];
  limits: PlanLimits;
  isPopular: boolean;
  description: string;
}

export interface PlanFeature {
  name: string;
  description: string;
  included: boolean;
  limit?: number;
}

export interface PlanLimits {
  maxRegistrations: number;
  maxQRCodes: number;
  maxOrganizations: number;
  maxUsers: number;
  storageGB: number;
  apiCalls: number;
}

export interface PaymentMethodData {
  type: 'card' | 'bank_account' | 'paypal';
  card?: CardData;
  bankAccount?: BankAccountData;
  billingDetails: BillingDetails;
}

export interface CardData {
  number: string;
  expMonth: number;
  expYear: number;
  cvc: string;
  brand?: string;
}

export interface BankAccountData {
  accountNumber: string;
  routingNumber: string;
  accountType: 'checking' | 'savings';
}

export interface PaymentMethod {
  id: string;
  type: string;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  isDefault: boolean;
  createdAt: string;
}

export interface PaymentMethodUpdate {
  billingDetails?: BillingDetails;
  isDefault?: boolean;
}

export interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  reason: string;
  status: RefundStatus;
  createdAt: string;
}

export interface RefundFilters {
  status?: RefundStatus[];
  dateRange?: TimeRange;
  amountRange?: {
    min: number;
    max: number;
  };
}

export interface DisputeEvidence {
  customerEmail?: string;
  customerName?: string;
  customerPurchaseIp?: string;
  customerSignature?: string;
  receipt?: string;
  shippingDocumentation?: string;
  shippingDate?: string;
  shippingTracking?: string;
  uncategorizedFile?: string;
  uncategorizedText?: string;
}

export interface Dispute {
  id: string;
  amount: number;
  currency: string;
  reason: string;
  status: DisputeStatus;
  evidence?: DisputeEvidence;
  createdAt: string;
}

export interface PaymentAnalytics {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  averageRevenuePerUser: number;
  churnRate: number;
  conversionRate: number;
  refundRate: number;
  paymentMethods: PaymentMethodAnalytics[];
}

export interface PaymentMethodAnalytics {
  type: string;
  count: number;
  percentage: number;
  successRate: number;
}

export interface RevenueReport {
  period: string;
  revenue: number;
  subscriptions: number;
  newCustomers: number;
  churnedCustomers: number;
  netRevenue: number;
  growthRate: number;
}

export interface PaymentFilters {
  dateRange?: TimeRange;
  status?: PaymentStatus[];
  planType?: PlanType[];
  amountRange?: {
    min: number;
    max: number;
  };
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  createdAt: string;
  processed: boolean;
}

export interface WebhookFilters {
  type?: string[];
  dateRange?: TimeRange;
  processed?: boolean;
}

export interface SecurityValidation {
  isValid: boolean;
  riskScore: number;
  fraudIndicators: string[];
  recommendations: string[];
}

export interface ComplianceStatus {
  pciCompliant: boolean;
  gdprCompliant: boolean;
  soxCompliant: boolean;
  lastAudit: string;
  certifications: string[];
}

export interface TimeRange {
  startDate: string;
  endDate: string;
}

export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
export type RefundStatus = 'pending' | 'succeeded' | 'failed' | 'cancelled';
export type DisputeStatus = 'warning_needs_response' | 'warning_under_review' | 'warning_closed' | 'needs_response' | 'under_review' | 'charge_refunded' | 'won' | 'lost';

