// ICouponService - Interface Segregation Principle Compliant
// Single responsibility: Coupon validation, application, and management

export interface CouponValidationResult {
  valid: boolean;
  error?: string;
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
    currency: string;
  };
}

export interface CouponCreate {
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  currency?: string;
  minAmount?: number | null;
  maxDiscount?: number | null;
  maxUses?: number | null;
  expiresAt?: string | null;
  applicablePlans?: string[] | null;
  createdBy: string;
}

export interface CouponUpdate {
  description?: string;
  discountValue?: number;
  minAmount?: number | null;
  maxDiscount?: number | null;
  maxUses?: number;
  expiresAt?: string;
  applicablePlans?: string[];
  active?: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  currency: string;
  minAmount?: number | null;
  maxDiscount?: number | null;
  active: boolean;
  maxUses?: number;
  currentUses: number;
  expiresAt?: string;
  applicablePlans?: string[];
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

export interface CouponAnalytics {
  totalRedemptions: number;
  totalDiscountGiven: number;
  averageDiscount: number;
  redemptionRate: number;
  topUsers: Array<{
    userId: string;
    redemptions: number;
    totalDiscount: number;
  }>;
}

export interface ICouponService {
  // Validation and application
  validateCoupon(code: string): Promise<CouponValidationResult>;
  applyCoupon(code: string, amount: number, planType: string): Promise<number>;
  trackCouponUsage(code: string, userId: string, organizationId: string, subscriptionId: string, originalAmount: number, discountApplied: number): Promise<void>;
  
  // CRUD operations
  createCoupon(coupon: CouponCreate): Promise<Coupon>;
  getCoupon(id: string): Promise<Coupon | null>;
  getCouponByCode(code: string): Promise<Coupon | null>;
  updateCoupon(id: string, updates: CouponUpdate): Promise<Coupon>;
  deactivateCoupon(id: string): Promise<void>;
  listCoupons(filters?: { active?: boolean; createdBy?: string }): Promise<Coupon[]>;
  
  // Analytics
  getCouponAnalytics(couponId?: string): Promise<CouponAnalytics>;
}

