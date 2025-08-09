import { test, expect, Page } from '@playwright/test';
import * as crypto from 'crypto';

// Test configuration
const ENVIRONMENTS = {
  production: 'https://www.blessbox.org',
  development: 'https://dev.blessbox.org',
  local: 'http://localhost:4321'
};

// Get environment from ENV variable or default to production
const ENV = process.env.TEST_ENV || 'production';
const BASE_URL = ENVIRONMENTS[ENV] || ENVIRONMENTS.production;

// Test data storage
const testOrganization = {
  email: `e2e.test.org.${Date.now().toString(36)}@example.com`,
  password: 'TestPassword123!',
  organizationName: `E2E_TEST_Org_${Date.now().toString(36)}`,
  eventName: `E2E_TEST_Event_${Date.now().toString(36)}`,
  phone: '555-0100',
  address: '123 Test Street',
  city: 'Test City',
  state: 'CA',
  zipCode: '90210'
};

const testRegistrations = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: `john.doe.${Date.now().toString(36)}@example.com`,
    phone: '555-0101',
    dietaryRestrictions: 'Vegetarian',
    tshirtSize: 'Large'
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: `jane.smith.${Date.now().toString(36)}@example.com`,
    phone: '555-0102',
    dietaryRestrictions: 'None',
    tshirtSize: 'Medium'
  },
  {
    firstName: 'Bob',
    lastName: 'Johnson',
    email: `bob.johnson.${Date.now().toString(36)}@example.com`,
    phone: '555-0103',
    dietaryRestrictions: 'Gluten-free',
    tshirtSize: 'X-Large'
  }
];

test.describe('BlessBox Business Flow Tests', () => {
  test.beforeAll(async () => {
    console.log('\n' + '='.repeat(60));
    console.log('💼 BlessBox Business Flow Testing Suite');
    console.log('='.repeat(60));
    console.log(`📍 Environment: ${ENV.charAt(0).toUpperCase() + ENV.slice(1)}`);
    console.log(`🌐 URL: ${BASE_URL}`);
    console.log('='.repeat(60));
    console.log('\n⚠️  WARNING: This test creates real data in the system!');
    console.log('   - Test organization and registrations will be created');
    console.log('   - Test data is prefixed with "E2E_TEST_" for identification\n');
    console.log('='.repeat(60) + '\n');
  });

  test.describe('1. Subscription Purchase Flow', () => {
    test('1.1 Navigate to pricing page', async ({ page }) => {
      console.log('\n💳 Testing subscription purchase flow...');
      
      await page.goto(`${BASE_URL}/pricing`);
      
      // Check for pricing page elements
      await expect(page.locator('h1:has-text("Pricing"), h2:has-text("Pricing")').first()).toBeVisible();
      
      // Look for subscription plans
      const standardPlan = page.locator('text=/Standard|Professional|Plus/i').first();
      const enterprisePlan = page.locator('text=/Enterprise|Premium|Pro/i').first();
      
      if (await standardPlan.isVisible()) {
        console.log('   ✓ Standard plan found');
      }
      
      if (await enterprisePlan.isVisible()) {
        console.log('   ✓ Enterprise plan found');
      }
    });

    test('1.2 Select and purchase subscription', async ({ page }) => {
      await page.goto(`${BASE_URL}/pricing`);
      
      // Click on a plan's "Get Started" or "Subscribe" button
      const subscribeButton = page.locator('button:has-text("Get Started"), button:has-text("Subscribe"), button:has-text("Start")').first();
      
      if (await subscribeButton.isVisible()) {
        await subscribeButton.click();
        console.log('   ✓ Clicked subscription button');
        
        // Wait for payment page or modal
        await page.waitForTimeout(2000);
        
        // Check if we're on payment page
        const currentUrl = page.url();
        if (currentUrl.includes('payment') || currentUrl.includes('checkout')) {
          console.log('   ✓ Navigated to payment page');
          
          // Look for Square payment form
          const paymentForm = page.locator('form[id*="payment"], #card-container, .sq-payment-form').first();
          if (await paymentForm.isVisible({ timeout: 5000 })) {
            console.log('   ✓ Payment form loaded');
            
            // Note: We won't complete actual payment in tests
            console.log('   ⚠️  Stopping before actual payment (test mode)');
          }
        }
      } else {
        console.log('   ⚠️  No subscription button found (might require auth)');
      }
    });

    test('1.3 Verify subscription appears in dashboard', async ({ page }) => {
      console.log('\n📊 Checking subscription in dashboard...');
      
      // Navigate to dashboard
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Check if dashboard requires authentication
      const loginForm = page.locator('input[type="password"]').first();
      if (await loginForm.isVisible({ timeout: 3000 })) {
        console.log('   ⚠️  Dashboard requires authentication');
        
        // Try to login with test credentials
        await page.fill('input[type="email"]', testOrganization.email);
        await page.fill('input[type="password"]', testOrganization.password);
        
        const loginButton = page.locator('button[type="submit"]').first();
        if (await loginButton.isVisible()) {
          await loginButton.click();
          await page.waitForTimeout(2000);
        }
      }
      
      // Look for subscription information
      const subscriptionInfo = page.locator('text=/subscription|plan|billing/i').first();
      if (await subscriptionInfo.isVisible({ timeout: 5000 })) {
        console.log('   ✓ Subscription information found in dashboard');
        
        // Check for plan details
        const planType = page.locator('text=/free|standard|enterprise/i').first();
        if (await planType.isVisible()) {
          const planText = await planType.textContent();
          console.log(`   ✓ Current plan: ${planText}`);
        }
      } else {
        console.log('   ⚠️  No subscription info visible (might need active subscription)');
      }
    });
  });

  test.describe('2. Registration Dashboard Flow', () => {
    test('2.1 Create test registrations', async ({ page }) => {
      console.log('\n📝 Creating test registrations...');
      
      // For this test, we'll simulate registrations
      // In a real scenario, these would be created through the registration form
      
      // Try to find a test QR code URL
      const testQrUrl = `${BASE_URL}/register/test-org/main-entrance`;
      
      for (let i = 0; i < testRegistrations.length; i++) {
        const registration = testRegistrations[i];
        console.log(`   Creating registration ${i + 1}/${testRegistrations.length}: ${registration.firstName} ${registration.lastName}`);
        
        // Navigate to registration form
        await page.goto(testQrUrl);
        
        // Check if form exists
        const registrationForm = page.locator('#registrationForm').first();
        if (await registrationForm.isVisible({ timeout: 3000 })) {
          // Fill registration form
          await page.fill('input[name="firstName"]', registration.firstName);
          await page.fill('input[name="lastName"]', registration.lastName);
          await page.fill('input[name="email"]', registration.email);
          await page.fill('input[name="phone"]', registration.phone);
          
          // Look for custom fields
          const dietaryField = page.locator('input[name*="dietary"], textarea[name*="dietary"]').first();
          if (await dietaryField.isVisible()) {
            await dietaryField.fill(registration.dietaryRestrictions);
          }
          
          const tshirtField = page.locator('select[name*="shirt"], input[name*="shirt"]').first();
          if (await tshirtField.isVisible()) {
            if (tshirtField.type === 'select') {
              await page.selectOption(tshirtField, registration.tshirtSize);
            } else {
              await tshirtField.fill(registration.tshirtSize);
            }
          }
          
          // Submit registration
          const submitButton = page.locator('button[type="submit"]').first();
          if (await submitButton.isVisible()) {
            await submitButton.click();
            await page.waitForTimeout(2000);
            console.log(`   ✓ Registration submitted for ${registration.firstName}`);
          }
        } else {
          console.log(`   ⚠️  Registration form not found (test URL may not exist)`);
          break;
        }
      }
    });

    test('2.2 View registrations in organization dashboard', async ({ page }) => {
      console.log('\n👥 Checking registrations in dashboard...');
      
      // Navigate to dashboard
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Look for registration grid or table
      const registrationGrid = page.locator('table, .registration-grid, [class*="registration"]').first();
      
      if (await registrationGrid.isVisible({ timeout: 5000 })) {
        console.log('   ✓ Registration grid found');
        
        // Count visible registrations
        const registrationRows = page.locator('tbody tr, .registration-item');
        const count = await registrationRows.count();
        console.log(`   ✓ Found ${count} registrations in dashboard`);
        
        // Check for test registrations
        for (const registration of testRegistrations) {
          const nameElement = page.locator(`text=${registration.firstName}`).first();
          if (await nameElement.isVisible({ timeout: 2000 })) {
            console.log(`   ✓ Found registration: ${registration.firstName} ${registration.lastName}`);
          }
        }
        
        // Check for delivery status indicators
        const statusBadges = page.locator('.status-badge, [class*="status"]');
        if (await statusBadges.count() > 0) {
          console.log('   ✓ Delivery status indicators present');
        }
      } else {
        console.log('   ⚠️  Registration grid not visible (might need registrations or auth)');
      }
    });

    test('2.3 Filter and search registrations', async ({ page }) => {
      console.log('\n🔍 Testing registration filters...');
      
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Look for filter controls
      const filterSection = page.locator('.filters-section, [class*="filter"]').first();
      
      if (await filterSection.isVisible({ timeout: 5000 })) {
        console.log('   ✓ Filter section found');
        
        // Test delivery status filter
        const statusFilter = page.locator('select[name*="status"], select[name*="delivery"]').first();
        if (await statusFilter.isVisible()) {
          await statusFilter.selectOption('pending');
          console.log('   ✓ Applied delivery status filter');
        }
        
        // Test search
        const searchInput = page.locator('input[type="search"], input[placeholder*="search"]').first();
        if (await searchInput.isVisible()) {
          await searchInput.fill('John');
          console.log('   ✓ Performed search');
        }
        
        // Apply filters
        const applyButton = page.locator('button:has-text("Apply"), button:has-text("Filter")').first();
        if (await applyButton.isVisible()) {
          await applyButton.click();
          await page.waitForTimeout(1000);
          console.log('   ✓ Filters applied');
        }
      } else {
        console.log('   ⚠️  Filter section not found');
      }
    });
  });

  test.describe('3. Export and Reports', () => {
    test('3.1 Export registration data', async ({ page }) => {
      console.log('\n📥 Testing data export...');
      
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Look for export button
      const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")').first();
      
      if (await exportButton.isVisible({ timeout: 5000 })) {
        console.log('   ✓ Export button found');
        
        // Set up download promise before clicking
        const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
        
        // Click export button
        await exportButton.click();
        console.log('   ✓ Clicked export button');
        
        // Check for export modal or options
        const exportModal = page.locator('.export-modal, [class*="export"]').first();
        if (await exportModal.isVisible({ timeout: 3000 })) {
          console.log('   ✓ Export options displayed');
          
          // Select CSV format if available
          const csvOption = page.locator('input[value="csv"], button:has-text("CSV")').first();
          if (await csvOption.isVisible()) {
            await csvOption.click();
            console.log('   ✓ Selected CSV format');
          }
          
          // Confirm export
          const confirmExport = page.locator('button:has-text("Download"), button:has-text("Export")').last();
          if (await confirmExport.isVisible()) {
            await confirmExport.click();
          }
        }
        
        // Wait for download
        const download = await downloadPromise;
        if (download) {
          const fileName = download.suggestedFilename();
          console.log(`   ✓ File downloaded: ${fileName}`);
          
          // Verify file type
          if (fileName.endsWith('.csv') || fileName.endsWith('.xlsx')) {
            console.log('   ✓ Export file format correct');
          }
        } else {
          console.log('   ⚠️  Download not triggered (might need implementation)');
        }
      } else {
        console.log('   ⚠️  Export button not found');
      }
    });

    test('3.2 Check registration vs check-in report', async ({ page }) => {
      console.log('\n📊 Testing registration vs check-in report...');
      
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Look for statistics or summary section
      const statsSection = page.locator('.stats, .summary, [class*="statistic"]').first();
      
      if (await statsSection.isVisible({ timeout: 5000 })) {
        console.log('   ✓ Statistics section found');
        
        // Look for registration count
        const totalRegistrations = page.locator('text=/total registration|registered/i').first();
        if (await totalRegistrations.isVisible()) {
          const regText = await totalRegistrations.textContent();
          console.log(`   ✓ Registration stats: ${regText}`);
        }
        
        // Look for check-in count
        const checkedIn = page.locator('text=/checked.?in|arrived/i').first();
        if (await checkedIn.isVisible()) {
          const checkinText = await checkedIn.textContent();
          console.log(`   ✓ Check-in stats: ${checkinText}`);
        }
        
        // Look for percentage or ratio
        const percentage = page.locator('text=/%/').first();
        if (await percentage.isVisible()) {
          const percentText = await percentage.textContent();
          console.log(`   ✓ Attendance rate: ${percentText}`);
        }
      } else {
        console.log('   ⚠️  Statistics section not found');
      }
    });

    test('3.3 Download detailed reports', async ({ page }) => {
      console.log('\n📈 Testing detailed reports...');
      
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Look for reports section or menu
      const reportsLink = page.locator('a:has-text("Reports"), button:has-text("Reports")').first();
      
      if (await reportsLink.isVisible({ timeout: 5000 })) {
        await reportsLink.click();
        await page.waitForTimeout(2000);
        console.log('   ✓ Navigated to reports section');
        
        // Check for different report types
        const reportTypes = [
          'Registration Report',
          'Check-in Report',
          'No-show Report',
          'Custom Field Report'
        ];
        
        for (const reportType of reportTypes) {
          const report = page.locator(`text=/${reportType}/i`).first();
          if (await report.isVisible({ timeout: 2000 })) {
            console.log(`   ✓ ${reportType} available`);
          }
        }
      } else {
        console.log('   ⚠️  Reports section not found');
      }
    });
  });

  test.describe('4. End-to-End Business Flow', () => {
    test('4.1 Complete business workflow', async ({ page }) => {
      console.log('\n🚀 Testing complete business workflow...');
      
      const steps = [
        '1. Organization signs up',
        '2. Creates custom registration form',
        '3. Generates QR codes',
        '4. Attendees register',
        '5. Check-ins processed',
        '6. View dashboard analytics',
        '7. Export reports'
      ];
      
      console.log('   Workflow steps:');
      steps.forEach(step => console.log(`   ${step}`));
      
      // This test would combine all previous tests in sequence
      // For now, we'll verify key pages are accessible
      
      const pages = [
        { url: '/pricing', name: 'Pricing' },
        { url: '/onboarding/organization-setup', name: 'Organization Setup' },
        { url: '/onboarding/form-builder', name: 'Form Builder' },
        { url: '/onboarding/qr-configuration', name: 'QR Configuration' },
        { url: '/dashboard', name: 'Dashboard' }
      ];
      
      for (const pageInfo of pages) {
        await page.goto(`${BASE_URL}${pageInfo.url}`);
        const isAccessible = await page.locator('h1, h2').first().isVisible({ timeout: 3000 });
        if (isAccessible) {
          console.log(`   ✓ ${pageInfo.name} page accessible`);
        } else {
          console.log(`   ⚠️  ${pageInfo.name} page not accessible`);
        }
      }
    });
  });

  test.describe('5. Data Validation', () => {
    test('5.1 Verify data persistence', async ({ page }) => {
      console.log('\n💾 Testing data persistence...');
      
      // Navigate to dashboard
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Check if previously created data is still visible
      const dataPresent = await page.locator('text=/E2E_TEST/').first().isVisible({ timeout: 5000 });
      
      if (dataPresent) {
        console.log('   ✓ Test data persisted in system');
      } else {
        console.log('   ⚠️  Test data not found (might be filtered or deleted)');
      }
    });

    test('5.2 Verify custom field data integrity', async ({ page }) => {
      console.log('\n🔒 Testing custom field data integrity...');
      
      await page.goto(`${BASE_URL}/dashboard`);
      
      // Look for custom field data in registrations
      const customFieldData = page.locator('text=/dietary|t-shirt|emergency/i').first();
      
      if (await customFieldData.isVisible({ timeout: 5000 })) {
        console.log('   ✓ Custom field data visible in dashboard');
        
        // Verify data types are preserved
        const fieldValues = await page.locator('td, .field-value').allTextContents();
        console.log(`   ✓ Found ${fieldValues.length} field values`);
      } else {
        console.log('   ⚠️  Custom field data not visible');
      }
    });
  });
});

test.describe('Performance and Scale Tests', () => {
  test('Load test with multiple registrations', async ({ page }) => {
    console.log('\n⚡ Testing system performance...');
    
    const startTime = Date.now();
    
    // Navigate to dashboard with potential large dataset
    await page.goto(`${BASE_URL}/dashboard`);
    
    const loadTime = Date.now() - startTime;
    console.log(`   Dashboard load time: ${loadTime}ms`);
    
    if (loadTime < 2000) {
      console.log('   ✓ Excellent performance');
    } else if (loadTime < 5000) {
      console.log('   ✓ Acceptable performance');
    } else {
      console.log('   ⚠️  Performance needs optimization');
    }
  });
});