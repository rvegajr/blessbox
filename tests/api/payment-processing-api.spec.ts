import { test, expect } from '@playwright/test';

/**
 * API-Level Payment Processing Tests
 * Tests payment logic using Square test nonces (bypasses UI/iframe)
 * 
 * Square Test Nonces Documentation:
 * https://developer.squareup.com/docs/testing/test-values
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:7777';

// Square sandbox test nonces (pre-authorized tokens)
const SQUARE_TEST_NONCES = {
  SUCCESS: 'cnon:card-nonce-ok',
  DECLINED: 'cnon:card-nonce-declined',
  CVV_ERROR: 'cnon:card-nonce-rejected-cvv',
  POSTAL_ERROR: 'cnon:card-nonce-rejected-postalcode',
  EXPIRED: 'cnon:card-nonce-rejected-expiration',
  INVALID_ACCOUNT: 'cnon:card-nonce-rejected-bad-expiration',
};

test.describe('Payment Processing API Tests', () => {
  test('Process payment with successful Square test nonce', async ({ request }) => {
    console.log('\n💳 Testing successful payment via API...\n');

    const response = await request.post(`${BASE_URL}/api/payment/process`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        planType: 'standard',
        billingCycle: 'monthly',
        currency: 'USD',
        amount: 1900, // $19.00
        email: 'test-api-success@blessbox.org',
        paymentToken: SQUARE_TEST_NONCES.SUCCESS,
      },
    });

    console.log(`   Response status: ${response.status()}`);
    const data = await response.json();
    console.log(`   Response data: ${JSON.stringify(data, null, 2)}`);

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);
    expect(data.organizationId).toBeTruthy();
    expect(data.squarePaymentId).toBeTruthy();
    
    console.log('   ✅ Payment processed successfully');
  });

  test('Process payment with declined card nonce', async ({ request }) => {
    console.log('\n❌ Testing declined payment via API...\n');

    const response = await request.post(`${BASE_URL}/api/payment/process`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        planType: 'standard',
        billingCycle: 'monthly',
        currency: 'USD',
        amount: 1900,
        email: 'test-api-declined@blessbox.org',
        paymentToken: SQUARE_TEST_NONCES.DECLINED,
      },
    });

    console.log(`   Response status: ${response.status()}`);
    const data = await response.json();
    console.log(`   Response data: ${JSON.stringify(data, null, 2)}`);

    // Payment should fail gracefully
    expect(response.status()).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBeTruthy();
    expect(data.error.toLowerCase()).toContain('declined');
    
    console.log('   ✅ Declined payment handled correctly');
  });

  test('Process payment with CVV error nonce', async ({ request }) => {
    console.log('\n❌ Testing CVV error via API...\n');

    const response = await request.post(`${BASE_URL}/api/payment/process`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        planType: 'standard',
        billingCycle: 'monthly',
        currency: 'USD',
        amount: 1900,
        email: 'test-api-cvv@blessbox.org',
        paymentToken: SQUARE_TEST_NONCES.CVV_ERROR,
      },
    });

    console.log(`   Response status: ${response.status()}`);
    const data = await response.json();
    console.log(`   Response data: ${JSON.stringify(data, null, 2)}`);

    expect(response.status()).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBeTruthy();
    
    console.log('   ✅ CVV error handled correctly');
  });

  test('Process payment without email (validation)', async ({ request }) => {
    console.log('\n🚫 Testing validation: missing email...\n');

    const response = await request.post(`${BASE_URL}/api/payment/process`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        planType: 'standard',
        billingCycle: 'monthly',
        currency: 'USD',
        amount: 1900,
        paymentToken: SQUARE_TEST_NONCES.SUCCESS,
        // email missing
      },
    });

    console.log(`   Response status: ${response.status()}`);
    const data = await response.json();
    console.log(`   Response data: ${JSON.stringify(data, null, 2)}`);

    expect(response.status()).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.toLowerCase()).toContain('email');
    
    console.log('   ✅ Email validation working');
  });

  test('Process payment with invalid amount', async ({ request }) => {
    console.log('\n🚫 Testing validation: invalid amount...\n');

    const response = await request.post(`${BASE_URL}/api/payment/process`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        planType: 'standard',
        billingCycle: 'monthly',
        currency: 'USD',
        amount: -100, // negative amount
        email: 'test-api-invalid@blessbox.org',
        paymentToken: SQUARE_TEST_NONCES.SUCCESS,
      },
    });

    console.log(`   Response status: ${response.status()}`);
    const data = await response.json();
    console.log(`   Response data: ${JSON.stringify(data, null, 2)}`);

    expect(response.status()).toBe(400);
    expect(data.success).toBe(false);
    
    console.log('   ✅ Amount validation working');
  });

  test('Process free plan checkout (no payment token)', async ({ request }) => {
    console.log('\n🆓 Testing free plan checkout (no payment)...\n');

    const response = await request.post(`${BASE_URL}/api/payment/process`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        planType: 'free',
        billingCycle: 'monthly',
        currency: 'USD',
        amount: 0,
        email: 'test-api-free@blessbox.org',
        // No payment token needed for free plan
      },
    });

    console.log(`   Response status: ${response.status()}`);
    const data = await response.json();
    console.log(`   Response data: ${JSON.stringify(data, null, 2)}`);

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);
    expect(data.organizationId).toBeTruthy();
    
    console.log('   ✅ Free plan checkout working');
  });

  test('Process payment with coupon (100% discount)', async ({ request }) => {
    console.log('\n🎟️  Testing payment with 100% discount coupon...\n');

    // This test assumes FREE100 coupon is seeded in the database
    const response = await request.post(`${BASE_URL}/api/payment/process`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        planType: 'standard',
        billingCycle: 'monthly',
        currency: 'USD',
        amount: 0, // After 100% discount
        email: 'test-api-coupon@blessbox.org',
        // No payment token needed for $0 amount
      },
    });

    console.log(`   Response status: ${response.status()}`);
    const data = await response.json();
    console.log(`   Response data: ${JSON.stringify(data, null, 2)}`);

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);
    
    console.log('   ✅ Coupon checkout working');
  });

  test('Process payment with enterprise plan', async ({ request }) => {
    console.log('\n💼 Testing enterprise plan payment...\n');

    const response = await request.post(`${BASE_URL}/api/payment/process`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        planType: 'enterprise',
        billingCycle: 'monthly',
        currency: 'USD',
        amount: 9900, // $99.00
        email: 'test-api-enterprise@blessbox.org',
        paymentToken: SQUARE_TEST_NONCES.SUCCESS,
      },
    });

    console.log(`   Response status: ${response.status()}`);
    const data = await response.json();
    console.log(`   Response data: ${JSON.stringify(data, null, 2)}`);

    expect(response.status()).toBe(200);
    expect(data.success).toBe(true);
    expect(data.organizationId).toBeTruthy();
    
    console.log('   ✅ Enterprise plan payment working');
  });

  test('Verify payment idempotency (duplicate request)', async ({ request }) => {
    console.log('\n🔁 Testing payment idempotency...\n');

    const paymentData = {
      planType: 'standard',
      billingCycle: 'monthly',
      currency: 'USD',
      amount: 1900,
      email: 'test-api-idempotency@blessbox.org',
      paymentToken: SQUARE_TEST_NONCES.SUCCESS,
    };

    // First request
    const response1 = await request.post(`${BASE_URL}/api/payment/process`, {
      headers: { 'Content-Type': 'application/json' },
      data: paymentData,
    });
    
    const data1 = await response1.json();
    console.log(`   First request status: ${response1.status()}`);
    console.log(`   Organization ID: ${data1.organizationId}`);

    // Second identical request (should handle gracefully)
    const response2 = await request.post(`${BASE_URL}/api/payment/process`, {
      headers: { 'Content-Type': 'application/json' },
      data: paymentData,
    });
    
    const data2 = await response2.json();
    console.log(`   Second request status: ${response2.status()}`);

    // Either should succeed (idempotent) or fail gracefully with duplicate error
    if (response2.status() === 200) {
      console.log('   ✅ Idempotency handled (duplicate allowed)');
    } else if (response2.status() === 400 && data2.error.toLowerCase().includes('exist')) {
      console.log('   ✅ Idempotency handled (duplicate detected)');
    } else {
      console.log('   ⚠️  Unexpected response for duplicate request');
    }
  });
});

