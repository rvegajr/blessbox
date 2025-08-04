// 💎 SUBSCRIPTION SERVICE INTERFACE - PURE ISP BILLING BLISS! ✨
// HARDENED SUBSCRIPTION LOGIC! NO MOCKS! REAL BILLING POWER! 🚀

export interface ISubscriptionService {
  // 🎯 Get subscription for organization
  getSubscription(organizationId: string): Promise<SubscriptionDetails | null>;
  
  // 🔄 Update subscription plan
  updateSubscriptionPlan(organizationId: string, newPlanType: string): Promise<SubscriptionUpdateResult>;
  
  // ❌ Cancel subscription
  cancelSubscription(organizationId: string, reason?: string): Promise<CancellationResult>;
  
  // ✅ Reactivate subscription
  reactivateSubscription(organizationId: string): Promise<ReactivationResult>;
  
  // 📊 Get usage statistics
  getUsageStats(organizationId: string): Promise<UsageStats>;
  
  // 🚨 Check usage limits
  checkUsageLimits(organizationId: string): Promise<UsageLimitCheck>;
  
  // 📈 Get billing history
  getBillingHistory(organizationId: string): Promise<BillingHistoryEntry[]>;
  
  // 🎫 Apply coupon to subscription
  applyCouponToSubscription(organizationId: string, couponCode: string): Promise<CouponApplicationResult>;
}

export interface SubscriptionDetails {
  id: string;
  organizationId: string;
  planType: 'free' | 'standard' | 'enterprise';
  status: 'active' | 'cancelled' | 'suspended' | 'past_due';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  paymentProvider?: string;
  externalSubscriptionId?: string;
  registrationLimit: number;
  currentRegistrationCount: number;
  usagePercentage: number;
  daysUntilRenewal: number;
  isTrialPeriod: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionUpdateResult {
  success: boolean;
  subscription?: SubscriptionDetails;
  proratedAmount?: number; // Amount to charge/refund for plan change
  effectiveDate?: Date;
  message: string;
  error?: string;
}

export interface CancellationResult {
  success: boolean;
  cancellationDate?: Date;
  refundAmount?: number;
  message: string;
  error?: string;
}

export interface ReactivationResult {
  success: boolean;
  subscription?: SubscriptionDetails;
  message: string;
  error?: string;
}

export interface UsageStats {
  organizationId: string;
  planType: string;
  registrationLimit: number;
  currentRegistrationCount: number;
  usagePercentage: number;
  remainingRegistrations: number;
  periodStart: Date;
  periodEnd: Date;
  averageRegistrationsPerDay: number;
  projectedMonthlyUsage: number;
  isNearLimit: boolean; // > 80% usage
  isOverLimit: boolean;
}

export interface UsageLimitCheck {
  withinLimits: boolean;
  currentUsage: number;
  limit: number;
  usagePercentage: number;
  remainingRegistrations: number;
  planType: string;
  upgradeRequired: boolean;
  suggestedPlan?: string;
  message: string;
}

export interface BillingHistoryEntry {
  id: string;
  date: Date;
  type: 'subscription' | 'upgrade' | 'downgrade' | 'refund' | 'payment_failed';
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  description: string;
  paymentMethod?: string;
  receiptUrl?: string;
  couponCode?: string;
  discountAmount?: number;
}

export interface CouponApplicationResult {
  success: boolean;
  couponCode?: string;
  discountAmount?: number;
  newAmount?: number;
  validUntil?: Date;
  message: string;
  error?: string;
}

// Plan configuration
export interface PlanConfig {
  type: 'free' | 'standard' | 'enterprise';
  name: string;
  price: number; // in cents
  registrationLimit: number;
  features: string[];
  popular?: boolean;
}

export const PLAN_CONFIGS: Record<string, PlanConfig> = {
  free: {
    type: 'free',
    name: 'Free Plan',
    price: 0,
    registrationLimit: 10,
    features: ['Up to 10 registrations', 'Basic QR codes', 'Email support']
  },
  standard: {
    type: 'standard',
    name: 'Standard Plan',
    price: 999, // $9.99
    registrationLimit: 1000,
    features: ['Up to 1,000 registrations', 'Multiple QR codes', 'Entry point tracking', 'Priority support'],
    popular: true
  },
  enterprise: {
    type: 'enterprise',
    name: 'Enterprise Plan',
    price: 2999, // $29.99
    registrationLimit: 100000,
    features: ['Up to 100,000 registrations', 'Unlimited QR codes', 'Advanced analytics', 'Custom branding', 'Phone support']
  }
};