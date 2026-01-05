import { SquareClient, SquareEnvironment, SquareError } from 'square';
import type { PaymentIntent, PaymentResult, RefundResult } from '../interfaces/IPaymentService';
import type { IPaymentProcessor } from '../interfaces/IPaymentProcessor';

export class SquarePaymentService implements IPaymentProcessor {
  private client: SquareClient;
  private environment: SquareEnvironment;

  constructor() {
    // Initialize Square client
    const env = (process.env.SQUARE_ENVIRONMENT || '').trim().toLowerCase();
    this.environment = env === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox;

    // Vercel env vars can accidentally include trailing newlines/spaces.
    const accessToken = (process.env.SQUARE_ACCESS_TOKEN || '').trim();
    if (!accessToken) {
      throw new Error('Square is not configured: SQUARE_ACCESS_TOKEN is missing');
    }
    
    this.client = new SquareClient({
      accessToken,
      environment: this.environment,
    });
  }

  async createPaymentIntent(
    amount: number,
    currency: string,
    metadata?: Record<string, any>
  ): Promise<PaymentIntent> {
    try {
      // Square does not have a Stripe-like "intent" flow for the Web Payments SDK.
      // We return a synthetic intent payload so the app has a consistent interface.
      const id = (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) as string;
      return {
        id,
        amount,
        currency,
        status: 'pending',
        clientSecret: id,
        createdAt: new Date().toISOString(),
        ...(metadata ? { metadata } : {}),
      } as any;
    } catch (error) {
      console.error('Square payment intent creation failed:', error);
      throw new Error(`Payment intent creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async processPayment(
    sourceId: string,
    amount: number,
    currency: string,
    customerId?: string
  ): Promise<PaymentResult> {
    const startTime = Date.now();
    console.log('[SQUARE] processPayment called:', {
      timestamp: new Date().toISOString(),
      sourceIdLength: sourceId?.length || 0,
      sourceIdPrefix: sourceId?.substring(0, 20) || 'none',
      amount,
      currency,
      customerId,
      environment: this.environment === SquareEnvironment.Production ? 'production' : 'sandbox',
    });

    try {
      const idempotencyKey = (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`) as string;
      
      console.log('[SQUARE] Creating payment request:', {
        idempotencyKey,
        amount,
        currency,
        hasCustomerId: !!customerId,
      });

      const requestPayload = {
        sourceId,
        amountMoney: { amount: BigInt(amount), currency },
        idempotencyKey,
        ...(customerId ? { customerId } : {}),
        note: customerId ? `BlessBox subscription payment (${customerId})` : 'BlessBox subscription payment',
      };

      const response = await this.client.payments.create(requestPayload);

      const duration = Date.now() - startTime;
      console.log('[SQUARE] Payment API response received:', {
        duration: `${duration}ms`,
        hasResult: !!response.result,
        hasPayment: !!response.result?.payment,
        paymentId: response.result?.payment?.id,
        paymentStatus: response.result?.payment?.status,
        paymentAmount: response.result?.payment?.amountMoney?.amount?.toString(),
        paymentCurrency: response.result?.payment?.amountMoney?.currency,
      });

      const payment = response.result.payment;
      if (!payment?.id) {
        console.error('[SQUARE] ❌ No payment ID in response:', {
          response: JSON.stringify(response.result, null, 2),
        });
        return { success: false, error: 'No payment returned from Square' };
      }

      const result = {
        success: payment.status === 'COMPLETED',
        paymentId: payment.id,
        squarePaymentId: payment.id,
        amount,
        currency,
        ...(payment.status === 'COMPLETED' ? {} : { error: `Payment ${payment.status || 'UNKNOWN'}` }),
      };

      if (result.success) {
        console.log('[SQUARE] ✅ Payment successful:', {
          paymentId: result.paymentId,
          amount: result.amount,
          currency: result.currency,
        });
      } else {
        console.warn('[SQUARE] ⚠️ Payment not completed:', {
          paymentId: result.paymentId,
          status: payment.status,
          error: result.error,
        });
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const details = (() => {
        if (error instanceof SquareError) {
          const errs = (error as any)?.errors;
          const msg =
            Array.isArray(errs) && errs.length > 0
              ? errs.map((e: any) => e?.detail || e?.code).filter(Boolean).join('; ')
              : '';
          
          console.error('[SQUARE] ❌ SquareError caught:', {
            duration: `${duration}ms`,
            statusCode: error.statusCode,
            errors: errs,
            message: msg,
            fullError: JSON.stringify(error, Object.getOwnPropertyNames(error)),
          });
          
          // Provide user-friendly error messages for common issues
          if (error.statusCode === 401) {
            return `Square payment authorization failed. Please contact support - your payment credentials may need to be updated.`;
          }
          
          return `Square error${error.statusCode ? ` (${error.statusCode})` : ''}${msg ? `: ${msg}` : ''}`;
        }
        return error instanceof Error ? error.message : String(error);
      })();
      
      console.error('[SQUARE] ❌ Payment processing failed:', {
        duration: `${duration}ms`,
        error: details,
        errorType: error instanceof SquareError ? 'SquareError' : error instanceof Error ? 'Error' : typeof error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      return {
        success: false,
        error: details || 'Payment processing failed',
      };
    }
  }

  async refundPayment(
    paymentId: string,
    amount?: number,
    reason?: string
  ): Promise<RefundResult> {
    try {
      const request = {
        paymentId,
        ...(typeof amount === 'number'
          ? {
              amountMoney: {
                amount: BigInt(amount),
                currency: 'USD',
              },
            }
          : {}),
        reason: reason || 'Refund requested',
        idempotencyKey:
          (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`) as string,
      };

      const response = await this.client.refunds.refundPayment(request as any);
      
      if (response.result.refund) {
        return {
          success: true,
          refundId: response.result.refund.id!,
          squareRefundId: response.result.refund.id!,
          ...(typeof amount === 'number' ? { amount } : {}),
        };
      }

      return {
        success: false,
        error: 'No refund returned from Square',
      };
    } catch (error) {
      const details = error instanceof SquareError
        ? `Square error${error.statusCode ? ` (${error.statusCode})` : ''}`
        : (error instanceof Error ? error.message : String(error));
      console.error('Square refund failed:', details);
      return {
        success: false,
        error: details || 'Refund failed',
      };
    }
  }

  // Helper method to get Square application ID for frontend
  getApplicationId(): string {
    return process.env.SQUARE_APPLICATION_ID || '';
  }

  // Helper method to get Square location ID
  getLocationId(): string {
    return process.env.SQUARE_LOCATION_ID || '';
  }

  // Customer + subscription operations intentionally excluded (ISP).
}
