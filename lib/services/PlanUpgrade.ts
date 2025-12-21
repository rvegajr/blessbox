/**
 * PlanUpgrade Service - ISP Compliant
 * 
 * Single Responsibility: Handle plan upgrade previews and execution.
 * 
 * Implementation of IPlanUpgrade interface.
 */

import { getDbClient, ensureSubscriptionSchema, nowIso } from '../db';
import { planPricingCents, planRegistrationLimits, type PlanType } from '../subscriptions';
import type { IPlanUpgrade, UpgradePreview, UpgradeResult } from '../interfaces/IPlanUpgrade';
import { PLAN_HIERARCHY, PLAN_NAMES } from '../interfaces/IPlanUpgrade';

export class PlanUpgrade implements IPlanUpgrade {
  private db: ReturnType<typeof getDbClient>;

  constructor() {
    this.db = getDbClient();
  }

  isValidUpgrade(currentPlan: PlanType, targetPlan: PlanType): boolean {
    const currentLevel = PLAN_HIERARCHY[currentPlan];
    const targetLevel = PLAN_HIERARCHY[targetPlan];
    
    // Valid upgrade: target must be strictly higher
    return targetLevel > currentLevel;
  }

  async previewUpgrade(organizationId: string, targetPlan: PlanType): Promise<UpgradePreview> {
    await ensureSubscriptionSchema();

    // Get current subscription
    const currentSub = await this.getCurrentSubscription(organizationId);
    const currentPlan = currentSub?.plan_type || 'free';

    // Validate upgrade
    if (currentPlan === targetPlan) {
      throw new Error(`You are already on the ${PLAN_NAMES[targetPlan]} plan`);
    }

    if (!this.isValidUpgrade(currentPlan, targetPlan)) {
      throw new Error(`Cannot downgrade from ${PLAN_NAMES[currentPlan]} to ${PLAN_NAMES[targetPlan]}`);
    }

    // Calculate pricing
    const currentMonthlyPrice = planPricingCents[currentPlan];
    const newMonthlyPrice = planPricingCents[targetPlan];
    const priceDifference = newMonthlyPrice - currentMonthlyPrice;

    // For simplicity, charge full month on upgrade (no proration)
    const amountDueNow = newMonthlyPrice;

    // Get limits
    const currentLimit = planRegistrationLimits[currentPlan];
    const targetLimit = planRegistrationLimits[targetPlan];

    // Build summary
    const currentPrice = (currentMonthlyPrice / 100).toFixed(2);
    const newPrice = (newMonthlyPrice / 100).toFixed(2);
    const summary = currentPlan === 'free'
      ? `Upgrade from ${PLAN_NAMES[currentPlan]} to ${PLAN_NAMES[targetPlan]} for $${newPrice}/month`
      : `Upgrade from ${PLAN_NAMES[currentPlan]} ($${currentPrice}/mo) to ${PLAN_NAMES[targetPlan]} ($${newPrice}/mo)`;

    return {
      currentPlan,
      currentPlanName: PLAN_NAMES[currentPlan],
      currentLimit,
      targetPlan,
      targetPlanName: PLAN_NAMES[targetPlan],
      targetLimit,
      currentMonthlyPrice,
      newMonthlyPrice,
      priceDifference,
      amountDueNow,
      effectiveImmediately: true,
      summary
    };
  }

  async executeUpgrade(organizationId: string, targetPlan: PlanType): Promise<UpgradeResult> {
    await ensureSubscriptionSchema();

    try {
      // Get current subscription
      const currentSub = await this.getCurrentSubscription(organizationId);
      const currentPlan = (currentSub?.plan_type || 'free') as PlanType;

      // Validate upgrade
      if (!this.isValidUpgrade(currentPlan, targetPlan)) {
        return {
          success: false,
          message: 'Upgrade failed',
          error: `Cannot downgrade from ${PLAN_NAMES[currentPlan]} to ${PLAN_NAMES[targetPlan]}`
        };
      }

      const newLimit = planRegistrationLimits[targetPlan];
      const newAmount = planPricingCents[targetPlan];
      const now = nowIso();

      if (currentSub?.id) {
        // Update existing subscription
        await this.db.execute({
          sql: `UPDATE subscription_plans 
                SET plan_type = ?, 
                    registration_limit = ?, 
                    amount = ?,
                    updated_at = ?
                WHERE id = ?`,
          args: [targetPlan, newLimit, newAmount, now, currentSub.id]
        });
      } else {
        // Create new subscription
        const id = crypto.randomUUID();
        const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        
        await this.db.execute({
          sql: `INSERT INTO subscription_plans (
                  id, organization_id, plan_type, status, registration_limit, 
                  current_registration_count, billing_cycle, amount, currency,
                  current_period_start, current_period_end, start_date, end_date,
                  created_at, updated_at
                ) VALUES (?, ?, ?, 'active', ?, 0, 'monthly', ?, 'USD', ?, ?, ?, ?, ?, ?)`,
          args: [id, organizationId, targetPlan, newLimit, newAmount, now, endDate, now, endDate, now, now]
        });
      }

      return {
        success: true,
        message: `Successfully upgraded to ${PLAN_NAMES[targetPlan]} plan`,
        newPlanType: targetPlan,
        newLimit
      };
    } catch (error) {
      console.error('Upgrade execution error:', error);
      return {
        success: false,
        message: 'Upgrade failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get current active subscription for an organization.
   */
  private async getCurrentSubscription(organizationId: string): Promise<{
    id: string;
    plan_type: PlanType;
    registration_limit: number;
    current_registration_count: number;
    status: string;
  } | null> {
    const result = await this.db.execute({
      sql: `SELECT id, plan_type, registration_limit, current_registration_count, status 
            FROM subscription_plans 
            WHERE organization_id = ? AND status = 'active' 
            ORDER BY start_date DESC 
            LIMIT 1`,
      args: [organizationId]
    });

    return result.rows[0] as any || null;
  }
}

// Singleton instance for convenience
let instance: PlanUpgrade | null = null;

export function getPlanUpgrade(): PlanUpgrade {
  if (!instance) {
    instance = new PlanUpgrade();
  }
  return instance;
}
