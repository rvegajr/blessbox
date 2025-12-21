/**
 * SubscriptionCancel Service - ISP Compliant
 * 
 * Single Responsibility: Handle subscription cancellation previews and execution.
 * 
 * Implementation of ISubscriptionCancel interface.
 */

import { getDbClient, ensureSubscriptionSchema, nowIso } from '../db';
import { planRegistrationLimits, type PlanType } from '../subscriptions';
import type { ISubscriptionCancel, CancelPreview, CancelResult, CancelReason } from '../interfaces/ISubscriptionCancel';
import { PLAN_NAMES } from '../interfaces/IPlanUpgrade';

const FREE_PLAN_LIMIT = planRegistrationLimits.free; // 100

export class SubscriptionCancel implements ISubscriptionCancel {
  private db: ReturnType<typeof getDbClient>;

  constructor() {
    this.db = getDbClient();
  }

  async canCancel(organizationId: string): Promise<boolean> {
    await ensureSubscriptionSchema();

    const subscription = await this.getCurrentSubscription(organizationId);
    
    if (!subscription) return false;
    if (subscription.status !== 'active') return false;
    if (subscription.plan_type === 'free') return false;
    
    return true;
  }

  async previewCancel(organizationId: string): Promise<CancelPreview> {
    await ensureSubscriptionSchema();

    const subscription = await this.getCurrentSubscription(organizationId);

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    if (subscription.plan_type === 'free') {
      throw new Error('Cannot cancel free plan');
    }

    const currentPlan = subscription.plan_type as PlanType;
    const currentLimit = Number(subscription.registration_limit) || planRegistrationLimits[currentPlan];
    const currentRegistrationCount = Number(subscription.current_registration_count) || 0;
    const accessUntil = subscription.current_period_end;

    // Calculate days remaining
    const now = new Date();
    const endDate = new Date(accessUntil);
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // Check if registrations will exceed free limit
    const willExceedFreeLimit = currentRegistrationCount > FREE_PLAN_LIMIT;
    const registrationsOverFreeLimit = Math.max(0, currentRegistrationCount - FREE_PLAN_LIMIT);

    // Build summary
    let summary = `Your ${PLAN_NAMES[currentPlan]} subscription will remain active until ${new Date(accessUntil).toLocaleDateString()}.`;
    
    if (willExceedFreeLimit) {
      summary += ` Note: You have ${currentRegistrationCount} registrations, which will exceed the Free plan limit of ${FREE_PLAN_LIMIT}. Your data will be preserved, but new registrations will be blocked.`;
    } else {
      summary += ` After that, you'll be on the Free plan with up to ${FREE_PLAN_LIMIT} registrations.`;
    }

    return {
      currentPlan,
      currentPlanName: PLAN_NAMES[currentPlan],
      currentLimit,
      currentRegistrationCount,
      accessUntil,
      daysRemaining,
      willExceedFreeLimit,
      registrationsOverFreeLimit,
      refundAmount: 0, // No refunds for now
      summary
    };
  }

  async executeCancel(organizationId: string, reason?: CancelReason): Promise<CancelResult> {
    await ensureSubscriptionSchema();

    try {
      const subscription = await this.getCurrentSubscription(organizationId);

      if (!subscription) {
        return {
          success: false,
          message: 'Cancellation failed',
          error: 'No active subscription found'
        };
      }

      if (subscription.plan_type === 'free') {
        return {
          success: false,
          message: 'Cancellation failed',
          error: 'Cannot cancel free plan'
        };
      }

      if (subscription.status === 'canceled' || subscription.status === 'canceling') {
        return {
          success: false,
          message: 'Cancellation failed',
          error: 'Subscription is already cancelled or canceling'
        };
      }

      const now = nowIso();
      const accessUntil = subscription.current_period_end;

      // Update subscription to 'canceling' status
      // Keep access until period end, then a cron job would finalize to 'canceled'
      await this.db.execute({
        sql: `UPDATE subscription_plans 
              SET status = 'canceling',
                  cancellation_reason = ?,
                  cancelled_at = ?,
                  updated_at = ?
              WHERE id = ?`,
        args: [reason || null, now, now, subscription.id]
      });

      return {
        success: true,
        message: `Your subscription has been cancelled. You'll have access until ${new Date(accessUntil).toLocaleDateString()}.`,
        accessUntil
      };
    } catch (error) {
      console.error('Cancellation error:', error);
      return {
        success: false,
        message: 'Cancellation failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get current subscription for an organization.
   */
  private async getCurrentSubscription(organizationId: string): Promise<{
    id: string;
    plan_type: string;
    registration_limit: number;
    current_registration_count: number;
    current_period_end: string;
    status: string;
  } | null> {
    const result = await this.db.execute({
      sql: `SELECT id, plan_type, registration_limit, current_registration_count, 
                   current_period_end, status 
            FROM subscription_plans 
            WHERE organization_id = ? 
            ORDER BY start_date DESC 
            LIMIT 1`,
      args: [organizationId]
    });

    return result.rows[0] as any || null;
  }
}

// Singleton instance for convenience
let instance: SubscriptionCancel | null = null;

export function getSubscriptionCancel(): SubscriptionCancel {
  if (!instance) {
    instance = new SubscriptionCancel();
  }
  return instance;
}
