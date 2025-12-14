/**
 * Subscription Cancel Interface - ISP Compliant
 * 
 * Single Responsibility: Handle subscription cancellation previews and execution.
 * Separate from upgrade logic - focused only on cancellations.
 */

import type { PlanType } from '../subscriptions';

export interface CancelPreview {
  /** Current subscription details */
  currentPlan: PlanType;
  currentPlanName: string;
  currentLimit: number;
  currentRegistrationCount: number;
  
  /** When access will end */
  accessUntil: string;  // ISO date string
  daysRemaining: number;
  
  /** Data impact warning */
  willExceedFreeLimit: boolean;
  registrationsOverFreeLimit: number;
  
  /** Refund info (simplified - no refunds) */
  refundAmount: number;  // Always 0 for now
  
  /** Human-readable summary */
  summary: string;
}

export interface CancelResult {
  success: boolean;
  message: string;
  
  /** When access ends (on success) */
  accessUntil?: string;
  
  /** Error details (on failure) */
  error?: string;
}

export interface ISubscriptionCancel {
  /**
   * Preview what cancellation would look like.
   * Does NOT modify anything - just returns preview data.
   * 
   * @param organizationId - The organization considering cancellation
   * @returns CancelPreview with access end date and data impact
   */
  previewCancel(organizationId: string): Promise<CancelPreview>;

  /**
   * Execute the cancellation.
   * Marks subscription as 'canceling' - keeps access until period end.
   * 
   * @param organizationId - The organization canceling
   * @param reason - Optional reason for cancellation (for analytics)
   * @returns CancelResult with success/failure status
   */
  executeCancel(organizationId: string, reason?: string): Promise<CancelResult>;

  /**
   * Check if organization can cancel (has active paid subscription).
   * 
   * @param organizationId - The organization to check
   * @returns true if cancellation is possible
   */
  canCancel(organizationId: string): Promise<boolean>;
}

/**
 * Cancellation reasons for analytics.
 */
export const CANCEL_REASONS = [
  'too_expensive',
  'not_using_enough',
  'found_alternative',
  'missing_features',
  'temporary_pause',
  'other'
] as const;

export type CancelReason = typeof CANCEL_REASONS[number];
