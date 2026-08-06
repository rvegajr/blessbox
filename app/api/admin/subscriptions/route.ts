import { NextResponse } from 'next/server';
import { withSuperAdmin } from '@/lib/api/withAuth';
import { cancelSubscription, listAllSubscriptions } from '@/lib/subscriptions';

export const GET = withSuperAdmin(async () => {
  try {
    const subs = await listAllSubscriptions();
    return NextResponse.json({ subscriptions: subs });
  } catch (error) {
    console.error('Admin subscriptions GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const DELETE = withSuperAdmin(async (req) => {
  try {
    const { subscriptionId } = await req.json().catch(() => ({}));
    if (!subscriptionId) {
      return NextResponse.json({ error: 'subscriptionId required' }, { status: 400 });
    }
    await cancelSubscription(subscriptionId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin subscriptions DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

