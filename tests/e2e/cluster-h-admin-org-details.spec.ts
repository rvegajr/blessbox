import { test, expect } from '@playwright/test';

/**
 * Cluster H: Super-Admin Organization Details Missing
 * Issue: #28
 * 
 * Root Cause: Organizations table has no "View Details" button or clickable links
 */

test.describe('Cluster H: Super-Admin Org Details (Issue #28)', () => {
  const baseURL = process.env.BASE_URL || 'http://localhost:7777';
  const adminEmail = process.env.SUPERADMIN_EMAIL || 'admin@blessbox.app';
  const adminPassword = process.env.SUPERADMIN_PASSWORD || 'BlessBox2026!';
  
  let testOrgIds: string[] = [];

  test.beforeAll(async ({ request }) => {
    // Seed multiple organizations for admin to manage
    for (let i = 1; i <= 3; i++) {
      const response = await request.post(`${baseURL}/api/test/seed`, {
        data: {
          seedKey: `admin-org-${Date.now()}-${i}`,
          organizationName: `Admin Test Org ${i}`,
          contactEmail: `admin-test-${i}-${Date.now()}@example.com`
        }
      });

      if (response.ok()) {
        const seed = await response.json();
        testOrgIds.push(seed.organizationId);
      }
    }

    expect(testOrgIds.length).toBeGreaterThan(0);
  });

  test('Issue #28: Organizations tab has "View Details" buttons or clickable links', async ({ page }) => {
    // Navigate to admin login page (NOT regular login!)
    await page.goto(`${baseURL}/admin-login`);
    
    // Login as super-admin
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to admin dashboard
    await page.waitForURL(/\/admin/);
    
    // Click Organizations tab
    await page.click('button:has-text("Organizations")');
    
    // Wait for organizations table to load
    await page.waitForSelector('table');
    
    // ✅ Should have "Actions" column header
    const headers = await page.locator('th').allTextContents();
    expect(headers.some(h => h.toLowerCase().includes('action'))).toBeTruthy();
    
    // ✅ Should have "View Details" buttons or clickable org names
    const hasViewDetailsButtons = await page.locator('button:has-text("View Details"), a:has-text("View Details")').count();
    const hasClickableOrgNames = await page.locator('table a[href*="/admin/organizations/"]').count();
    
    const hasInteractiveElements = hasViewDetailsButtons > 0 || hasClickableOrgNames > 0;
    
    expect(hasInteractiveElements, 
      'Organizations table should have "View Details" buttons or clickable organization names'
    ).toBeTruthy();
  });

  test('Issue #28: Clicking "View Details" navigates to organization detail page', async ({ page }) => {
    // Login as admin
    await page.goto(`${baseURL}/admin-login`);
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/);
    
    // Go to Organizations tab
    await page.click('button:has-text("Organizations")');
    await page.waitForSelector('table');
    
    // Click first "View Details" button or org name link
    const viewDetailsButton = page.locator('button:has-text("View Details"), a:has-text("View Details")').first();
    const orgNameLink = page.locator('table a[href*="/admin/organizations/"]').first();
    
    const clickTarget = await viewDetailsButton.count() > 0 ? viewDetailsButton : orgNameLink;
    
    await clickTarget.click();
    
    // ✅ Should navigate to organization detail page
    await page.waitForURL(/\/admin\/organizations\/[a-f0-9-]+/);
    
    // ✅ Detail page should show organization information
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/organization|registrations|qr.*code/i);
  });

  test('Issue #28: Organization detail API endpoint exists and returns data', async ({ request }) => {
    // Test that the API endpoint exists
    const orgId = testOrgIds[0];
    
    const response = await request.get(`${baseURL}/api/admin/organizations/${orgId}`);
    
    // ✅ Should return 200 OK (or 403 if not authenticated, but not 404)
    expect(response.status()).not.toBe(404);
    
    if (response.ok()) {
      const data = await response.json();
      
      // ✅ Should return organization details
      expect(data.organization || data).toBeDefined();
      expect(data.organization?.id || data.id).toBe(orgId);
    }
  });

  test('Issue #28: Admin can manage organizations (suspend, delete)', async ({ page }) => {
    // Login as admin
    await page.goto(`${baseURL}/admin-login`);
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/);
    
    // Go to Organizations tab
    await page.click('button:has-text("Organizations")');
    await page.waitForSelector('table');
    
    // ✅ Should have management actions (Suspend, Delete buttons)
    const hasSuspendButton = await page.locator('button:has-text("Suspend")').count();
    const hasDeleteButton = await page.locator('button:has-text("Delete")').count();
    
    const hasManagementActions = hasSuspendButton > 0 || hasDeleteButton > 0;
    
    expect(hasManagementActions,
      'Organizations table should have management action buttons (Suspend, Delete)'
    ).toBeTruthy();
  });
});
