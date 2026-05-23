import { test, expect } from '@playwright/test';

/**
 * Cluster B: Duplicate Registrations
 * Issues: #21, #23, #24
 * 
 * Root Causes:
 * 1. Cartesian product JOIN in recent activity query
 * 2. No idempotency in registration submission
 */

test.describe('Cluster B: Duplicate Registrations (Issues #21, #23, #24)', () => {
  const baseURL = process.env.BASE_URL || 'http://localhost:7777';
  let orgId: string;
  let orgSlug: string;

  test.beforeAll(async ({ request }) => {
    const response = await request.post(`${baseURL}/api/test/seed`, {
      data: {
        seedKey: `cluster-b-${Date.now()}`,
        organizationName: 'Cluster B Test Org',
        contactEmail: `cluster-b-${Date.now()}@test.com`
      }
    });

    expect(response.ok()).toBeTruthy();
    const seed = await response.json();
    orgId = seed.organizationId;
    orgSlug = seed.orgSlug;
  });

  test('Issue #21/#23: Recent activity has no duplicate entries', async ({ request }) => {
    // Get recent activity
    const response = await request.get(
      `${baseURL}/api/dashboard/recent-activity?organizationId=${orgId}`
    );
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    const activities = data.activities || [];
    
    // Count registrations by ID
    const idCounts: Record<string, number> = {};
    activities.forEach((activity: any) => {
      idCounts[activity.id] = (idCounts[activity.id] || 0) + 1;
    });
    
    // ✅ Each registration ID should appear only ONCE
    Object.entries(idCounts).forEach(([id, count]) => {
      expect(count, `Registration ${id} appears ${count} times (should be 1)`).toBe(1);
    });
  });

  test('Issue #21/#24: Idempotency - rapid submissions create only one registration', async ({ request }) => {
    const testEmail = `idempotency-${Date.now()}@test.com`;
    
    // Submit same registration data 3 times rapidly in parallel
    const submissions = await Promise.all([
      request.post(`${baseURL}/api/registrations/submit`, {
        data: {
          orgSlug,
          qrLabel: 'main-entrance',
          formData: {
            name: 'Duplicate Test User',
            email: testEmail,
            phone: '(555) 999-8888'
          }
        }
      }),
      request.post(`${baseURL}/api/registrations/submit`, {
        data: {
          orgSlug,
          qrLabel: 'main-entrance',
          formData: {
            name: 'Duplicate Test User',
            email: testEmail,
            phone: '(555) 999-8888'
          }
        }
      }),
      request.post(`${baseURL}/api/registrations/submit`, {
        data: {
          orgSlug,
          qrLabel: 'main-entrance',
          formData: {
            name: 'Duplicate Test User',
            email: testEmail,
            phone: '(555) 999-8888'
          }
        }
      })
    ]);
    
    // At least one should succeed
    const successCount = submissions.filter(r => r.ok()).length;
    expect(successCount).toBeGreaterThan(0);
    
    // Wait a moment for data to settle
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check recent activity
    const activityResponse = await request.get(
      `${baseURL}/api/dashboard/recent-activity?organizationId=${orgId}`
    );
    
    const activityData = await activityResponse.json();
    const activities = activityData.activities || [];
    
    // Count how many registrations have this email
    const matchingRegistrations = activities.filter((a: any) => 
      a.email === testEmail || 
      (a.registrationData && JSON.stringify(a.registrationData).includes(testEmail))
    );
    
    // ✅ Should have created only ONE registration (idempotency)
    // ❌ Currently creates 3 duplicates
    expect(matchingRegistrations.length, 
      `Expected 1 registration with email ${testEmail}, found ${matchingRegistrations.length}`
    ).toBeLessThanOrEqual(1);
  });

  test('Issue #23: Dashboard stats count registrations only once', async ({ request }) => {
    // Get dashboard stats
    const response = await request.get(
      `${baseURL}/api/dashboard/stats?organizationId=${orgId}`
    );
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    // Get actual registration count from registrations API
    const regsResponse = await request.get(
      `${baseURL}/api/registrations?organizationId=${orgId}`
    );
    const regsData = await regsResponse.json();
    const actualRegistrations = regsData.registrations || [];
    
    // Get unique registration IDs
    const uniqueIds = new Set(actualRegistrations.map((r: any) => r.id));
    const actualCount = uniqueIds.size;
    
    // ✅ Stats should match actual unique registration count
    const statsTotal = data.todayRegistrations + data.weekRegistrations + data.monthRegistrations;
    
    // Stats should not be inflated by duplicates
    expect(data.weekRegistrations).toBeLessThanOrEqual(actualCount);
  });
});
