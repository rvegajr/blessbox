/**
 * Plan Upgrade Interface - ISP Compliant
 * 
 * Single Responsibility: Handle plan upgrade previews and execution.
 * Separate from subscription management - focused only on upgrades.
 */

import type { PlanType } from '../subscriptions';

export interface UpgradePreview {
  /** Current plan details */
  currentPlan: PlanType;
  currentPlanName: string;
  currentLimit: number;
  
  /** Target plan details */
  targetPlan: PlanType;
  targetPlanName: string;
  targetLimit: number;
  
  /** Pricing */
  currentMonthlyPrice: number;  // in cents
  newMonthlyPrice: number;      // in cents
  priceDifference: number;      // in cents (new - current)
  
  /** Proration (simplified - full month charge) */
  amountDueNow: number;         // in cents
  
  /** Effective immediately */
  effectiveImmediately: boolean;
  
  /** Human-readable summary */
  summary: string;
}

export interface UpgradeResult {
  success: boolean;
  message: string;
  
  /** New subscription details (on success) */
  newPlanType?: PlanType;
  newLimit?: number;
  
  /** Error details (on failure) */
  error?: string;
}

export interface IPlanUpgrade {
  /**
   * Preview what an upgrade would look like.
   * Does NOT modify anything - just returns preview data.
   * 
   * @param organizationId - The organization considering upgrade
   * @param targetPlan - The plan they want to upgrade to
   * @returns UpgradePreview with pricing and limit changes
   */
  previewUpgrade(organizationId: string, targetPlan: PlanType): Promise<UpgradePreview>;

  /**
   * Execute the upgrade after payment is confirmed.
   * Updates the subscription to the new plan.
   * 
   * @param organizationId - The organization upgrading
   * @param targetPlan - The plan to upgrade to
   * @returns UpgradeResult with success/failure status
   */
  executeUpgrade(organizationId: string, targetPlan: PlanType): Promise<UpgradeResult>;

  /**
   * Check if upgrade is valid (can't downgrade, can't upgrade to same plan).
   * 
   * @param currentPlan - Current plan type
   * @param targetPlan - Target plan type
   * @returns true if upgrade is valid
   */
  isValidUpgrade(currentPlan: PlanType, targetPlan: PlanType): boolean;
}

/**
 * Plan hierarchy for upgrade validation.
 * Higher number = higher tier.
 */
export const PLAN_HIERARCHY: Record<PlanType, number> = {
  free: 0,
  standard: 1,
  enterprise: 2
};

/**
 * Plan display names.
 */
export const PLAN_NAMES: Record<PlanType, string> = {
  free: 'Free',
  standard: 'Standard',
  enterprise: 'Enterprise'
};
