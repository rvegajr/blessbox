// 🎊 PRICING SERVICE INTERFACE - ISP COMPLIANT! ✨
// Focused ONLY on pricing operations - PURE JOY! 💎

export interface PricingPlan {
  id: string;
  name: string;
  price: number; // In cents for precision!
  currency: string;
  interval: 'monthly' | 'annual';
  features: string[];
  registrationLimit: number; // -1 for unlimited
  qrCodeLimit: number; // -1 for unlimited
  isPopular?: boolean;
  badge?: string; // e.g., "BEST VALUE", "MOST POPULAR"
}

export interface PricingComparison {
  feature: string;
  description?: string;
  free: string | boolean;
  standard: string | boolean;
  enterprise: string | boolean;
}

export interface Promotion {
  code: string;
  discount: number; // Percentage
  validUntil: Date;
  message: string;
  applicablePlans: string[];
}

export interface PricingDisplay {
  plans: PricingPlan[];
  comparisons: PricingComparison[];
  currentPromotion?: Promotion;
  defaultPlan: string;
}

/**
 * 🎯 Pricing Service Interface - ISP Compliant!
 * Handles ONLY pricing-related operations
 * Single Responsibility: Pricing information and calculations
 */
export interface IPricingService {
  /**
   * 🎊 Get all available pricing plans
   */
  getPricingPlans(): Promise<PricingPlan[]>;

  /**
   * 💎 Get a specific pricing plan by ID
   */
  getPlanById(planId: string): Promise<PricingPlan | null>;

  /**
   * 📊 Get feature comparison table
   */
  getFeatureComparison(): Promise<PricingComparison[]>;

  /**
   * 🎁 Get current promotion if any
   */
  getCurrentPromotion(): Promise<Promotion | null>;

  /**
   * 💰 Calculate price with promotion
   */
  calculateDiscountedPrice(
    planId: string,
    promoCode?: string
  ): Promise<{
    originalPrice: number;
    discountAmount: number;
    finalPrice: number;
    currency: string;
  }>;

  /**
   * 🔄 Convert monthly to annual pricing
   */
  getAnnualPricing(monthlyPrice: number): {
    annualPrice: number;
    monthlySavings: number;
    percentSaved: number;
  };

  /**
   * ✨ Get recommended plan based on usage
   */
  getRecommendedPlan(expectedRegistrations: number): Promise<PricingPlan>;

  /**
   * 🎯 Validate promotion code
   */
  validatePromoCode(code: string, planId: string): Promise<{
    valid: boolean;
    discount?: number;
    message: string;
  }>;
}

// 🎊 Pricing constants for PURE JOY!
export const PRICING_CONSTANTS = {
  FREE_PLAN_ID: 'free',
  STANDARD_PLAN_ID: 'standard',
  ENTERPRISE_PLAN_ID: 'enterprise',
  
  FREE_LIMIT: 10,
  STANDARD_LIMIT: 1000,
  ENTERPRISE_LIMIT: -1, // Unlimited!
  
  STANDARD_PRICE_MONTHLY: 2755, // $27.55
  ENTERPRISE_PRICE_MONTHLY: 9755, // $97.55
  
  ANNUAL_DISCOUNT_PERCENT: 17, // Save 2 months!
  
  DEFAULT_CURRENCY: 'USD'
};

console.log('🎉 Pricing Service Interface created with ISP compliance! BEAUTIFUL! ✨');