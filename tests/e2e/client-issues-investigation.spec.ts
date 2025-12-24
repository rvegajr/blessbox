import { test, expect } from '@playwright/test';

/**
 * Client Issue Investigation Tests
 * Replicates issues reported by tester on 12/21/25:
 * 1. Payment fails: "not authenticated"
 * 2. Dropdown menu choices don't show up in registration form
 * 3. Form persistence - new email remembers previously created form
 * 4. QR code still doesn't generate the form
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:7777';
const TEST_EMAIL = `e2e-test-${Date.now()}@example.com`;
const TEST_ORG_NAME = `Test Org ${Date.now()}`;

test.describe('Client Issue Investigation', () => {
  test('Issue 1: Payment fails "not authenticated"', async ({ page, request }) => {
    console.log('\n🔍 Issue 1: Investigating payment authentication...\n');
    
    // Navigate to checkout without authentication
    await page.goto(`${BASE_URL}/checkout?plan=standard`);
    await page.waitForLoadState('networkidle');
    
    // Apply FREE100 coupon to bypass payment
    const couponInput = page.locator('input[id="coupon"]');
    if (await couponInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await couponInput.fill('FREE100');
      const applyBtn = page.locator('button:has-text("Apply")');
      await applyBtn.click();
      await page.waitForTimeout(2000);
    }
    
    // Try to complete checkout
    const completeBtn = page.locator('button:has-text("Complete Checkout")').or(page.locator('button:has-text("Pay")'));
    if (await completeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await completeBtn.click();
      await page.waitForTimeout(3000);
      
      // Check for auth error
      const pageContent = await page.textContent('body');
      const hasAuthError = pageContent?.toLowerCase().includes('not authenticated') ||
                          pageContent?.toLowerCase().includes('authentication');
      
      if (hasAuthError) {
        console.log('   ❌ CONFIRMED: Payment fails with "not authenticated"');
        console.log('   Root cause: Checkout page does not include email in payment request');
      } else {
        console.log('   ⚠️  Auth error not visible on page, checking API...');
      }
    }
    
    // Test API directly
    const response = await request.post(`${BASE_URL}/api/payment/process`, {
      data: {
        planType: 'standard',
        billingCycle: 'monthly',
        currency: 'USD',
        amount: 0,
      }
    });
    
    const data = await response.json();
    console.log(`   API response: ${JSON.stringify(data)}`);
    
    if (data.error === 'Not authenticated') {
      console.log('   ✅ CONFIRMED: API returns "Not authenticated" when no session/email');
    }
  });

  test('Issue 2: Dropdown menu choices don\'t show up', async ({ page, request }) => {
    console.log('\n🔍 Issue 2: Investigating dropdown options...\n');
    
    // First, create a test organization and form with dropdown
    const verifyRes = await request.post(`${BASE_URL}/api/onboarding/send-verification`, {
      data: { email: TEST_EMAIL }
    });
    const verifyData = await verifyRes.json();
    console.log(`   Verification sent: ${verifyData.success}`);
    
    if (verifyData.code) {
      // Verify the code
      await request.post(`${BASE_URL}/api/onboarding/verify-code`, {
        data: { email: TEST_EMAIL, code: verifyData.code }
      });
      
      // Create organization
      const orgRes = await request.post(`${BASE_URL}/api/onboarding/save-organization`, {
        data: {
          name: TEST_ORG_NAME,
          eventName: 'Test Event',
          email: TEST_EMAIL
        }
      });
      const orgData = await orgRes.json();
      console.log(`   Organization created: ${orgData.success}, ID: ${orgData.organization?.id}`);
      
      if (orgData.organization?.id) {
        // Save form config with dropdown field (Gender with Male/Female options)
        const formRes = await request.post(`${BASE_URL}/api/onboarding/save-form-config`, {
          data: {
            organizationId: orgData.organization.id,
            name: 'Test Registration Form',
            language: 'en',
            formFields: [
              {
                id: 'field_name',
                type: 'text',
                label: 'Full Name',
                required: true,
                placeholder: 'Enter your name',
                order: 0
              },
              {
                id: 'field_gender',
                type: 'select',
                label: 'Gender',
                required: true,
                placeholder: 'Select gender',
                options: ['Male', 'Female'],
                order: 1
              }
            ]
          }
        });
        const formData = await formRes.json();
        console.log(`   Form config saved: ${formData.success}`);
        console.log(`   Form fields: ${JSON.stringify(formData.config?.formFields)}`);
        
        // Check if options are preserved
        const savedOptions = formData.config?.formFields?.find((f: any) => f.type === 'select')?.options;
        if (savedOptions && savedOptions.length > 0) {
          console.log(`   ✅ Options saved correctly: ${JSON.stringify(savedOptions)}`);
        } else {
          console.log('   ❌ ISSUE: Options not saved in form config');
        }
        
        // Generate QR code
        const qrRes = await request.post(`${BASE_URL}/api/onboarding/generate-qr`, {
          data: {
            organizationId: orgData.organization.id,
            formConfigId: formData.config?.id,
            qrLabel: 'test-entry'
          }
        });
        const qrData = await qrRes.json();
        console.log(`   QR generated: ${qrData.success}`);
        
        // Get the form config to verify options
        const orgSlug = TEST_ORG_NAME.toLowerCase().replace(/\s+/g, '-');
        const configRes = await request.get(`${BASE_URL}/api/registrations/form-config?orgSlug=${encodeURIComponent(orgSlug)}&qrLabel=test-entry`);
        const config = await configRes.json();
        console.log(`   Retrieved form config: ${config.success}`);
        
        if (config.success && config.config?.formFields) {
          const selectField = config.config.formFields.find((f: any) => f.type === 'select');
          if (selectField) {
            console.log(`   Select field found: ${selectField.label}`);
            console.log(`   Options: ${JSON.stringify(selectField.options)}`);
            
            if (!selectField.options || selectField.options.length === 0) {
              console.log('   ❌ CONFIRMED: Dropdown options are missing in retrieved config');
            } else {
              console.log('   ✅ Dropdown options present in config');
            }
          }
        }
      }
    }
  });

  test('Issue 3: Form persistence across sessions', async ({ page, request }) => {
    console.log('\n🔍 Issue 3: Investigating form persistence...\n');
    
    // This would require checking localStorage, cookies, or server-side session
    // The issue is that a NEW email should not remember a previously created form
    
    // Navigate to onboarding
    await page.goto(`${BASE_URL}/onboarding`);
    await page.waitForLoadState('networkidle');
    
    // Check for any stored organization data
    const localStorage = await page.evaluate(() => {
      const keys = Object.keys(window.localStorage);
      const data: Record<string, string> = {};
      keys.forEach(key => {
        if (key.includes('org') || key.includes('form') || key.includes('onboarding')) {
          data[key] = window.localStorage.getItem(key) || '';
        }
      });
      return data;
    });
    
    console.log('   LocalStorage keys related to form/org:', Object.keys(localStorage));
    
    if (Object.keys(localStorage).length > 0) {
      console.log('   ⚠️  Found stored data that may cause persistence issue:');
      console.log(`   ${JSON.stringify(localStorage, null, 2)}`);
    } else {
      console.log('   ✅ No form/org data in localStorage');
    }
  });

  test('Issue 4: QR code doesn\'t generate the form', async ({ page, request }) => {
    console.log('\n🔍 Issue 4: Investigating QR code form generation...\n');
    
    // Test the QR code flow
    // Create org -> Create form -> Generate QR -> Scan QR -> Form should load
    
    const email = `qr-test-${Date.now()}@example.com`;
    const orgName = `QR Test Org ${Date.now()}`;
    
    // Step 1: Verify email
    const verifyRes = await request.post(`${BASE_URL}/api/onboarding/send-verification`, {
      data: { email }
    });
    const verifyData = await verifyRes.json();
    
    if (!verifyData.code) {
      console.log('   ⚠️  No verification code returned (production mode?)');
      return;
    }
    
    await request.post(`${BASE_URL}/api/onboarding/verify-code`, {
      data: { email, code: verifyData.code }
    });
    
    // Step 2: Create organization
    const orgRes = await request.post(`${BASE_URL}/api/onboarding/save-organization`, {
      data: { name: orgName, eventName: 'QR Test Event', email }
    });
    const orgData = await orgRes.json();
    console.log(`   1. Organization created: ${orgData.success}`);
    
    if (!orgData.organization?.id) {
      console.log('   ❌ Failed to create organization');
      return;
    }
    
    // Step 3: Save form config
    const formRes = await request.post(`${BASE_URL}/api/onboarding/save-form-config`, {
      data: {
        organizationId: orgData.organization.id,
        name: 'QR Test Form',
        language: 'en',
        formFields: [
          { id: 'name', type: 'text', label: 'Name', required: true, order: 0 },
          { id: 'email', type: 'email', label: 'Email', required: true, order: 1 }
        ]
      }
    });
    const formData = await formRes.json();
    console.log(`   2. Form config saved: ${formData.success}`);
    
    // Step 4: Generate QR code
    const qrRes = await request.post(`${BASE_URL}/api/onboarding/generate-qr`, {
      data: {
        organizationId: orgData.organization.id,
        formConfigId: formData.config?.id,
        qrLabel: 'main-entry'
      }
    });
    const qrData = await qrRes.json();
    console.log(`   3. QR code generated: ${qrData.success}`);
    console.log(`      QR URL: ${qrData.qrCode?.url || 'N/A'}`);
    
    // Step 5: Try to load the form via the QR URL
    const orgSlug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const formUrl = `${BASE_URL}/register/${orgSlug}/main-entry`;
    console.log(`   4. Testing form URL: ${formUrl}`);
    
    await page.goto(formUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check what loaded
    const pageContent = await page.textContent('body');
    const hasForm = await page.locator('form').isVisible({ timeout: 3000 }).catch(() => false);
    const hasError = pageContent?.includes('Form unavailable') || pageContent?.includes('not configured');
    
    if (hasForm) {
      console.log('   ✅ Form loaded successfully');
      
      // Check if fields are present
      const nameField = page.locator('input[id="name"]').or(page.locator('label:has-text("Name")'));
      if (await nameField.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('   ✅ Form fields are present');
      } else {
        console.log('   ⚠️  Form exists but fields may be missing');
      }
    } else if (hasError) {
      console.log('   ❌ CONFIRMED: QR code URL shows "Form unavailable"');
      console.log(`   Page content: ${pageContent?.substring(0, 200)}`);
      
      // Debug: Check form config API directly
      const configRes = await request.get(`${BASE_URL}/api/registrations/form-config?orgSlug=${orgSlug}&qrLabel=main-entry`);
      const config = await configRes.json();
      console.log(`   Debug - API form config: ${JSON.stringify(config)}`);
    } else {
      console.log('   ⚠️  Unknown state');
      await page.screenshot({ path: 'test-results/qr-form-investigation.png' });
    }
  });
});
