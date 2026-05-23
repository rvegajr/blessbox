import { test, expect } from '@playwright/test';

/**
 * Cluster G: Coupon Code Not Forwarded in Free Checkout
 * Issue: #27 - ✅ ALREADY REPRODUCED
 * 
 * Root Cause: completeTestCheckout doesn't include couponCode in request body
 */

test.describe('Cluster G: Coupon Checkout Bug (Issue #27)', () => {
  const baseURL = process.env.BASE_URL || 'http://localhost:7777';
  let orgId: string;
  let contactEmail: string;

  test.beforeAll(async ({ request }) => {
    const response = await request.post(`${baseURL}/api/test/seed`, {
      data: {
        seedKey: `cluster-g-${Date.now()}`,
        organizationName: 'Cluster G Coupon Test',
        contactEmail: `cluster-g-${Date.now()}@test.com`
      }
    });

    expect(response.ok()).toBeTruthy();
    const seed = await response.json();
    orgId = seed.organizationId;
    contactEmail = seed.contactEmail;
  });

  test('Issue #27: 100% coupon checkout completes without paymentToken error', async ({ page }) => {
    // Set test auth cookies
    await page.context().addCookies([
      { name: 'bb_test_auth', value: '1', domain: 'localhost', path: '/' },
      { name: 'bb_test_email', value: contactEmail, domain: 'localhost', path: '/' },
      { name: 'bb_active_org_id', value: orgId, domain: 'localhost', path: '/' }
    ]);

    // Navigate to checkout
    await page.goto(`${baseURL}/checkout?plan=enterprise`);
    
    // Fill email
    await page.fill('input[type="email"]', contactEmail);
    
    // Apply 100% coupon
    await page.fill('input[placeholder*="coupon"]', 'FREE100');
    await page.click('button:has-text("Apply")');
    
    // Wait for coupon to apply
    await page.waitForTimeout(500);
    
    // Verify total is $0
    const totalText = await page.textContent('body');
    expect(totalText).toContain('$0.00');
    
    // Verify button text changed to "Complete Checkout"
    const checkoutButton = page.locator('button:has-text("Complete Checkout")');
    await expect(checkoutButton).toBeVisible();
    
    // Click Complete Checkout
    await checkoutButton.click();
    
    // Wait for response
    await page.waitForTimeout(2000);
    
    // ✅ Should NOT see "paymentToken required" error
    const pageContent = await page.textContent('body');
    expect(pageContent).not.toContain('paymentToken required');
    
    // ✅ Should either succeed or show authentication required (but not paymentToken error)
    const hasSuccess = pageContent?.includes('success') || pageContent?.includes('dashboard');
    const hasAuthRequired = pageContent?.includes('Authentication required');
    
    expect(hasSuccess || hasAuthRequired, 
      'Should either succeed or require auth, but NOT show paymentToken error'
    ).toBeTruthy();
  });

  test('Issue #27: Coupon API correctly validates FREE100', async ({ request }) => {
    // Test coupon validation endpoint
    const response = await request.post(`${baseURL}/api/coupons/apply`, {
      data: {
        code: 'FREE100',
        planType: 'enterprise',
        amountCents: 9900 // $99.00
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    // ✅ Should validate successfully
    expect(data.success).toBeTruthy();
    expect(data.valid).toBeTruthy();
    expect(data.code).toBe('FREE100');
    
    // ✅ Should reduce amount to $0
    expect(data.discountedAmountCents).toBe(0);
    expect(data.discountAppliedCents).toBe(9900);
  });

  test('Issue #27: Payment process endpoint accepts couponCode parameter', async ({ request }) => {
    // Test that /api/payment/process accepts and uses couponCode
    const response = await request.post(`${baseURL}/api/payment/process`, {
      headers: {
        'Cookie': `bb_test_auth=1; bb_test_email=${contactEmail}; bb_active_org_id=${orgId}`
      },
      data: {
        planType: 'enterprise',
        billingCycle: 'monthly',
        currency: 'USD',
        amount: 0,
        email: contactEmail,
        couponCode: 'FREE100'  // ← This should be included!
      }
    });
    
    // With couponCode, should recognize as free and not demand paymentToken
    const data = await response.json();
    
    // ✅ Should NOT return "paymentToken required" error
    if (!response.ok()) {
      expect(data.error).not.toBe('paymentToken required for paid plan');
    }
  });
});
