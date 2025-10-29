import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/authOptions';
import { createSubscription, getActiveSubscription, getOrCreateOrganizationForEmail, PlanType } from '@/lib/subscriptions';

export async function GET() {
  const session = await getServerSession(authOptions as any);
  const email = session?.user?.email;
  if (!email) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const org = await getOrCreateOrganizationForEmail(email);
  if (!org) return new Response(JSON.stringify({ error: 'No organization' }), { status: 400 });
  const active = await getActiveSubscription(org.id);
  return new Response(JSON.stringify({ subscription: active || null }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions as any);
  const email = session?.user?.email;
  if (!email) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const { planType = 'standard', billingCycle = 'monthly', currency = 'USD' } = await req.json().catch(() => ({}));
  const org = await getOrCreateOrganizationForEmail(email);
  if (!org) return new Response(JSON.stringify({ error: 'No organization' }), { status: 400 });
  const sub = await createSubscription({ organizationId: org.id, planType: planType as PlanType, billingCycle, currency });
  return new Response(JSON.stringify({ subscription: sub }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

