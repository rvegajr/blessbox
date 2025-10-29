import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/authOptions';
import { createSubscription, getOrCreateOrganizationForEmail, PlanType } from '@/lib/subscriptions';
import { SquarePaymentService } from '@/lib/services/SquarePaymentService';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions as any);
  const body = await req.json().catch(() => ({}));
  const { 
    planType = 'standard', 
    billingCycle = 'monthly', 
    currency = 'USD',
    paymentToken,
    amount
  } = body || {};

  const email = session?.user?.email || body?.email;
  if (!email) {
    return new Response(JSON.stringify({ success: false, error: 'Not authenticated' }), { status: 401 });
  }

  // If payment token is provided, process with Square
  if (paymentToken && amount) {
    try {
      const squarePaymentService = new SquarePaymentService();
      
      // Process payment with Square
      const paymentResult = await squarePaymentService.processPayment(
        paymentToken, // This is the card nonce from Square
        paymentToken, // Square uses the same token for both parameters
        email
      );

      if (!paymentResult.success) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: paymentResult.error || 'Payment failed',
          message: paymentResult.message
        }), { status: 400 });
      }

      console.log(`Square payment successful: ${paymentResult.transactionId}`);
    } catch (error) {
      console.error('Square payment processing error:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Payment processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), { status: 500 });
    }
  }

  const org = await getOrCreateOrganizationForEmail(email);
  if (!org) {
    return new Response(JSON.stringify({ success: false, error: 'Organization not found' }), { status: 400 });
  }

  const sub = await createSubscription({ 
    organizationId: org.id, 
    planType: planType as PlanType, 
    billingCycle, 
    currency 
  });
  
  return new Response(JSON.stringify({ 
    success: true, 
    subscription: sub,
    ...(paymentToken && { transactionId: 'square-tx-' + Date.now() })
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
