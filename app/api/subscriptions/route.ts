import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';
import { createSubscription, getActiveSubscription, resolveOrganizationForSession } from '@/lib/subscriptions';

export async function GET() {
  const session = await getServerSession();
  const email = session?.user?.email;
  if (!email) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const org = session ? await resolveOrganizationForSession(session as any) : null;
  if (!org) return new Response(JSON.stringify({ error: 'Organization selection required' }), { status: 409 });
  const active = await getActiveSubscription(org.id);
  return new Response(JSON.stringify({ subscription: active || null }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  const email = session?.user?.email;
  if (!email) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const { planType = 'free', billingCycle = 'monthly', currency = 'USD' } = await req.json().catch(() => ({}));
  // Paid plans must be purchased and server-verified (Square charge via
  // /api/payment/process, or a verified order via activate-subscription) — they
  // can NEVER be self-granted here. Only the free plan may be self-provisioned.
  if (planType !== 'free') {
    return new Response(
      JSON.stringify({ error: 'Paid plans must be purchased via checkout', purchaseVia: '/api/payment/process' }),
      { status: 402, headers: { 'Content-Type': 'application/json' } },
    );
  }
  const org = session ? await resolveOrganizationForSession(session as any) : null;
  if (!org) return new Response(JSON.stringify({ error: 'Organization selection required' }), { status: 409 });
  const sub = await createSubscription({ organizationId: org.id, planType: 'free', billingCycle, currency });
  return new Response(JSON.stringify({ subscription: sub }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

