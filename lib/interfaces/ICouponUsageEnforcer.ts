/**
 * ICouponUsageEnforcer - Interface Segregation Principle Compliant
 *
 * Single responsibility: enforce coupon redemption rules at checkout time.
 *
 * Issue #27 — without this gate a 100% off coupon (e.g. FREE100) could be
 * redeemed by the same organization an unlimited number of times because
 * `current_uses` was never incremented after a successful checkout.
 *
 * The enforcer is split from `ICouponService` because the storage/CRUD
 * concerns are unrelated to redemption gating. Payment routes only need
 * `assertEligible` + `recordRedemption`; admin tooling only needs CRUD.
 */

export interface CouponEligibility {
  eligible: boolean;
  reason?: string;
}

export interface RecordRedemptionInput {
  code: string;
  userId: string;
  organizationId: string;
  subscriptionId: string;
  originalAmountCents: number;
  discountAppliedCents: number;
}

/**
 * Read-only eligibility checks. Safe to call multiple times.
 */
export interface ICouponUsageReader {
  /**
   * Throws/returns ineligible if the coupon cannot be redeemed by this
   * organization right now (e.g. already redeemed, exhausted, expired).
   */
  assertEligible(code: string, organizationId: string): Promise<CouponEligibility>;

  /**
   * Returns true when the org has previously redeemed this coupon.
   * Useful for UI hints and idempotency.
   */
  hasOrganizationRedeemed(code: string, organizationId: string): Promise<boolean>;
}

/**
 * Write-side: record a successful redemption. Must be called exactly once
 * per successful checkout to keep `current_uses` accurate.
 */
export interface ICouponUsageWriter {
  recordRedemption(input: RecordRedemptionInput): Promise<void>;
}

export interface ICouponUsageEnforcer extends ICouponUsageReader, ICouponUsageWriter {}
