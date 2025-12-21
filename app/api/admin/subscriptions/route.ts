import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';
import { isSuperAdminEmail } from '@/lib/auth';
import { cancelSubscription, listAllSubscriptions } from '@/lib/subscriptions';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email || !isSuperAdminEmail(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const subs = await listAllSubscriptions();
    return NextResponse.json({ subscriptions: subs });
  } catch (error) {
    console.error('Admin subscriptions GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email || !isSuperAdminEmail(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
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
}

