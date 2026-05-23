import { test, expect } from '@playwright/test';

/**
 * Cluster A: Custom Form Field Labels Show as Raw IDs
 * Issues: #20, #21, #24
 * 
 * Root Cause: UI components use Object.entries(registrationData) 
 * instead of parseRegistrationData utility with formFields
 */

test.describe('Cluster A: Field Labels as IDs (Issues #20, #21, #24)', () => {
  const baseURL = process.env.BASE_URL || 'http://localhost:7777';
  let orgSlug: string;
  let orgId: string;
  let contactEmail: string;
  let registrationId: string;

  test.beforeAll(async ({ request }) => {
    // Seed organization with custom form fields
    const response = await request.post(`${baseURL}/api/test/seed`, {
      data: {
        seedKey: `cluster-a-${Date.now()}`,
        organizationName: 'Cluster A Test Org',
        contactEmail: `cluster-a-${Date.now()}@test.com`,
        formFields: [
          {
            id: 'Field_ABC123',
            type: 'text',
            label: 'Participant Full Name',
            required: true,
            placeholder: 'Enter your full name'
          },
          {
            id: 'Field_XYZ789',
            type: 'email',
            label: 'Email Address',
            required: true,
            placeholder: 'your@email.com'
          },
          {
            id: 'Field_DEF456',
            type: 'phone',
            label: 'Mobile Phone Number',
            required: false,
            placeholder: '+1 (555) 555-5555'
          }
        ],
        registrations: [
          {
            qrCodeId: 'main-entrance',
            data: {
              Field_ABC123: 'John Smith',
              Field_XYZ789: 'john.smith@example.com',
              Field_DEF456: '(555) 123-4567'
            }
          }
        ]
      }
    });

    expect(response.ok()).toBeTruthy();
    const seed = await response.json();
    orgSlug = seed.orgSlug;
    orgId = seed.organizationId;
    contactEmail = seed.contactEmail;
    registrationId = seed.registrationsCreated[0];
  });

  test('Issue #20: Registration success page shows human-readable field labels', async ({ page }) => {
    // Navigate to registration form
    await page.goto(`${baseURL}/register/${orgSlug}/main-entrance`);
    
    // Fill out form with custom fields
    await page.fill('input[name="Field_ABC123"]', 'Jane Doe');
    await page.fill('input[name="Field_XYZ789"]', 'jane.doe@test.com');
    await page.fill('input[name="Field_DEF456"]', '(555) 987-6543');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for redirect to success page
    await page.waitForURL(/\/registration-success/);
    
    // Check for human-readable labels (NOT raw IDs)
    const successContent = await page.textContent('body');
    
    // ✅ SHOULD show human-readable labels
    expect(successContent).toContain('Participant Full Name');
    expect(successContent).toContain('Email Address');
    expect(successContent).toContain('Mobile Phone Number');
    
    // ❌ SHOULD NOT show raw field IDs
    expect(successContent).not.toContain('Field_ABC123');
    expect(successContent).not.toContain('Field_XYZ789');
    expect(successContent).not.toContain('Field_DEF456');
  });

  test('Issue #21: Check-in API returns parsed names (not "Unknown")', async ({ request }) => {
    // Call check-in search API
    const response = await request.get(
      `${baseURL}/api/check-in/search?organizationId=${orgId}&query=John`
    );
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    // Should find the registration
    expect(data.registrations).toBeDefined();
    expect(data.registrations.length).toBeGreaterThan(0);
    
    const registration = data.registrations[0];
    
    // ✅ Name should be parsed correctly
    expect(registration.name).toBe('John Smith');
    expect(registration.name).not.toBe('Unknown');
    
    // ✅ Email should be parsed
    expect(registration.email).toContain('john.smith@example.com');
    
    // ✅ Phone should be parsed
    expect(registration.phone).toContain('(555) 123-4567');
  });

  test('Issue #21: Check-in search filters by actual name', async ({ request }) => {
    // Search by the actual name value
    const response = await request.get(
      `${baseURL}/api/check-in/search?organizationId=${orgId}&query=John+Smith`
    );
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    // ✅ Should find registration by actual name
    expect(data.registrations.length).toBeGreaterThan(0);
    
    // ❌ Should NOT require searching by field ID
    const badResponse = await request.get(
      `${baseURL}/api/check-in/search?organizationId=${orgId}&query=Field_ABC123`
    );
    const badData = await badResponse.json();
    
    // Searching by field ID should not be necessary
    expect(badData.registrations.length).toBe(0);
  });

  test('Issue #24: Registration detail view shows human-readable labels', async ({ request }) => {
    // Get registration detail
    const response = await request.get(
      `${baseURL}/api/registrations/${registrationId}`
    );
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    
    // ✅ Response should include formFields for label mapping
    expect(data.formFields).toBeDefined();
    expect(Array.isArray(data.formFields)).toBeTruthy();
    expect(data.formFields.length).toBeGreaterThan(0);
    
    // Verify formFields include labels
    const nameField = data.formFields.find((f: any) => f.id === 'Field_ABC123');
    expect(nameField).toBeDefined();
    expect(nameField.label).toBe('Participant Full Name');
  });
});
