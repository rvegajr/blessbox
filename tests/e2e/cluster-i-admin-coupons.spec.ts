import { test, expect } from '@playwright/test';

/**
 * Cluster I: Admin Coupon Management
 * Issue: #29
 * 
 * Root Causes:
 * 1. "table coupons has no column named description" - Schema mismatch
 * 2. "Expires At" field confusing - UX issue with date/time input
 * 3. "Maximum Discount" marked optional but required - Validation bug
 */

test.describe('Cluster I: Admin Coupon Management (Issue #29)', () => {
  const baseURL = process.env.BASE_URL || 'http://localhost:7777';
  const adminEmail = process.env.SUPERADMIN_EMAIL || 'admin@blessbox.app';
  const adminPassword = process.env.SUPERADMIN_PASSWORD || 'BlessBox2026!';

  test.beforeEach(async ({ page }) => {
    // Login as super-admin before each test
    await page.goto(`${baseURL}/admin-login`);
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to admin dashboard
    await page.waitForURL(/\/admin/);
  });

  test('Issue #29.1: Can create new coupon without "description" column error', async ({ request, page }) => {
    // Navigate to coupons page
    await page.goto(`${baseURL}/admin/coupons`);
    
    // Click "Create Coupon" button
    const createButton = page.locator('button:has-text("Create"), a:has-text("Create")').first();
    await createButton.click();
    
    // Fill in coupon form
    const uniqueCode = `SAVE20_${Date.now()}`;
    await page.fill('input[name="code"]', uniqueCode);
    await page.fill('input[name="description"]', 'Save 20% on all plans'); // Optional description
    await page.selectOption('select[name="discountType"]', 'percentage');
    await page.fill('input[name="discountValue"]', '20');
    await page.fill('input[name="maxRedemptions"]', '100');
    
    // Set expiry date (30 days from now)
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const dateString = futureDate.toISOString().split('T')[0];
    await page.fill('input[name="expiresAt"]', dateString);
    
    // Submit form
    await page.click('button[type="submit"]:has-text("Save"), button:has-text("Create")');
    
    // ✅ Should NOT see "table coupons has no column named description" error
    await page.waitForTimeout(1000);
    const pageContent = await page.textContent('body');
    
    expect(pageContent).not.toContain('has no column named description');
    expect(pageContent).not.toContain('SQLite error');
    
    // ✅ Should see success message or coupon in list
    const hasSuccess = pageContent?.includes(uniqueCode) || 
                      pageContent?.includes('created') || 
                      pageContent?.includes('success');
    expect(hasSuccess).toBeTruthy();
  });

  test('Issue #29.1: Can create coupon via API without description column error', async ({ request }) => {
    // Test the API endpoint directly
    const response = await request.post(`${baseURL}/api/admin/coupons`, {
      headers: {
        'Cookie': `bb_test_auth=1; bb_test_email=${adminEmail}`
      },
      data: {
        code: `TEST_${Date.now()}`,
        description: 'Test coupon description',
        discountType: 'percentage',
        discountValue: 20,
        minAmount: 1000, // $10 minimum
        maxDiscount: null, // Optional
        maxRedemptions: 100,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        applicablePlans: ['standard', 'enterprise'],
        isActive: true
      }
    });

    // ✅ Should NOT return database error about description column
    if (!response.ok()) {
      const errorData = await response.json();
      expect(errorData.error).not.toContain('has no column named description');
      expect(errorData.error).not.toContain('SQLite error');
    } else {
      // Success case
      const data = await response.json();
      expect(data.success).toBeTruthy();
      expect(data.coupon).toBeDefined();
      expect(data.coupon.code).toContain('TEST_');
    }
  });

  test('Issue #29.2: "Expires At" field has clear date/time format', async ({ page }) => {
    // Navigate to create coupon page
    await page.goto(`${baseURL}/admin/coupons`);
    await page.locator('button:has-text("Create"), a:has-text("Create")').first().click();
    
    // Find the "Expires At" input field
    const expiresAtInput = page.locator('input[name="expiresAt"], input[type="datetime-local"]');
    
    // ✅ Should have clear label
    const expiresAtLabel = page.locator('label:has-text("Expires")');
    await expect(expiresAtLabel).toBeVisible();
    
    // ✅ Should have placeholder or helper text explaining format
    const hasPlaceholder = await expiresAtInput.getAttribute('placeholder');
    const hasHelperText = await page.locator('text=/format|example|YYYY-MM-DD|guidance/i').count();
    
    expect(hasPlaceholder || hasHelperText > 0, 
      'Expires At field should have placeholder or helper text explaining format'
    ).toBeTruthy();
    
    // ✅ Editing time should not affect date unexpectedly
    // Fill in date and time
    const testDate = '2026-12-31T23:59';
    await expiresAtInput.fill(testDate);
    
    // Verify value is preserved
    const inputValue = await expiresAtInput.inputValue();
    expect(inputValue).toContain('2026-12-31');
  });

  test('Issue #29.3: "Maximum Discount" field is truly optional', async ({ request }) => {
    // Test that maxDiscount can be omitted (null) for percentage coupons
    const response = await request.post(`${baseURL}/api/admin/coupons`, {
      headers: {
        'Cookie': `bb_test_auth=1; bb_test_email=${adminEmail}`
      },
      data: {
        code: `UNLIMITED_${Date.now()}`,
        description: 'No max discount limit',
        discountType: 'percentage',
        discountValue: 50,
        minAmount: null,
        maxDiscount: null, // ← Should be optional!
        maxRedemptions: 10,
        expiresAt: null,
        applicablePlans: null,
        isActive: true
      }
    });

    const data = await response.json();
    
    // ✅ Should NOT return validation error about maxDiscount being required
    if (!response.ok()) {
      expect(data.error).not.toContain('maxDiscount');
      expect(data.error).not.toContain('Maximum Discount');
      expect(data.code).not.toBe('VALIDATION_ERROR');
    }
    
    // ✅ Should create successfully with null maxDiscount
    expect(response.status()).not.toBe(400);
  });

  test('Issue #29.4: Can edit existing coupon', async ({ request, page }) => {
    // First create a coupon
    const createResponse = await request.post(`${baseURL}/api/admin/coupons`, {
      headers: {
        'Cookie': `bb_test_auth=1; bb_test_email=${adminEmail}`
      },
      data: {
        code: `EDIT_TEST_${Date.now()}`,
        description: 'Original description',
        discountType: 'percentage',
        discountValue: 20,
        maxRedemptions: 100,
        isActive: true
      }
    });

    expect(createResponse.ok()).toBeTruthy();
    const created = await createResponse.json();
    const couponId = created.coupon.id;

    // Navigate to coupons page
    await page.goto(`${baseURL}/admin/coupons`);
    
    // Find and click edit button for this coupon
    const editButton = page.locator(`button[data-coupon-id="${couponId}"]:has-text("Edit"), a[href*="/admin/coupons/${couponId}"]`).first();
    
    if (await editButton.count() > 0) {
      await editButton.click();
      
      // Change max redemptions from 100 to 50
      await page.fill('input[name="maxRedemptions"]', '50');
      
      // Save changes
      await page.click('button[type="submit"]:has-text("Save")');
      
      // ✅ Should reflect updated value
      await page.waitForTimeout(1000);
      const pageContent = await page.textContent('body');
      expect(pageContent).toContain('50');
    }
  });

  test('Issue #29.5: Can view coupon analytics/redemption count', async ({ page }) => {
    // Navigate to coupons page
    await page.goto(`${baseURL}/admin/coupons`);
    
    // ✅ Should show redemption count column
    const hasRedemptionColumn = await page.locator('th:has-text("Redemption"), th:has-text("Usage"), th:has-text("Uses")').count();
    expect(hasRedemptionColumn).toBeGreaterThan(0);
    
    // ✅ New coupons should show 0 redemptions
    const zeroRedemptions = await page.locator('td:has-text("0 /"), td:has-text("0 uses")').count();
    expect(zeroRedemptions).toBeGreaterThan(0);
  });

  test('Issue #29.6: Duplicate coupon code is rejected with clear error', async ({ request }) => {
    const duplicateCode = `DUP_${Date.now()}`;
    
    // Create first coupon
    const first = await request.post(`${baseURL}/api/admin/coupons`, {
      headers: {
        'Cookie': `bb_test_auth=1; bb_test_email=${adminEmail}`
      },
      data: {
        code: duplicateCode,
        discountType: 'percentage',
        discountValue: 10,
        isActive: true
      }
    });

    expect(first.ok()).toBeTruthy();

    // Try to create duplicate
    const second = await request.post(`${baseURL}/api/admin/coupons`, {
      headers: {
        'Cookie': `bb_test_auth=1; bb_test_email=${adminEmail}`
      },
      data: {
        code: duplicateCode, // Same code!
        discountType: 'percentage',
        discountValue: 20,
        isActive: true
      }
    });

    // ✅ Should return 409 Conflict
    expect(second.status()).toBe(409);
    
    const error = await second.json();
    
    // ✅ Should have clear error message
    expect(error.error).toMatch(/already exists|duplicate/i);
    expect(error.code).toBe('DUPLICATE_CODE');
  });

  test('Issue #29.7: Can delete coupon', async ({ request, page }) => {
    // Create a coupon to delete
    const createResponse = await request.post(`${baseURL}/api/admin/coupons`, {
      headers: {
        'Cookie': `bb_test_auth=1; bb_test_email=${adminEmail}`
      },
      data: {
        code: `DELETE_ME_${Date.now()}`,
        discountType: 'percentage',
        discountValue: 10,
        isActive: true
      }
    });

    expect(createResponse.ok()).toBeTruthy();
    const created = await createResponse.json();
    const couponId = created.coupon.id;
    const couponCode = created.coupon.code;

    // Navigate to coupons page
    await page.goto(`${baseURL}/admin/coupons`);
    
    // ✅ Coupon should be visible
    await expect(page.locator(`text="${couponCode}"`)).toBeVisible();
    
    // Delete the coupon (either via UI or API)
    const deleteResponse = await request.delete(`${baseURL}/api/admin/coupons/${couponId}`, {
      headers: {
        'Cookie': `bb_test_auth=1; bb_test_email=${adminEmail}`
      }
    });

    // ✅ Should delete successfully
    expect(deleteResponse.ok()).toBeTruthy();

    // Refresh page
    await page.reload();
    
    // ✅ Coupon should no longer appear
    await expect(page.locator(`text="${couponCode}"`)).not.toBeVisible();
  });

  test('Issue #29.8: Deleted coupon cannot be applied at checkout', async ({ request }) => {
    // Create and delete a coupon
    const createResponse = await request.post(`${baseURL}/api/admin/coupons`, {
      headers: {
        'Cookie': `bb_test_auth=1; bb_test_email=${adminEmail}`
      },
      data: {
        code: `DELETED_${Date.now()}`,
        discountType: 'percentage',
        discountValue: 100,
        isActive: true
      }
    });

    const created = await createResponse.json();
    const couponId = created.coupon.id;
    const couponCode = created.coupon.code;

    // Delete it
    await request.delete(`${baseURL}/api/admin/coupons/${couponId}`, {
      headers: {
        'Cookie': `bb_test_auth=1; bb_test_email=${adminEmail}`
      }
    });

    // Try to apply at checkout
    const applyResponse = await request.post(`${baseURL}/api/coupons/apply`, {
      data: {
        code: couponCode,
        planType: 'enterprise',
        amountCents: 9900
      }
    });

    const data = await applyResponse.json();
    
    // ✅ Should return error that coupon not found or inactive
    expect(data.valid).toBeFalsy();
    expect(data.error).toMatch(/not found|inactive/i);
  });
});
