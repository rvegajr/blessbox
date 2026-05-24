/**
 * CouponUsageEnforcer
 *
 * ISP-compliant implementation of `ICouponUsageEnforcer`. Closes the
 * billing-bypass gap reported in Issue #27 (and confirmed via curl):
 * a 100%-off coupon could be redeemed by the same organization an
 * unlimited number of times because `current_uses` was never incremented.
 *
 * Responsibilities (only these two):
 *   1. assertEligible: per-org redemption check + global max_uses + active/expiry
 *   2. recordRedemption: insert coupon_redemptions + bump current_uses (atomic-ish)
 *
 * Storage: shares `coupons` and `coupon_redemptions` tables already created
 * by `CouponService.ensureSchema`.
 */

import { getDbClient, nowIso } from '../db';
import { CouponService } from '../coupons';
import type {
  ICouponUsageEnforcer,
  CouponEligibility,
  RecordRedemptionInput,
} from '../interfaces/ICouponUsageEnforcer';

export class CouponUsageEnforcer implements ICouponUsageEnforcer {
  private db = getDbClient();
  private coupons = new CouponService();

  async assertEligible(code: string, organizationId: string): Promise<CouponEligibility> {
    const validation = await this.coupons.validateCoupon(code);
    if (!validation.valid) {
      return { eligible: false, reason: validation.error || 'Invalid coupon' };
    }

    const alreadyRedeemed = await this.hasOrganizationRedeemed(code, organizationId);
    if (alreadyRedeemed) {
      return {
        eligible: false,
        reason: 'This coupon has already been used by your organization',
      };
    }

    return { eligible: true };
  }

  async hasOrganizationRedeemed(code: string, organizationId: string): Promise<boolean> {
    const coupon = await this.coupons.getCouponByCode(code);
    if (!coupon) return false;

    const result = await this.db.execute({
      sql: `SELECT COUNT(*) as count
            FROM coupon_redemptions
            WHERE coupon_id = ? AND organization_id = ?`,
      args: [coupon.id, organizationId],
    });
    const count = Number((result.rows as any[])[0]?.count ?? 0);
    return count > 0;
  }

  async recordRedemption(input: RecordRedemptionInput): Promise<void> {
    const coupon = await this.coupons.getCouponByCode(input.code);
    if (!coupon) {
      throw new Error('Coupon not found');
    }

    const finalAmount = input.originalAmountCents - input.discountAppliedCents;
    const redemptionId = (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) as string;

    await this.db.execute({
      sql: `INSERT INTO coupon_redemptions (
              id, coupon_id, user_id, organization_id, subscription_id,
              original_amount, discount_applied, final_amount, redeemed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        redemptionId,
        coupon.id,
        input.userId,
        input.organizationId,
        input.subscriptionId,
        input.originalAmountCents,
        input.discountAppliedCents,
        finalAmount,
        nowIso(),
      ],
    });

    await this.db.execute({
      sql: `UPDATE coupons SET current_uses = current_uses + 1, updated_at = ? WHERE id = ?`,
      args: [nowIso(), coupon.id],
    });
  }
}
