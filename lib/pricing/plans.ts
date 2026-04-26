/**
 * Single source of truth for pricing/plan metadata.
 *
 * Re-exports the canonical plan price + limit maps from `lib/subscriptions`
 * so that ALL code paths (UI, API, billing, upgrade) read from one place.
 *
 * NEVER trust client-supplied `amount` for paid checkouts — always look up
 * the price here using `getPlanPriceCents(planType, billingCycle)`.
 */

import {
  planPricingCents,
  planRegistrationLimits,
  type PlanType,
  type BillingCycle,
} from '@/lib/subscriptions';

export type { PlanType, BillingCycle };
export { planPricingCents, planRegistrationLimits };

export const VALID_PLANS: PlanType[] = ['free', 'standard', 'enterprise'];

export interface PlanDescriptor {
  key: PlanType;
  name: string;
  priceMonthly: number;
  priceMonthlyCents: number;
  features: string[];
}

export const PLANS: PlanDescriptor[] = [
  {
    key: 'free',
    name: 'Free Plan',
    priceMonthly: planPricingCents.free / 100,
    priceMonthlyCents: planPricingCents.free,
    features: [`Up to ${planRegistrationLimits.free.toLocaleString()} registrations`],
  },
  {
    key: 'standard',
    name: 'Standard Plan',
    priceMonthly: planPricingCents.standard / 100,
    priceMonthlyCents: planPricingCents.standard,
    features: [
      `Up to ${planRegistrationLimits.standard.toLocaleString()} registrations`,
      'Email support',
    ],
  },
  {
    key: 'enterprise',
    name: 'Enterprise Plan',
    priceMonthly: planPricingCents.enterprise / 100,
    priceMonthlyCents: planPricingCents.enterprise,
    features: [
      `Up to ${planRegistrationLimits.enterprise.toLocaleString()} registrations`,
      'Priority support',
    ],
  },
];

export function isValidPlan(value: unknown): value is PlanType {
  return typeof value === 'string' && (VALID_PLANS as string[]).includes(value);
}

/**
 * Server-authoritative price lookup. Returns price in cents.
 * Yearly = monthly * 12 (no discount applied here; coupons handle promos).
 */
export function getPlanPriceCents(
  planType: PlanType,
  billingCycle: BillingCycle = 'monthly'
): number {
  const monthly = planPricingCents[planType];
  if (monthly === undefined) {
    throw new Error(`Unknown planType: ${planType}`);
  }
  return billingCycle === 'yearly' ? monthly * 12 : monthly;
}
