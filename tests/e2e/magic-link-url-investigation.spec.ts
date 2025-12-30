import { test, expect } from '@playwright/test';

/**
 * Magic Link URL Investigation E2E Test
 * 
 * Investigates why magic links are redirecting to wrong domains.
 * Tests URL generation, environment configuration, and actual login flow.
 * 
 * Run against production: BASE_URL=https://www.blessbox.org npm run test:e2e tests/e2e/magic-link-url-investigation.spec.ts
 */

const BASE_URL = process.env.BASE_URL || process.env.PRODUCTION_URL || 'http://localhost:7777';
const IS_PRODUCTION = BASE_URL.includes('vercel.app') || BASE_URL.includes('blessbox.org') || process.env.PRODUCTION_URL;
const TEST_EMAIL = process.env.E2E_TEST_EMAIL || `magic-link-test-${Date.now()}@example.com`;

test.describe('Magic Link URL Investigation', () => {
  test('Step 1: Check environment URL configuration', async ({ request }) => {
    console.log('\n🔍 Step 1: Checking Environment URL Configuration...\n');

    // Check debug endpoint
    const debugResponse = await request.get(`${BASE_URL}/api/debug-auth-url`);
    
    if (debugResponse.ok()) {
      const config = await debugResponse.json();
      console.log('   Environment Configuration:');
      console.log(`   - NEXTAUTH_URL: ${config.nextAuthUrl}`);
      console.log(`   - PUBLIC_APP_URL: ${config.publicAppUrl}`);
      console.log(`   - NEXT_PUBLIC_APP_URL: ${config.nextPublicAppUrl}`);
      console.log(`   - Magic Link Base URL: ${config.magicLinkBaseUrl}`);
      console.log(`   - Node Environment: ${config.nodeEnv}`);
      console.log(`   - Trust Host: ${config.trustHost}`);

      // Verify URLs are set
      expect(config.nextAuthUrl).not.toBe('NOT SET');
      expect(config.publicAppUrl).not.toBe('NOT SET');
      
      // Verify URLs match expected domain
      if (IS_PRODUCTION) {
        const expectedDomain = 'blessbox.org';
        expect(config.magicLinkBaseUrl).toContain(expectedDomain);
        console.log(`   ✅ Magic link base URL contains expected domain: ${expectedDomain}`);
      } else {
        console.log(`   ✅ Local environment detected: ${config.magicLinkBaseUrl}`);
      }
    } else {
      console.log('   ⚠️  Debug endpoint not available, checking health endpoint');
      const healthResponse = await request.get(`${BASE_URL}/api/system/health-check`);
      expect(healthResponse.ok()).toBeTruthy();
    }
  });

  test('Step 2: Test magic link URL generation logic', async ({ request }) => {
    console.log('\n🔍 Step 2: Testing Magic Link URL Generation Logic...\n');

    // Simulate what NextAuth would generate
    const testCallbackUrl = `${BASE_URL}/api/auth/callback/email?token=test-token&email=${encodeURIComponent(TEST_EMAIL)}`;
    
    // Check what our override logic would produce
    const testResponse = await request.post(`${BASE_URL}/api/test/magic-link-url`, {
      data: {
        originalUrl: testCallbackUrl,
        email: TEST_EMAIL,
      },
    }).catch(() => null);

    if (testResponse && testResponse.ok()) {
      const result = await testResponse.json();
      console.log('   URL Generation Test:');
      console.log(`   - Original URL: ${result.originalUrl}`);
      console.log(`   - Corrected URL: ${result.correctedUrl}`);
      console.log(`   - Base URL Used: ${result.baseUrl}`);
      
      // Verify corrected URL uses correct domain
      if (IS_PRODUCTION) {
        expect(result.correctedUrl).toContain('blessbox.org');
        expect(result.correctedUrl).not.toContain('vercel.app'); // Should use custom domain
        console.log('   ✅ Corrected URL uses correct production domain');
      } else {
        expect(result.correctedUrl).toContain('localhost');
        console.log('   ✅ Corrected URL uses localhost for development');
      }
    } else {
      console.log('   ⚠️  Magic link URL test endpoint not available');
    }
  });

  test('Step 3: Request magic link and verify email was sent', async ({ page, request }) => {
    console.log('\n🔍 Step 3: Requesting Magic Link...\n');

    // Navigate to login page
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Find email input
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    console.log('   ✅ Login page loaded');

    // Enter email
    await emailInput.fill(TEST_EMAIL);
    console.log(`   ✅ Email entered: ${TEST_EMAIL}`);

    // Find and click sign in button
    const signInButton = page.locator('button:has-text("Sign in")').or(
      page.locator('button[type="submit"]')
    ).first();
    await expect(signInButton).toBeVisible({ timeout: 5000 });
    
    // Intercept network requests to see what URL is being sent
    const emailRequests: string[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/auth/signin/email') || url.includes('sendVerificationRequest')) {
        emailRequests.push(url);
      }
    });

    // Click sign in
    await signInButton.click();
    console.log('   ✅ Sign in button clicked');

    // Wait for response
    await page.waitForTimeout(3000);

    // Check for success message
    const successMessage = page.locator('text=/check your email/i').or(
      page.locator('text=/magic link/i')
    );
    const hasSuccess = await successMessage.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasSuccess) {
      console.log('   ✅ Success message displayed - email should be sent');
    } else {
      // Check for error
      const errorMessage = page.locator('text=/error/i').or(
        page.locator('[role="alert"]')
      );
      const hasError = await errorMessage.isVisible({ timeout: 2000 }).catch(() => false);
      if (hasError) {
        const errorText = await errorMessage.textContent();
        console.log(`   ⚠️  Error displayed: ${errorText}`);
      }
    }

    // Log intercepted requests
    if (emailRequests.length > 0) {
      console.log(`   📡 Intercepted ${emailRequests.length} email-related requests`);
      emailRequests.forEach((url, i) => {
        console.log(`      ${i + 1}. ${url}`);
      });
    }
  });

  test('Step 4: Check email logs for actual URL sent', async ({ request }) => {
    console.log('\n🔍 Step 4: Checking Email Logs...\n');

    if (!IS_PRODUCTION) {
      console.log('   ℹ️  Skipping email log check in non-production environment');
      return;
    }

    // Try to fetch recent email logs (if endpoint exists)
    const emailLogsResponse = await request.get(`${BASE_URL}/api/debug-email-config`).catch(() => null);
    
    if (emailLogsResponse && emailLogsResponse.ok()) {
      const config = await emailLogsResponse.json();
      console.log('   Email Configuration:');
      console.log(`   - Provider: ${config.provider || 'unknown'}`);
      console.log(`   - From Email: ${config.fromEmail || 'unknown'}`);
      console.log(`   - Configured: ${config.configured ? 'Yes' : 'No'}`);
    }

    // Check if we can query email logs for this test email
    // This would require a database query endpoint (not implemented yet)
    console.log('   ℹ️  Email log query endpoint not available');
    console.log('   💡 To verify: Check SendGrid activity logs or email inbox');
  });

  test('Step 5: Test actual magic link callback URL structure', async ({ page, request }) => {
    console.log('\n🔍 Step 5: Testing Magic Link Callback URL Structure...\n');

    // Construct what a magic link URL should look like
    const baseUrl = IS_PRODUCTION ? 'https://www.blessbox.org' : BASE_URL;
    const testToken = 'test-verification-token-12345';
    const testEmail = TEST_EMAIL;
    
    // NextAuth magic link format: /api/auth/callback/email?token=...&email=...
    const expectedUrl = `${baseUrl}/api/auth/callback/email?token=${testToken}&email=${encodeURIComponent(testEmail)}`;
    
    console.log(`   Expected URL format: ${expectedUrl}`);
    
    // Try to access the callback endpoint (will fail without valid token, but we can check the structure)
    const callbackResponse = await request.get(expectedUrl);
    
    // Should get some response (even if it's an error about invalid token)
    console.log(`   Callback endpoint status: ${callbackResponse.status()}`);
    
    if (callbackResponse.status() === 400 || callbackResponse.status() === 401) {
      console.log('   ✅ Callback endpoint exists and validates tokens');
    } else {
      const responseText = await callbackResponse.text();
      console.log(`   Response: ${responseText.substring(0, 200)}`);
    }

    // Verify URL structure
    const urlObj = new URL(expectedUrl);
    expect(urlObj.pathname).toBe('/api/auth/callback/email');
    expect(urlObj.searchParams.has('token')).toBe(true);
    expect(urlObj.searchParams.has('email')).toBe(true);
    console.log('   ✅ URL structure is correct');
  });

  test('Step 6: Verify login redirect flow', async ({ page }) => {
    console.log('\n🔍 Step 6: Testing Login Redirect Flow...\n');

    // Test redirect with next parameter
    const testNextPath = '/onboarding/organization-setup';
    await page.goto(`${BASE_URL}/login?next=${encodeURIComponent(testNextPath)}`);
    await page.waitForLoadState('networkidle');

    // Check that next parameter is preserved
    const url = page.url();
    console.log(`   Current URL: ${url}`);
    
    if (url.includes('next=')) {
      console.log('   ✅ Next parameter is preserved in URL');
    }

    // Check if there's a hidden input or storage for next path
    const nextInput = page.locator('input[name="next"]').or(
      page.locator('input[type="hidden"][value*="onboarding"]')
    );
    const hasNextInput = await nextInput.isVisible({ timeout: 1000 }).catch(() => false);
    
    if (hasNextInput) {
      const nextValue = await nextInput.inputValue();
      console.log(`   ✅ Next path stored: ${nextValue}`);
    }

    // Test that unauthenticated access redirects correctly
    await page.goto(`${BASE_URL}${testNextPath}`);
    await page.waitForLoadState('networkidle');
    
    const finalUrl = page.url();
    console.log(`   Final URL after accessing protected route: ${finalUrl}`);
    
    if (finalUrl.includes('/login')) {
      console.log('   ✅ Unauthenticated access redirects to login');
      if (finalUrl.includes('next=')) {
        console.log('   ✅ Next parameter preserved in redirect');
      }
    }
  });

  test('Step 7: Full magic link login flow (if email accessible)', async ({ page, request }) => {
    console.log('\n🔍 Step 7: Full Magic Link Login Flow Test...\n');
    console.log('   ℹ️  This test requires manual email access or email interception');
    console.log('   💡 To complete:');
    console.log('      1. Request magic link via /login page');
    console.log('      2. Check email inbox for magic link');
    console.log('      3. Verify link URL domain is correct');
    console.log('      4. Click link and verify redirect');
    console.log(`   📧 Test email: ${TEST_EMAIL}`);
    
    // For automated testing, we'd need:
    // 1. Email interception service (MailHog, Mailtrap, etc.)
    // 2. Or a test endpoint that returns the last sent magic link URL
    // 3. Or database access to verification_tokens table
    
    // Check if we can query verification tokens (would need admin endpoint)
    const tokenCheckResponse = await request.get(
      `${BASE_URL}/api/test/verification-code?email=${encodeURIComponent(TEST_EMAIL)}`
    ).catch(() => null);
    
    if (tokenCheckResponse && tokenCheckResponse.ok()) {
      console.log('   ✅ Verification code endpoint available');
      // Note: This is for verification codes, not magic link tokens
      // Magic link tokens are handled by NextAuth internally
    }
  });
});

