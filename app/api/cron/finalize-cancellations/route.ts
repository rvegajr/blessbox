import { NextRequest, NextResponse } from 'next/server';
import { ensureSubscriptionSchema, nowIso } from '@/lib/db';
import { SubscriptionFinalizer } from '@/lib/services/SubscriptionFinalizer';

/**
 * Vercel Cron Job: Finalize Cancellations
 * 
 * Runs daily at 2 AM UTC to finalize subscriptions that have been cancelled
 * and their access period has ended.
 * 
 * Schedule: "0 2 * * *" (daily at 2 AM UTC)
 * 
 * What it does:
 * 1. Finds subscriptions with status='canceling' where current_period_end < NOW()
 * 2. Changes status to 'canceled'
 * 3. Optionally downgrades to Free plan limits (or keeps current limits)
 * 
 * Security: Protected by CRON_SECRET environment variable
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this in Authorization header)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[Cron] CRON_SECRET not configured');
    return NextResponse.json(
      { error: 'Cron secret not configured' },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn('[Cron] Unauthorized cron request');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    console.log('[Cron] Starting finalize-cancellations job');
    await ensureSubscriptionSchema();

    const now = nowIso();
    const finalizer = new SubscriptionFinalizer();

    // Find subscriptions that are canceling and period has ended
    const subscriptions = await finalizer.findExpiredCancellations(now);

    console.log(`[Cron] Found ${subscriptions.length} subscriptions to finalize`);

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No subscriptions to finalize',
        finalized: 0
      });
    }

    let finalized = 0;
    const errors: string[] = [];

    for (const sub of subscriptions) {
      try {
        await finalizer.finalizeCancellation(sub.id, now);

        finalized++;
        console.log(`[Cron] Finalized subscription ${sub.id} for org ${sub.organization_id}`);
      } catch (error) {
        const errorMsg = `Failed to finalize subscription ${sub.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`[Cron] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    const response = {
      success: true,
      message: `Finalized ${finalized} of ${subscriptions.length} subscriptions`,
      finalized,
      total: subscriptions.length,
      errors: errors.length > 0 ? errors : undefined
    };

    console.log(`[Cron] Completed: ${response.message}`);

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Cron] Error in finalize-cancellations:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
