import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/authOptions';
import { cancelSubscription, listAllSubscriptions } from '@/lib/subscriptions';

function isSuper(session: any): boolean {
  return (session?.user as any)?.role === 'superadmin';
}

export async function GET() {
  const session = await getServerSession(authOptions as any);
  if (!isSuper(session)) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  const subs = await listAllSubscriptions();
  return new Response(JSON.stringify({ subscriptions: subs }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions as any);
  if (!isSuper(session)) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  const { subscriptionId } = await req.json().catch(() => ({}));
  if (!subscriptionId) return new Response(JSON.stringify({ error: 'subscriptionId required' }), { status: 400 });
  await cancelSubscription(subscriptionId);
  return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

