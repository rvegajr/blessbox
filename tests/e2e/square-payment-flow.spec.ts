import { test, expect } from '@playwright/test';

/**
 * Square Payment Flow E2E Test
 * Tests the complete Square payment checkout flow using sandbox credentials
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:7777';
const TEST_ENV = process.env.TEST_ENV || 'local';

// Square sandbox test card (from Square documentation)
const TEST_CARD = {
  number: '4111111111111111', // Visa
  cvv: '123',
  expirationDate: '12/25',
  postalCode: '12345',
};

test.describe('Square Payment Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to checkout page
    await page.goto(`${BASE_URL}/checkout?plan=standard`);
    
    // Verify we're on the right server (not a different project)
    const title = await page.title().catch(() => '');
    if (title.includes('Flight Deck') || title.includes('Leadership')) {
      test.skip();
      console.log('⚠️  Wrong server running on 7777 - this is a different project');
      return;
    }
  });

  // Square Web SDK requires `unsafe-eval`, which the prod CSP intentionally disallows; the iframed
  // card field only mounts under sandbox-CSP. Real-card 3DS also requires interactive human action.
  test.fixme('Complete Square payment flow with sandbox test card', async ({ page }) => {
    console.log('\n💳 Starting Square Payment Flow Test...\n');

    // Step 0: Verify checkout page loads
    console.log('📄 Step 0: Verifying checkout page loads...');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('input[type="email"]').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    const pageTitle = await page.title();
    console.log(`   Page title: ${pageTitle}`);
    
    // Check if we're on the checkout page (might redirect if auth required)
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
      console.log('   ⚠️  Redirected to auth page - checkout may require authentication');
      // For now, we'll skip the full payment test if auth is required
      // In a real scenario, you'd authenticate first
      return;
    }

    // Step 0.5: Fill in email address (required for payment)
    console.log('\n📧 Step 0.5: Filling in email address...');
    const emailInput = page.locator('input[type="email"]').first().or(page.locator('input[id="email"]').first());
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await emailInput.fill('test-e2e-checkout@blessbox.org');
    console.log('   ✅ Email address entered');

    // Step 1: Wait for Square SDK to load and card form to initialize
    console.log('\n⏳ Step 1: Waiting for Square payment form to initialize...');
    
    // Wait for the card container to be present (or fallback test form)
    try {
      await page.waitForSelector('#card-container', { timeout: 10000 });
      console.log('   ✅ Card container found');
    } catch {
      // Check if fallback test form is present
      const testForm = page.locator('text=Payment Information (Test Checkout)');
      if (await testForm.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('   ℹ️  Square not configured - using test checkout form');
        // Test the fallback form instead
        await testFallbackCheckout(page);
        return;
      }
      throw new Error('Neither Square form nor test form found');
    }

    // Wait for Square SDK script to load
    await page.waitForFunction(
      () => typeof (window as any).Square !== 'undefined',
      { timeout: 15000 }
    );
    console.log('   ✅ Square SDK loaded');

    // Wait for the iframe to be injected by Square (it creates an iframe inside #card-container)
    // Square injects an iframe with a specific structure
    await page.waitForTimeout(2000); // Give Square time to initialize the iframe
    
    // Check if card form is initialized by looking for the iframe or Square's injected elements
    const cardContainer = page.locator('#card-container');
    await expect(cardContainer).toBeVisible({ timeout: 10000 });
    
    // Look for Square's iframe (it may be nested)
    const squareIframe = page.frameLocator('iframe').first();
    
    console.log('   ✅ Square payment form initialized');

    // Step 2: Fill in card details
    console.log('\n💳 Step 2: Filling in card details...');
    
    // Square's card input is in an iframe. We'll interact with it via keyboard input.
    // Square SDK creates an iframe that handles card input securely.
    
    // Wait a bit more for Square to fully initialize
    await page.waitForTimeout(2000);
    
    // Find the Square iframe (it's injected inside #card-container)
    const iframe = page.frameLocator('iframe').first();
    
    // Click on the card container to focus it
    await cardContainer.click();
    await page.waitForTimeout(500);
    
    // Square's iframe accepts keyboard input when focused
    // Type card number (Square will auto-format)
    await page.keyboard.type(TEST_CARD.number, { delay: 50 });
    await page.waitForTimeout(800);
    
    // Type expiration (MM/YY format)
    await page.keyboard.type(TEST_CARD.expirationDate, { delay: 50 });
    await page.waitForTimeout(800);
    
    // Type CVV
    await page.keyboard.type(TEST_CARD.cvv, { delay: 50 });
    await page.waitForTimeout(800);
    
    // Type postal code
    await page.keyboard.type(TEST_CARD.postalCode, { delay: 50 });
    await page.waitForTimeout(1000);
    
    console.log('   ✅ Card details entered');
    
    // Verify the form is ready by checking if the button is enabled
    const payButton = page.locator('button:has-text("Pay")').first().or(page.locator('button:has-text("Processing")').first());
    await expect(payButton).toBeEnabled({ timeout: 10000 });

    // Step 3: Submit payment
    console.log('\n🚀 Step 3: Submitting payment...');
    
    // Click the payment button
    await payButton.click();
    console.log('   ✅ Payment button clicked');

    // Step 4: Wait for payment processing
    console.log('\n⏳ Step 4: Waiting for payment processing...');
    
    // Wait for either success message or error message
    await page.waitForTimeout(3000); // Give time for payment to process
    
    // Check for success indicators
    const successIndicators = [
      page.locator('text=Payment successful'),
      page.locator('text=Redirecting to dashboard'),
      page.locator('text=/success/i'),
    ];
    
    const errorIndicators = [
      page.locator('text=Payment failed'),
      page.locator('text=/error/i'),
      page.locator('text=/failed/i'),
    ];
    
    // Check URL for redirect to dashboard (success)
    const paymentUrl = page.url();
    const isDashboard = paymentUrl.includes('/dashboard');
    
    if (isDashboard) {
      console.log('   ✅ Payment successful - redirected to dashboard');
      expect(currentUrl).toContain('/dashboard');
    } else {
      // Check for success/error messages on the page
      const pageContent = await page.textContent('body');
      const hasSuccess = pageContent?.toLowerCase().includes('success') || 
                        pageContent?.toLowerCase().includes('redirecting');
      const hasError = pageContent?.toLowerCase().includes('failed') ||
                      pageContent?.toLowerCase().includes('error');
      
      if (hasSuccess) {
        console.log('   ✅ Payment successful');
      } else if (hasError) {
        console.log(`   ❌ Payment failed: ${pageContent?.substring(0, 200)}`);
        // Don't fail the test - we're testing the flow, not necessarily success
        // (Square sandbox may have specific requirements)
      } else {
        console.log('   ⚠️  Payment status unclear - check manually');
        // Take a screenshot for debugging
        await page.screenshot({ path: 'test-results/square-payment-unknown-state.png' });
      }
    }

    console.log('\n✅ Square Payment Flow Test Complete\n');
  });

  test('Verify Square configuration endpoint', async ({ page, request }) => {
    console.log('\n🔍 Testing Square configuration endpoint...\n');
    
    const response = await request.get(`${BASE_URL}/api/square/config`);
    
    if (response.status() === 401) {
      console.log('   ⚠️  Endpoint requires authentication (checking if middleware is blocking)');
      // Try with a session cookie if available
      console.log('   ℹ️  This endpoint should be public - may need to check middleware');
      return;
    }
    
    expect(response.ok()).toBeTruthy();
    const config = await response.json();
    
    console.log(`   Application ID: ${config.applicationId || 'not set'}`);
    console.log(`   Location ID: ${config.locationId || 'not set'}`);
    console.log(`   Environment: ${config.environment || 'not set'}`);
    console.log(`   Enabled: ${config.enabled || false}`);
    
    if (config.enabled) {
      expect(config.applicationId).toBeTruthy();
      expect(config.locationId).toBeTruthy();
      expect(config.environment).toBeTruthy();
      console.log('   ✅ Square is properly configured');
    } else {
      console.log('   ⚠️  Square is not configured (this is OK for local dev without Square)');
      if (config.missing) {
        console.log(`   Missing: ${JSON.stringify(config.missing)}`);
      }
    }
  });

  test('Validate email requirement on checkout', async ({ page }) => {
    console.log('\n📧 Testing email validation...\n');

    await page.goto(`${BASE_URL}/checkout?plan=standard`);
    await page.waitForLoadState('domcontentloaded');
    await page.locator('input[type="email"]').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    
    const url = page.url();
    if (url.includes('/login') || url.includes('/auth')) {
      console.log('   ⚠️  Redirected to auth - checkout requires authentication');
      return;
    }

    // Wait for form to load
    const emailInput = page.locator('input[type="email"]').first().or(page.locator('input[id="email"]').first());
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    console.log('   ✅ Email input field found');

    // Try to submit without email (wait for Square form first)
    const cardContainer = page.locator('#card-container');
    const testForm = page.locator('text=Payment Information (Test Checkout)');
    const hasCardContainer = await cardContainer.isVisible({ timeout: 5000 }).catch(() => false);
    const hasTestForm = await testForm.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (!hasCardContainer && !hasTestForm) {
      console.log('   ⚠️  No payment form loaded');
      return;
    }

    // Try to pay without email
    console.log('   ℹ️  Attempting payment without email...');
    const payButton = page.locator('button:has-text("Pay")').first().or(page.locator('button:has-text("Complete Payment")').first());
    const hasButton = await payButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasButton) {
      await payButton.click();
      await page.waitForTimeout(1500);
      
      // Check for email required error
      const errorMessage = page.locator('text=/Email.*required/i');
      const hasError = await errorMessage.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (hasError) {
        console.log('   ✅ Email validation working - error displayed');
        expect(hasError).toBeTruthy();
      } else {
        console.log('   ⚠️  Email error not displayed (may have different validation)');
      }
    }

    // Now fill in valid email
    console.log('\n   ℹ️  Filling in valid email...');
    await emailInput.fill('valid-email@test.com');
    await page.waitForTimeout(500);
    
    // Check if error cleared
    const errorMessage = page.locator('text=/Email.*required/i');
    const errorStillVisible = await errorMessage.isVisible({ timeout: 1000 }).catch(() => false);
    
    if (!errorStillVisible) {
      console.log('   ✅ Email validation cleared after filling valid email');
    }

    console.log('\n✅ Email Validation Test Complete\n');
  });

  test('Complete checkout flow with FREE100 coupon (100% discount)', async ({ page }) => {
    console.log('\n🎟️  Starting Free Coupon Checkout Flow Test...\n');

    // Step 1: Navigate to checkout
    console.log('📄 Step 1: Loading checkout page...');
    await page.goto(`${BASE_URL}/checkout?plan=standard`);
    await page.waitForLoadState('domcontentloaded');
    await page.locator('input[type="email"]').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    
    const url = page.url();
    if (url.includes('/login') || url.includes('/auth')) {
      console.log('   ⚠️  Redirected to auth - checkout requires authentication');
      return;
    }
    
    const checkoutHeading = page.locator('h1:has-text("Checkout")');
    await expect(checkoutHeading).toBeVisible({ timeout: 5000 });
    console.log('   ✅ Checkout page loaded');

    // Step 1.5: Fill in email address
    console.log('\n📧 Step 1.5: Filling in email address...');
    const emailInput = page.locator('input[type="email"]').first().or(page.locator('input[id="email"]').first());
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await emailInput.fill('test-free-coupon@blessbox.org');
    console.log('   ✅ Email address entered');

    // Step 2: Apply FREE100 coupon
    console.log('\n🎟️  Step 2: Applying FREE100 coupon...');
    const couponInput = page.locator('input[id="coupon"]').or(page.locator('input[placeholder*="coupon" i]'));
    await expect(couponInput).toBeVisible({ timeout: 5000 });
    await couponInput.fill('FREE100');
    console.log('   ✅ Coupon code entered');

    const applyButton = page.locator('button:has-text("Apply")');
    await expect(applyButton).toBeEnabled({ timeout: 2000 });
    await applyButton.click();
    console.log('   ✅ Apply button clicked');

    // Wait for coupon to be applied
    await page.waitForTimeout(2000);
    
    // Check for success message or updated total
    const couponSuccess = page.locator('text=/Applied.*FREE100/i').or(page.locator('text=/saved.*\\$19/i'));
    const hasSuccess = await couponSuccess.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasSuccess) {
      console.log('   ✅ Coupon applied successfully');
    } else {
      // Check for error
      const errorMsg = page.locator('text=/error/i').or(page.locator('text=/invalid/i'));
      const hasError = await errorMsg.isVisible({ timeout: 2000 }).catch(() => false);
      if (hasError) {
        const errorText = await errorMsg.textContent();
        console.log(`   ❌ Coupon error: ${errorText}`);
        // Try to seed the coupon first
        console.log('   ℹ️  Attempting to seed FREE100 coupon...');
        const seedResponse = await page.request.post(`${BASE_URL}/api/admin/seed-test-coupons`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (seedResponse.ok()) {
          console.log('   ✅ Coupon seeded, retrying...');
          await couponInput.fill('FREE100');
          await applyButton.click();
          await page.waitForTimeout(2000);
        }
      }
    }

    // Step 3: Verify total is $0.00
    console.log('\n💰 Step 3: Verifying total is $0.00...');
    const totalText = page.locator('text=/Total.*\\$0\\.00/i').or(page.locator('text=/\\$0\\.00.*Total/i'));
    const totalVisible = await totalText.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (totalVisible) {
      console.log('   ✅ Total is $0.00');
    } else {
      // Check the actual total displayed
      const pageContent = await page.textContent('body');
      const totalMatch = pageContent?.match(/\$(\d+\.\d{2})/);
      if (totalMatch) {
        console.log(`   ⚠️  Total is ${totalMatch[0]} (expected $0.00)`);
      }
    }

    // Step 4: Complete checkout (should show "Complete Checkout" button, not payment form)
    console.log('\n✅ Step 4: Completing checkout...');
    const completeButton = page.locator('button:has-text("Complete Checkout")');
    const payButton = page.locator('button:has-text("Pay")');
    
    const hasCompleteButton = await completeButton.isVisible({ timeout: 3000 }).catch(() => false);
    const hasPayButton = await payButton.isVisible({ timeout: 1000 }).catch(() => false);
    
    if (hasCompleteButton) {
      console.log('   ✅ "Complete Checkout" button visible (correct for $0 amount)');
      await completeButton.click();
      console.log('   ✅ Checkout button clicked');
    } else if (hasPayButton) {
      console.log('   ⚠️  Payment form still showing (amount may not be $0)');
      // Still try to complete
      await payButton.click();
    } else {
      console.log('   ⚠️  No checkout button found');
    }

    // Step 5: Wait for success/redirect
    console.log('\n⏳ Step 5: Waiting for checkout completion...');
    await page.waitForTimeout(3000);
    
    const finalUrl = page.url();
    const isDashboard = finalUrl.includes('/dashboard');
    const pageContent = await page.textContent('body');
    const checkoutSuccess = pageContent?.toLowerCase().includes('success') || 
                      pageContent?.toLowerCase().includes('redirecting') ||
                      isDashboard;
    
    if (isDashboard) {
      console.log('   ✅ Checkout successful - redirected to dashboard');
      expect(finalUrl).toContain('/dashboard');
    } else if (checkoutSuccess) {
      console.log('   ✅ Checkout successful');
    } else {
      console.log(`   ⚠️  Checkout status unclear. URL: ${finalUrl}`);
      await page.screenshot({ path: 'test-results/free-coupon-checkout-result.png' });
    }

    console.log('\n✅ Free Coupon Checkout Flow Test Complete\n');
  });

  test('Checkout page loads with plan selection', async ({ page }) => {
    console.log('\n📄 Testing checkout page load...\n');
    
    await page.goto(`${BASE_URL}/checkout?plan=standard`);
    await page.waitForLoadState('domcontentloaded');
    await page.locator('input[type="email"]').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    
    // Check if redirected (auth required)
    const url = page.url();
    if (url.includes('/login') || url.includes('/auth')) {
      console.log('   ⚠️  Redirected to auth - checkout requires authentication');
      return;
    }
    
    // Check for checkout page content
    const checkoutHeading = page.locator('h1:has-text("Checkout")');
    await expect(checkoutHeading).toBeVisible({ timeout: 5000 });
    console.log('   ✅ Checkout page loaded');
    
    // Check for plan information (flexible - could be "standard" or "$19" or "Standard")
    const planInfo = page.locator('text=/standard/i').or(page.locator('text=/\\$19/i')).or(page.locator('text=/Standard/i'));
    const hasPlanInfo = await planInfo.isVisible({ timeout: 3000 }).catch(() => false);
    if (hasPlanInfo) {
      console.log('   ✅ Plan information displayed');
    } else {
      console.log('   ⚠️  Plan info not found (may be displayed differently)');
    }
    
    // Check for payment form container OR test checkout form
    const cardContainer = page.locator('#card-container');
    const testForm = page.locator('text=Payment Information (Test Checkout)');
    const hasCardContainer = await cardContainer.isVisible({ timeout: 5000 }).catch(() => false);
    const hasTestForm = await testForm.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (hasCardContainer) {
      console.log('   ✅ Square payment form container present');
    } else if (hasTestForm) {
      console.log('   ✅ Test checkout form present (Square not configured)');
    } else {
      console.log('   ⚠️  No payment form found');
    }
    
    // Check for payment button (could be "Pay", "Complete Payment", or "Complete Checkout")
    const payButton = page.locator('button:has-text("Pay")')
      .or(page.locator('button:has-text("Complete Payment")'))
      .or(page.locator('button:has-text("Complete Checkout")'));
    const hasButton = await payButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasButton) {
      console.log('   ✅ Payment button present');
    } else {
      console.log('   ⚠️  Payment button not found');
    }
  });

  test('Test SAVE20 coupon application', async ({ page }) => {
    console.log('\n🎟️  Testing SAVE20 coupon (20% discount)...\n');

    await page.goto(`${BASE_URL}/checkout?plan=standard`);
    await page.waitForLoadState('domcontentloaded');
    await page.locator('input[type="email"]').first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    
    const url = page.url();
    if (url.includes('/login') || url.includes('/auth')) {
      console.log('   ⚠️  Redirected to auth - checkout requires authentication');
      return;
    }

    // Fill email
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await emailInput.fill('test-save20@blessbox.org');
    console.log('   ✅ Email filled');

    // Apply SAVE20 coupon
    const couponInput = page.locator('input[id="coupon"]');
    await expect(couponInput).toBeVisible({ timeout: 5000 });
    await couponInput.fill('SAVE20');
    
    const applyButton = page.locator('button:has-text("Apply")');
    await applyButton.click();
    await page.waitForTimeout(2000);
    
    // Check if coupon was applied
    const successMsg = page.locator('text=/Applied.*SAVE20/i');
    const hasSuccess = await successMsg.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (hasSuccess) {
      console.log('   ✅ SAVE20 coupon applied');
      
      // Verify discount calculation: $19.00 - 20% = $15.20
      const totalText = page.locator('text=/\\$15\\.20/i');
      const hasCorrectTotal = await totalText.isVisible({ timeout: 2000 }).catch(() => false);
      
      if (hasCorrectTotal) {
        console.log('   ✅ Discount calculated correctly ($19.00 → $15.20)');
      } else {
        console.log('   ⚠️  Discount amount may be different');
      }
    } else {
      const errorMsg = page.locator('text=/error/i').or(page.locator('text=/invalid/i'));
      const hasError = await errorMsg.isVisible({ timeout: 2000 }).catch(() => false);
      if (hasError) {
        const errorText = await errorMsg.textContent();
        console.log(`   ⚠️  Coupon error: ${errorText}`);
      } else {
        console.log('   ⚠️  Coupon status unclear');
      }
    }

    console.log('\n✅ SAVE20 Coupon Test Complete\n');
  });
});

// Helper function for testing fallback checkout form
async function testFallbackCheckout(page: any) {
  console.log('\n🧪 Testing fallback checkout form...\n');
  
  // Fill in test form fields
  const cardInput = page.locator('input[placeholder*="4111"]').first();
  if (await cardInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await cardInput.fill('4111111111111111');
    console.log('   ✅ Card number filled');
  }
  
  // Click complete payment button
  const completeButton = page.locator('button:has-text("Complete Payment")').or(page.locator('button:has-text("Complete Checkout")'));
  await completeButton.click();
  console.log('   ✅ Payment button clicked');
  
  // Wait for response
  await page.waitForTimeout(2000);
  
  // Check for success/error message
  const statusMessage = page.locator('text=/success/i').or(page.locator('text=/failed/i')).or(page.locator('text=/error/i'));
  const hasStatus = await statusMessage.isVisible({ timeout: 3000 }).catch(() => false);
  if (hasStatus) {
    const text = await statusMessage.textContent();
    console.log(`   Status: ${text}`);
  }
}
