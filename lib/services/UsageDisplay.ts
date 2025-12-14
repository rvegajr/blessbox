/**
 * UsageDisplay Service - ISP Compliant
 * 
 * Single Responsibility: Get displayable usage information for UI.
 * 
 * Implementation of IUsageDisplay interface.
 */

import { getDbClient, ensureSubscriptionSchema } from '../db';
import { planRegistrationLimits } from '../subscriptions';
import type { IUsageDisplay, UsageDisplayData } from '../interfaces/IUsageDisplay';
import { calculateUsageStatus } from '../interfaces/IUsageDisplay';

const FREE_PLAN_LIMIT = planRegistrationLimits.free; // 100

export class UsageDisplay implements IUsageDisplay {
  private db: ReturnType<typeof getDbClient>;

  constructor() {
    this.db = getDbClient();
  }

  async getUsageDisplay(organizationId: string): Promise<UsageDisplayData> {
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
      return this.getFreeTierUsage(organizationId);
    }

    const planType = (subscription.plan_type || 'free') as 'free' | 'standard' | 'enterprise';
    const limit = Number(subscription.registration_limit) || FREE_PLAN_LIMIT;
    const currentCount = Number(subscription.current_registration_count) || 0;
    
    return this.buildUsageData(currentCount, limit, planType);
  }

  /**
   * Fallback when no active subscription exists.
   * Uses free tier limits but counts existing registrations.
   */
  private async getFreeTierUsage(organizationId: string): Promise<UsageDisplayData> {
    // Count actual registrations for this org
    const countResult = await this.db.execute({
      sql: `SELECT COUNT(*) as count 
            FROM registrations r
            JOIN qr_code_sets qs ON r.qr_code_set_id = qs.id
            WHERE qs.organization_id = ?`,
      args: [organizationId]
    });

    const currentCount = Number((countResult.rows[0] as any)?.count) || 0;
    
    return this.buildUsageData(currentCount, FREE_PLAN_LIMIT, 'free');
  }

  /**
   * Build the usage display data from raw values.
   */
  private buildUsageData(
    currentCount: number, 
    limit: number, 
    planType: 'free' | 'standard' | 'enterprise'
  ): UsageDisplayData {
    const percentage = limit > 0 ? Math.round((currentCount / limit) * 100) : 0;
    const remaining = Math.max(0, limit - currentCount);
    const status = calculateUsageStatus(percentage);

    return {
      currentCount,
      limit,
      percentage,
      planType,
      status,
      remaining
    };
  }
}

// Singleton instance for convenience
let instance: UsageDisplay | null = null;

export function getUsageDisplay(): UsageDisplay {
  if (!instance) {
    instance = new UsageDisplay();
  }
  return instance;
}
