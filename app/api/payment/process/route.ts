import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth-helper';
import { createSubscription, getOrCreateOrganizationForEmail, PlanType, resolveOrganizationForSession } from '@/lib/subscriptions';
import { SquarePaymentService } from '@/lib/services/SquarePaymentService';

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  const body = await req.json().catch(() => ({}));
  const { 
    planType = 'standard', 
    billingCycle = 'monthly', 
    currency = 'USD',
    paymentToken,
    amount
  } = body || {};

  // Extract and validate email - prefer session email, fallback to body email
  const sessionEmail = session?.user?.email?.trim();
  const bodyEmail = typeof body?.email === 'string' ? body.email.trim() : '';
  const email = sessionEmail || bodyEmail;
  
  if (!email) {
    return new Response(JSON.stringify({ success: false, error: 'Not authenticated' }), { status: 401 });
  }

  let org;
  try {
    org = session ? await resolveOrganizationForSession(session as any) : await getOrCreateOrganizationForEmail(email);
  } catch (orgError) {
    console.error('Organization resolution error:', orgError);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to resolve organization',
        message: 'Please ensure you have selected an organization or try logging in again.'
      }), 
      { status: 500 }
    );
  }
  
  if (!org) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Organization selection required',
        message: 'Please select an organization from your dashboard before proceeding with payment.'
      }), 
      { status: 409 }
    );
  }

  // If payment token is provided, process with Square
  if (paymentToken && amount) {
    const shouldMockPayment =
      process.env.NODE_ENV !== 'production' &&
      (process.env.TEST_ENV === 'local' || !process.env.SQUARE_ACCESS_TOKEN || !process.env.SQUARE_APPLICATION_ID);

    try {
      if (!shouldMockPayment) {
        const accessToken = (process.env.SQUARE_ACCESS_TOKEN || '').trim();
        const applicationId = (process.env.SQUARE_APPLICATION_ID || '').trim();
        const locationId = (process.env.SQUARE_LOCATION_ID || '').trim();
        if (!accessToken || !applicationId || !locationId) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Payment provider not configured',
              message: 'Square is not configured on the server.',
            }),
            { status: 500 }
          );
        }

        const squarePaymentService = new SquarePaymentService();
        
        // Process payment with Square
        const paymentResult = await squarePaymentService.processPayment(
          String(paymentToken),
          Number(amount),
          String(currency || 'USD'),
          org.id
        );

        if (!paymentResult.success) {
          // Provide user-friendly error message
          const errorMessage = paymentResult.error || 'Payment failed';
          const isAuthError = errorMessage.includes('401') || errorMessage.includes('authorization');
          
          return new Response(
            JSON.stringify({
              success: false,
              error: isAuthError 
                ? 'Payment authorization failed. Please contact support - payment credentials may need to be updated.'
                : errorMessage,
              payment: paymentResult,
            }),
            { status: isAuthError ? 500 : 400 }
          );
        }

        console.log(`Square payment successful: ${paymentResult.paymentId || paymentResult.squarePaymentId}`);
      } else {
        // Local/dev: allow checkout flows without Square credentials.
        console.log(`[mock-payment] accepted token for ${email}, amount=${amount} ${currency}`);
      }
    } catch (error) {
      console.error('Square payment processing error:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Payment processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), { status: 500 });
    }
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
