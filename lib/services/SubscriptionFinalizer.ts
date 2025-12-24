import { getDbClient, nowIso } from '../db';

export type ExpiredCancellation = {
  id: string;
  organization_id: string;
  plan_type: string;
  registration_limit: number;
  current_registration_count: number;
  current_period_end: string;
};

/**
 * SubscriptionFinalizer
 *
 * Shared logic for cron-like jobs that need to finalize subscriptions that were
 * marked `canceling` once their current period has ended.
 */
export class SubscriptionFinalizer {
  private db = getDbClient();

  /**
   * Find subscriptions with status='canceling' whose current_period_end < now.
   */
  async findExpiredCancellations(now: string = nowIso()): Promise<ExpiredCancellation[]> {
    const result = await this.db.execute({
      sql: `SELECT id, organization_id, plan_type, registration_limit,
                   current_registration_count, current_period_end
            FROM subscription_plans
            WHERE status = 'canceling'
              AND current_period_end < ?
            ORDER BY current_period_end ASC`,
      args: [now],
    });

    return (result.rows || []) as ExpiredCancellation[];
  }

  /**
   * Update a subscription from canceling -> canceled.
   */
  async finalizeCancellation(subscriptionId: string, now: string = nowIso()): Promise<void> {
    await this.db.execute({
      sql: `UPDATE subscription_plans
            SET status = 'canceled',
                updated_at = ?
            WHERE id = ?`,
      args: [now, subscriptionId],
    });
  }
}

