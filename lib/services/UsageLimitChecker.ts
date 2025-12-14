/**
 * UsageLimitChecker Service - ISP Compliant
 * 
 * Single Responsibility: Check if an organization can create a new registration
 * based on their subscription limits.
 * 
 * Implementation of IUsageLimitChecker interface.
 */

import { getDbClient, ensureSubscriptionSchema } from '../db';
import { planRegistrationLimits } from '../subscriptions';
import type { IUsageLimitChecker, UsageLimitResult } from '../interfaces/IUsageLimitChecker';

const FREE_PLAN_LIMIT = planRegistrationLimits.free; // 100

export class UsageLimitChecker implements IUsageLimitChecker {
  private db: ReturnType<typeof getDbClient>;

  constructor() {
    this.db = getDbClient();
  }

  async canRegister(organizationId: string): Promise<UsageLimitResult> {
    await ensureSubscriptionSchema();

    // Get active subscription for the organization
    const subscriptionResult = await this.db.execute({
      sql: `SELECT plan_type, registration_limit, current_registration_count, status 
            FROM subscription_plans 
            WHERE organization_id = ? AND status = 'active' 
            ORDER BY start_date DESC 
            LIMIT 1`,
      args: [organizationId]
    });

    const subscription = subscriptionResult.rows[0] as {
      plan_type: string;
      registration_limit: number;
      current_registration_count: number | null;
      status: string;
    } | undefined;

    // If no active subscription, use free tier defaults
    if (!subscription) {
      return this.checkWithFreeTier(organizationId);
    }

    const planType = (subscription.plan_type || 'free') as 'free' | 'standard' | 'enterprise';
    const limit = Number(subscription.registration_limit) || FREE_PLAN_LIMIT;
    const currentCount = Number(subscription.current_registration_count) || 0;
    const remaining = Math.max(0, limit - currentCount);
    const allowed = currentCount < limit;

    const result: UsageLimitResult = {
      allowed,
      currentCount,
      limit,
      remaining,
      planType
    };

    if (!allowed) {
      result.message = `Registration limit reached. Your ${planType} plan allows ${limit} registrations. Please upgrade to continue.`;
      result.upgradeUrl = '/pricing';
    }

    return result;
  }

  /**
   * Fallback when no active subscription exists.
   * Uses free tier limits but counts existing registrations.
   */
  private async checkWithFreeTier(organizationId: string): Promise<UsageLimitResult> {
    // Count actual registrations for this org
    const countResult = await this.db.execute({
      sql: `SELECT COUNT(*) as count 
            FROM registrations r
            JOIN qr_code_sets qs ON r.qr_code_set_id = qs.id
            WHERE qs.organization_id = ?`,
      args: [organizationId]
    });

    const currentCount = Number((countResult.rows[0] as any)?.count) || 0;
    const limit = FREE_PLAN_LIMIT;
    const remaining = Math.max(0, limit - currentCount);
    const allowed = currentCount < limit;

    const result: UsageLimitResult = {
      allowed,
      currentCount,
      limit,
      remaining,
      planType: 'free'
    };

    if (!allowed) {
      result.message = `Registration limit reached. The free plan allows ${limit} registrations. Please upgrade to continue.`;
      result.upgradeUrl = '/pricing';
    }

    return result;
  }
}

// Singleton instance for convenience
let instance: UsageLimitChecker | null = null;

export function getUsageLimitChecker(): UsageLimitChecker {
  if (!instance) {
    instance = new UsageLimitChecker();
  }
  return instance;
}
