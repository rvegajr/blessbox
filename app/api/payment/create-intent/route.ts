import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  const body = await req.json().catch(() => ({}));
  const { planType = 'standard', amount = null, currency = 'USD' } = body || {};

  const intentId = `pi_${Math.random().toString(36).slice(2)}`;
  return new Response(
    JSON.stringify({ success: true, intentId, planType, amount, currency, user: session?.user?.email || null }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

