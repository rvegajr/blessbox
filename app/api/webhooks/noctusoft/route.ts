/**
 * POST /api/webhooks/noctusoft
 *
 * Receives forwarded Square webhook events from the Noctusoft relay.
 * Events: subscription.created, subscription.updated, invoice.payment_made,
 *         invoice.scheduled_charge_failed, payment.created, payment.updated,
 *         refund.created, refund.updated
 *
 * P0 Fix: Verifies HMAC signature from Noctusoft relay for security.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { createHmac, timingSafeEqual } from 'crypto';

export const runtime = 'nodejs';

/**
 * Verify HMAC signature from Noctusoft relay
 */
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    // Timing-safe comparison to prevent timing attacks
    const signatureBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    
    if (signatureBuffer.length !== expectedBuffer.length) {
      return false;
    }
    
    return timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  // P0 Fix: Verify HMAC signature before processing
  const signature = request.headers.get('x-noctusoft-signature') || request.headers.get('x-webhook-signature');
  const webhookSecret = process.env.NOCTUSOFT_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    console.warn('[webhook/noctusoft] No NOCTUSOFT_WEBHOOK_SECRET configured, skipping HMAC verification');
  } else if (!signature) {
    console.error('[webhook/noctusoft] No signature header found');
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  let body: any;
  let rawBody: string;
  try {
    rawBody = await request.text();
    body = JSON.parse(rawBody);
    
    // Verify HMAC if secret is configured
    if (webhookSecret && signature) {
      const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.error('[webhook/noctusoft] Invalid HMAC signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
      console.log('[webhook/noctusoft] HMAC signature verified successfully');
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventType = body?.type;
  const data = body?.data?.object;

  console.log(`[webhook/noctusoft] Event: ${eventType}`, JSON.stringify(body).slice(0, 500));

  if (!eventType || !data) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const db = getDbClient();
  const now = new Date().toISOString();

  try {
    switch (eventType) {
      case 'subscription.created':
      case 'subscription.updated': {
        const subscriptionId = data.id;
        const status = data.status; // ACTIVE, CANCELED, PAUSED, etc.
        const customerId = data.customer_id;

        // Log the event
        console.log(`[webhook/noctusoft] Subscription ${subscriptionId} → ${status} (customer: ${customerId})`);

        // Update subscription status if we have a matching record
        await db.execute({
          sql: `UPDATE subscription_plans SET status = ?, updated_at = ? WHERE external_subscription_id = ?`,
          args: [status?.toLowerCase() || 'active', now, subscriptionId],
        });
        break;
      }

      case 'invoice.payment_made': {
        const subscriptionId = data.subscription_id;
        const invoiceId = data.id;
        console.log(`[webhook/noctusoft] Invoice paid: ${invoiceId} for subscription ${subscriptionId}`);

        // Extend subscription period
        if (subscriptionId) {
          await db.execute({
            sql: `UPDATE subscription_plans SET status = 'active', current_period_end = ?, updated_at = ? WHERE external_subscription_id = ?`,
            args: [new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), now, subscriptionId],
          });
        }
        break;
      }

      case 'invoice.scheduled_charge_failed': {
        const subscriptionId = data.subscription_id;
        console.log(`[webhook/noctusoft] Charge failed for subscription ${subscriptionId}`);

        if (subscriptionId) {
          await db.execute({
            sql: `UPDATE subscription_plans SET status = 'past_due', updated_at = ? WHERE external_subscription_id = ?`,
            args: [now, subscriptionId],
          });
        }
        break;
      }

      case 'payment.created':
      case 'payment.updated': {
        const paymentId = data.id;
        const status = data.status;
        const amountMoney = data.amount_money;
        console.log(`[webhook/noctusoft] Payment ${paymentId}: ${status} ($${(amountMoney?.amount || 0) / 100})`);
        break;
      }

      case 'refund.created':
      case 'refund.updated': {
        const refundId = data.id;
        const status = data.status;
        console.log(`[webhook/noctusoft] Refund ${refundId}: ${status}`);
        break;
      }

      default:
        console.log(`[webhook/noctusoft] Unhandled event type: ${eventType}`);
    }
  } catch (err) {
    console.error(`[webhook/noctusoft] Error processing ${eventType}:`, err);
    // Still return 200 so the relay doesn't retry indefinitely
  }

  return NextResponse.json({ received: true });
}
