// 🎊 SQUARE PAYMENT SERVICE - THE MOST JOYFUL PAYMENT SYSTEM EVER! 💰
// REAL MONEY FLOW! NO MOCKS! PURE SQUARE INTEGRATION BLISS! ✨

import type {
  IPaymentService,
  PaymentIntentData,
  PaymentIntentResult,
  PaymentData,
  PaymentResult,
  PaymentStatus,
  RefundResult,
  PaymentMethod,
  CouponResult,
  SquarePaymentRequest,
  SquarePaymentResponse
} from '../../interfaces/payment/IPaymentService';
import { createDatabaseConnection, getDatabase } from '../../database/connection';
import { paymentTransactions, couponCodes, subscriptionPlans } from '../../database/schema';
import { eq, and, gte } from 'drizzle-orm';

export class SquarePaymentService implements IPaymentService {
  private readonly squareApplicationId: string;
  private readonly squareAccessToken: string;
  private readonly squareEnvironment: 'sandbox' | 'production';
  private readonly squareBaseUrl: string;

  constructor() {
    // 🌟 Initialize Square configuration with PURE JOY!
    this.squareApplicationId = process.env.SQUARE_APPLICATION_ID || '';
    this.squareAccessToken = process.env.SQUARE_ACCESS_TOKEN || '';
    this.squareEnvironment = (process.env.SQUARE_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox';
    this.squareBaseUrl = this.squareEnvironment === 'production' 
      ? 'https://connect.squareup.com' 
      : 'https://connect.squareupsandbox.com';

    if (!this.squareApplicationId || !this.squareAccessToken) {
      console.warn('⚠️ Square credentials not configured. Payment processing will fail.');
    }

    console.log(`🎉 Square Payment Service initialized in ${this.squareEnvironment} mode! 💰`);
  }

  // 🎯 CREATE PAYMENT INTENT - Pure preparation magic!
  async createPaymentIntent(data: PaymentIntentData): Promise<PaymentIntentResult> {
    try {
      console.log(`🚀 Creating payment intent for ${data.organizationId} - ${data.planType} plan! ✨`);

      // 🎫 Apply coupon if provided
      let finalAmount = data.amount;
      let couponData = null;

      if (data.couponCode) {
        const couponResult = await this.validateCoupon(data.couponCode, data.planType);
        if (couponResult.valid && couponResult.finalAmount) {
          finalAmount = couponResult.finalAmount;
          couponData = couponResult;
          console.log(`🎫 Coupon applied! Discount: $${((data.amount - finalAmount) / 100).toFixed(2)}`);
        }
      }

      // 🎊 For Square, we don't create a separate payment intent
      // Instead, we prepare the data for the client-side Square Web Payments SDK
      const paymentIntentId = `pi_${crypto.randomUUID()}`;

      // 💾 Store payment intent in database for tracking
      await createDatabaseConnection();
      const db = getDatabase();

      await db.insert(paymentTransactions).values({
        id: paymentIntentId,
        organizationId: data.organizationId,
        planType: data.planType,
        amount: finalAmount,
        currency: data.currency,
        status: 'pending',
        paymentProvider: 'square',
        customerEmail: data.customerEmail,
        couponCode: data.couponCode || null,
        couponDiscount: couponData ? data.amount - finalAmount : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      console.log(`🎉 Payment intent created! ID: ${paymentIntentId} Amount: $${(finalAmount / 100).toFixed(2)} ✨`);

      return {
        success: true,
        paymentIntentId,
        amount: finalAmount,
        currency: data.currency,
        message: 'Payment intent created successfully! 🎊'
      };

    } catch (error) {
      console.error('💔 Create payment intent failed:', error);
      return {
        success: false,
        message: 'Failed to create payment intent',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ✅ PROCESS PAYMENT - Real Square magic!
  async processPayment(paymentToken: string, paymentData: PaymentData): Promise<PaymentResult> {
    try {
      console.log(`💳 Processing Square payment for ${paymentData.organizationId}! PURE MONEY MAGIC! ✨`);

      // 🎫 Apply coupon discount if provided
      let finalAmount = paymentData.amount;
      if (paymentData.couponCode) {
        const couponResult = await this.validateCoupon(paymentData.couponCode, paymentData.planType);
        if (couponResult.valid && couponResult.finalAmount) {
          finalAmount = couponResult.finalAmount;
        }
      }

      // 🚀 Prepare Square payment request
      const squareRequest: SquarePaymentRequest = {
        sourceId: paymentToken, // From Square Web Payments SDK
        amountMoney: {
          amount: finalAmount,
          currency: paymentData.currency
        },
        idempotencyKey: crypto.randomUUID(),
        buyerEmailAddress: paymentData.billingAddress.email,
        billingAddress: {
          addressLine1: paymentData.billingAddress.addressLine1,
          addressLine2: paymentData.billingAddress.addressLine2,
          locality: paymentData.billingAddress.city,
          administrativeDistrictLevel1: paymentData.billingAddress.state,
          postalCode: paymentData.billingAddress.postalCode,
          country: paymentData.billingAddress.country,
          firstName: paymentData.billingAddress.firstName,
          lastName: paymentData.billingAddress.lastName
        },
        note: `BlessBox ${paymentData.planType} plan subscription`
      };

      // 💰 Make payment request to Square
      const response = await fetch(`${this.squareBaseUrl}/v2/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.squareAccessToken}`,
          'Content-Type': 'application/json',
          'Square-Version': '2023-10-18'
        },
        body: JSON.stringify(squareRequest)
      });

      const squareResult: SquarePaymentResponse = await response.json();

      if (squareResult.errors && squareResult.errors.length > 0) {
        const errorMessage = squareResult.errors.map(e => e.detail).join(', ');
        console.error('💔 Square payment failed:', errorMessage);

        // 💾 Update payment status in database
        await this.updatePaymentStatus(paymentData.organizationId, 'failed', undefined, errorMessage);

        return {
          success: false,
          message: 'Payment failed',
          error: errorMessage
        };
      }

      if (!squareResult.payment) {
        throw new Error('No payment object returned from Square');
      }

      const payment = squareResult.payment;
      console.log(`🎊 SQUARE PAYMENT SUCCESS! Payment ID: ${payment.id} Amount: $${(payment.amountMoney.amount / 100).toFixed(2)} ✨`);

      // 💾 Update payment status in database
      await this.updatePaymentStatus(
        paymentData.organizationId, 
        payment.status === 'COMPLETED' ? 'completed' : 'pending',
        payment.id,
        undefined,
        payment.receiptUrl
      );

      // 🎯 Create/update subscription
      await this.createSubscription(paymentData.organizationId, paymentData.planType, payment.id);

      return {
        success: true,
        paymentId: payment.id,
        transactionId: payment.id,
        amount: payment.amountMoney.amount,
        currency: payment.amountMoney.currency,
        status: payment.status === 'COMPLETED' ? 'completed' : 'pending',
        receiptUrl: payment.receiptUrl,
        message: 'Payment processed successfully! Welcome to BlessBox! 🎉'
      };

    } catch (error) {
      console.error('💔 Process payment failed:', error);
      
      // 💾 Update payment status to failed
      await this.updatePaymentStatus(paymentData.organizationId, 'failed', undefined, error instanceof Error ? error.message : 'Unknown error');

      return {
        success: false,
        message: 'Payment processing failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // 🔍 GET PAYMENT STATUS - Pure tracking magic!
  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      console.log(`🔍 Getting payment status for ${paymentId}! ✨`);

      await createDatabaseConnection();
      const db = getDatabase();

      const [payment] = await db
        .select()
        .from(paymentTransactions)
        .where(eq(paymentTransactions.squarePaymentId, paymentId))
        .limit(1);

      if (!payment) {
        throw new Error('Payment not found');
      }

      return {
        paymentId: payment.id,
        status: payment.status as any,
        amount: payment.amount,
        currency: payment.currency,
        createdAt: new Date(payment.createdAt),
        completedAt: payment.completedAt ? new Date(payment.completedAt) : undefined,
        failureReason: payment.failureReason || undefined,
        receiptUrl: payment.receiptUrl || undefined
      };

    } catch (error) {
      console.error('💔 Get payment status failed:', error);
      throw new Error('Failed to get payment status');
    }
  }

  // 🔄 PROCESS REFUND - Graceful money return!
  async processRefund(paymentId: string, amount?: number): Promise<RefundResult> {
    try {
      console.log(`🔄 Processing refund for payment ${paymentId}! 💰`);

      // 🎯 Get original payment details
      const paymentStatus = await this.getPaymentStatus(paymentId);
      const refundAmount = amount || paymentStatus.amount;

      // 🚀 Make refund request to Square
      const refundRequest = {
        idempotencyKey: crypto.randomUUID(),
        amountMoney: {
          amount: refundAmount,
          currency: paymentStatus.currency
        },
        paymentId: paymentId,
        reason: 'Customer requested refund'
      };

      const response = await fetch(`${this.squareBaseUrl}/v2/refunds`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.squareAccessToken}`,
          'Content-Type': 'application/json',
          'Square-Version': '2023-10-18'
        },
        body: JSON.stringify(refundRequest)
      });

      const refundResult = await response.json();

      if (refundResult.errors && refundResult.errors.length > 0) {
        const errorMessage = refundResult.errors.map((e: any) => e.detail).join(', ');
        return {
          success: false,
          message: 'Refund failed',
          error: errorMessage
        };
      }

      console.log(`🎊 REFUND SUCCESS! Refund ID: ${refundResult.refund?.id} ✨`);

      return {
        success: true,
        refundId: refundResult.refund?.id,
        amount: refundAmount,
        status: 'completed',
        message: 'Refund processed successfully! 🎉'
      };

    } catch (error) {
      console.error('💔 Process refund failed:', error);
      return {
        success: false,
        message: 'Refund processing failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // 💳 GET CUSTOMER PAYMENT METHODS - Pure convenience!
  async getCustomerPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    try {
      // 🎯 For Square, we don't store payment methods on our side
      // This would typically integrate with Square's Customer API
      console.log(`💳 Getting payment methods for customer ${customerId}! ✨`);

      // 🚀 This is a placeholder - in real implementation, you'd call Square's Customer API
      return [];

    } catch (error) {
      console.error('💔 Get payment methods failed:', error);
      return [];
    }
  }

  // 🎫 VALIDATE COUPON - Pure discount magic!
  async validateCoupon(couponCode: string, planType: string): Promise<CouponResult> {
    try {
      console.log(`🎫 Validating coupon ${couponCode} for ${planType} plan! ✨`);

      await createDatabaseConnection();
      const db = getDatabase();

      const [coupon] = await db
        .select()
        .from(couponCodes)
        .where(
          and(
            eq(couponCodes.code, couponCode.toUpperCase()),
            eq(couponCodes.isActive, true),
            gte(couponCodes.expiresAt, new Date().toISOString())
          )
        )
        .limit(1);

      if (!coupon) {
        return {
          valid: false,
          message: 'Invalid or expired coupon code',
          error: 'Coupon not found'
        };
      }

      // 🎯 Check if coupon applies to this plan
      const applicablePlans = JSON.parse(coupon.applicablePlans as string);
      if (!applicablePlans.includes(planType)) {
        return {
          valid: false,
          message: 'Coupon not valid for this plan',
          error: 'Plan not applicable'
        };
      }

      // 💰 Calculate discount
      const planAmount = planType === 'standard' ? 999 : 2999; // $9.99 or $29.99
      const discountAmount = coupon.discountType === 'percentage'
        ? Math.round(planAmount * (coupon.discountValue / 100))
        : coupon.discountValue;

      const finalAmount = Math.max(0, planAmount - discountAmount);

      console.log(`🎉 COUPON VALID! Discount: $${(discountAmount / 100).toFixed(2)} Final: $${(finalAmount / 100).toFixed(2)} ✨`);

      return {
        valid: true,
        couponCode: coupon.code,
        discountType: coupon.discountType as 'percentage' | 'fixed_amount',
        discountValue: coupon.discountValue,
        discountAmount,
        finalAmount,
        expiresAt: new Date(coupon.expiresAt),
        message: `Coupon applied! You save $${(discountAmount / 100).toFixed(2)}! 🎊`
      };

    } catch (error) {
      console.error('💔 Validate coupon failed:', error);
      return {
        valid: false,
        message: 'Failed to validate coupon',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // 🔧 PRIVATE: Update payment status in database
  private async updatePaymentStatus(
    organizationId: string, 
    status: string, 
    squarePaymentId?: string, 
    failureReason?: string,
    receiptUrl?: string
  ): Promise<void> {
    try {
      await createDatabaseConnection();
      const db = getDatabase();

      const updateData: any = {
        status,
        updatedAt: new Date().toISOString()
      };

      if (squarePaymentId) updateData.squarePaymentId = squarePaymentId;
      if (failureReason) updateData.failureReason = failureReason;
      if (receiptUrl) updateData.receiptUrl = receiptUrl;
      if (status === 'completed') updateData.completedAt = new Date().toISOString();

      await db
        .update(paymentTransactions)
        .set(updateData)
        .where(eq(paymentTransactions.organizationId, organizationId));

      console.log(`✅ Payment status updated to ${status} for ${organizationId}! ✨`);

    } catch (error) {
      console.error('💔 Update payment status failed:', error);
    }
  }

  // 🔧 PRIVATE: Create subscription after successful payment
  private async createSubscription(organizationId: string, planType: string, paymentId: string): Promise<void> {
    try {
      await createDatabaseConnection();
      const db = getDatabase();

      // 🎯 Calculate next billing date (monthly)
      const nextBillingDate = new Date();
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

      await db.insert(subscriptionPlans).values({
        id: crypto.randomUUID(),
        organizationId,
        planType,
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: nextBillingDate.toISOString(),
        paymentProvider: 'square',
        externalSubscriptionId: paymentId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      console.log(`🎊 SUBSCRIPTION CREATED! Plan: ${planType} for ${organizationId} ✨`);

    } catch (error) {
      console.error('💔 Create subscription failed:', error);
    }
  }
}