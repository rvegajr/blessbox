import { Client, Environment, ApiError } from 'square';
import { IPaymentService, PaymentIntent, PaymentResult } from '../interfaces/IPaymentService';

export class SquarePaymentService implements IPaymentService {
  private client: Client;
  private environment: Environment;

  constructor() {
    // Initialize Square client
    this.environment = process.env.NODE_ENV === 'production' 
      ? Environment.Production 
      : Environment.Sandbox;
    
    this.client = new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN!,
      environment: this.environment,
    });
  }

  async createPaymentIntent(
    amountCents: number, 
    currency: string, 
    organizationId: string, 
    description?: string
  ): Promise<PaymentIntent> {
    try {
      const request = {
        sourceId: 'cnon_placeholder', // Will be replaced with actual card nonce
        amountMoney: {
          amount: amountCents,
          currency: currency,
        },
        idempotencyKey: `${organizationId}-${Date.now()}`,
        note: description || `Payment for organization ${organizationId}`,
      };

      const response = await this.client.paymentsApi.createPayment(request);
      
      if (response.result.payment) {
        return {
          id: response.result.payment.id!,
          clientSecret: response.result.payment.id!, // Square uses payment ID as client secret
          status: response.result.payment.status!,
          amount: amountCents,
          currency: currency,
        };
      }

      throw new Error('Failed to create payment intent');
    } catch (error) {
      console.error('Square payment intent creation failed:', error);
      throw new Error(`Payment intent creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async processPayment(
    paymentIntentId: string, 
    paymentMethodToken: string, 
    organizationId: string
  ): Promise<PaymentResult> {
    try {
      // In Square, we create the payment directly with the card nonce
      const request = {
        sourceId: paymentMethodToken,
        amountMoney: {
          amount: 0, // Will be set from payment intent
          currency: 'USD',
        },
        idempotencyKey: `${organizationId}-${Date.now()}`,
        note: `Payment for organization ${organizationId}`,
      };

      const response = await this.client.paymentsApi.createPayment(request);
      
      if (response.result.payment) {
        const payment = response.result.payment;
        return {
          success: payment.status === 'COMPLETED',
          message: payment.status === 'COMPLETED' ? 'Payment successful' : `Payment ${payment.status}`,
          transactionId: payment.id!,
        };
      }

      return {
        success: false,
        message: 'Payment processing failed',
        error: 'No payment returned from Square',
      };
    } catch (error) {
      console.error('Square payment processing failed:', error);
      return {
        success: false,
        message: 'Payment processing failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async refundPayment(
    transactionId: string, 
    amountCents: number, 
    organizationId: string, 
    reason?: string
  ): Promise<PaymentResult> {
    try {
      const request = {
        paymentId: transactionId,
        amountMoney: {
          amount: amountCents,
          currency: 'USD',
        },
        reason: reason || 'Refund requested',
        idempotencyKey: `${organizationId}-refund-${Date.now()}`,
      };

      const response = await this.client.refundsApi.refundPayment(request);
      
      if (response.result.refund) {
        return {
          success: true,
          message: 'Refund successful',
          transactionId: response.result.refund.id!,
        };
      }

      return {
        success: false,
        message: 'Refund failed',
        error: 'No refund returned from Square',
      };
    } catch (error) {
      console.error('Square refund failed:', error);
      return {
        success: false,
        message: 'Refund failed',
        error: error instanceof Error ? error.message : 'Unknown error',
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
}
