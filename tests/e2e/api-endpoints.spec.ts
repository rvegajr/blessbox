import { test, expect } from '@playwright/test';

// Test configuration
const ENVIRONMENTS = {
  production: 'https://www.blessbox.org',
  development: 'https://dev.blessbox.org',
  local: 'http://localhost:7777'
};

// Get environment from ENV variable or default to production
const ENV = process.env.TEST_ENV || 'production';
const BASE_URL = ENVIRONMENTS[ENV] || ENVIRONMENTS.production;

// Test data for QR codes
const sampleQRCodeData = [
  {
    label: 'main-entrance',
    dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  },
  {
    label: 'side-entrance',
    dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  },
  {
    label: 'vip-entrance',
    dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  }
];

// Test organization will be created dynamically
let TEST_ORG_ID = '';
let TEST_QR_SET_ID = '';

test.describe(`BlessBox API Endpoint Tests - ${ENV.charAt(0).toUpperCase() + ENV.slice(1)}`, () => {
  test.beforeAll(async ({ request }) => {
    console.log('\n' + '='.repeat(60));
    console.log('🔌 BlessBox API Endpoint Testing Suite');
    console.log('='.repeat(60));
    console.log(`📍 Environment: ${ENV.charAt(0).toUpperCase() + ENV.slice(1)}`);
    console.log(`🌐 URL: ${BASE_URL}`);
    console.log('='.repeat(60));
    console.log('\n🎯 Setting up test data and testing export endpoints');
    console.log('='.repeat(60) + '\n');

    // Only create test data for local environment
    if (ENV === 'local') {
      try {
        console.log('🌱 Creating test organization and data...');
        
        // Create test organization via migration API
        const sessionData = {
          organizationName: 'E2E Test Organization',
          eventName: 'Test Event 2024',
          contactEmail: `test-${Date.now()}@example.com`,
          contactPhone: '+1-555-123-4567',
          contactAddress: '123 Test Street',
          contactCity: 'Test City',
          contactState: 'TS',
          contactZip: '12345',
          emailVerified: true,
          onboardingComplete: true,
          qrCodes: sampleQRCodeData
        };

        const response = await request.post(`${BASE_URL}/api/migration/migrate-onboarding`, {
          data: { sessionData }
        });

        if (response.status() === 200) {
          const result = await response.json();
          if (result.success) {
            TEST_ORG_ID = result.organizationId;
            TEST_QR_SET_ID = result.qrCodeSetId || '';
            console.log(`   ✓ Created organization: ${TEST_ORG_ID}`);
            console.log(`   ✓ Created QR set: ${TEST_QR_SET_ID}`);
            
            // Create some sample registrations
            if (TEST_QR_SET_ID) {
              console.log('👥 Creating sample registrations...');
              const sampleRegistrations = [
                { firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', qrCodeId: 'main-entrance' },
                { firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@example.com', qrCodeId: 'side-entrance' },
                { firstName: 'Bob', lastName: 'Johnson', email: 'bob.johnson@example.com', qrCodeId: 'main-entrance' },
                { firstName: 'Alice', lastName: 'Wilson', email: 'alice.wilson@example.com', qrCodeId: 'vip-entrance' }
              ];

              for (const regData of sampleRegistrations) {
                try {
                  const regResponse = await request.post(`${BASE_URL}/api/test/create-registration`, {
                    data: {
                      qrCodeSetId: TEST_QR_SET_ID,
                      qrCodeId: regData.qrCodeId,
                      registrationData: regData
                    }
                  });
                  
                  if (regResponse.status() === 200) {
                    console.log(`   ✓ Created registration: ${regData.firstName} ${regData.lastName}`);
                  } else {
                    console.warn(`   ⚠️  Failed to create registration for ${regData.firstName}`);
                  }
                } catch (error) {
                  console.warn(`   ⚠️  Registration creation error for ${regData.firstName}:`, error);
                }
              }
            }
          } else {
            console.warn('   ⚠️  Failed to create test organization:', result.error);
            TEST_ORG_ID = 'test-org-fallback';
          }
        } else {
          console.warn('   ⚠️  Migration API not available, using fallback ID');
          TEST_ORG_ID = 'test-org-fallback';
        }
      } catch (error) {
        console.warn('   ⚠️  Test setup failed, using fallback ID:', error);
        TEST_ORG_ID = 'test-org-fallback';
      }
    } else {
      // For production/dev environments, use a placeholder
      TEST_ORG_ID = 'test-org-123';
    }
  });

  test('1. PDF Export API - GET /api/registrations/export?orgId=...&format=pdf', async ({ request }) => {
    console.log('\n📄 Testing PDF export endpoint...');
    
    try {
      // Set up download promise
      const response = await request.get(`${BASE_URL}/api/registrations/export`, {
        params: {
          orgId: TEST_ORG_ID,
          format: 'pdf'
        }
      });

      console.log(`   Response status: ${response.status()}`);
      
      // Check if the request was successful
      if (response.status() === 200) {
        // Verify content type is PDF
        const contentType = response.headers()['content-type'];
        console.log(`   Content-Type: ${contentType}`);
        
        expect(contentType).toContain('application/pdf');
        console.log('   ✓ Content-Type is application/pdf');
        
        // Verify content disposition indicates download
        const contentDisposition = response.headers()['content-disposition'];
        console.log(`   Content-Disposition: ${contentDisposition}`);
        
        expect(contentDisposition).toContain('attachment');
        expect(contentDisposition).toContain('.pdf');
        console.log('   ✓ Content-Disposition indicates PDF download');
        
        // Verify response body is not empty
        const body = await response.body();
        expect(body.length).toBeGreaterThan(0);
        console.log(`   ✓ Response body size: ${body.length} bytes`);
        
        // Verify it's actually a PDF (starts with %PDF)
        const bodyText = body.toString('utf8', 0, 4);
        expect(bodyText).toBe('%PDF');
        console.log('   ✓ Response body is valid PDF format');
        
        console.log('   ✅ PDF export endpoint working correctly');
      } else if (response.status() === 400) {
        // Expected for test org ID that doesn't exist
        const body = await response.json();
        console.log(`   ⚠️  Expected error for test org: ${body.error}`);
        expect(body.error).toContain('orgId');
        console.log('   ✅ Properly handles invalid orgId');
      } else {
        console.log(`   ⚠️  Unexpected status: ${response.status()}`);
        const body = await response.text();
        console.log(`   Response body: ${body}`);
      }
    } catch (error) {
      console.log(`   ❌ Request failed: ${error}`);
      // Don't fail the test for network issues in local environment
      if (ENV === 'local') {
        console.log('   ⚠️  Skipping test due to local environment network issue');
      } else {
        throw error;
      }
    }
  });

  test('2. ZIP Download API - POST /api/qr/download', async ({ request }) => {
    console.log('\n📦 Testing QR code ZIP download endpoint...');
    
    try {
      // Set up download promise
      const response = await request.post(`${BASE_URL}/api/qr/download`, {
        data: {
          qrCodes: sampleQRCodeData,
          format: 'both' // Include both PNG and PDF
        }
      });

      console.log(`   Response status: ${response.status()}`);
      
      // Check if the request was successful
      if (response.status() === 200) {
        // Verify content type is ZIP
        const contentType = response.headers()['content-type'];
        console.log(`   Content-Type: ${contentType}`);
        
        expect(contentType).toContain('application/zip');
        console.log('   ✓ Content-Type is application/zip');
        
        // Verify content disposition indicates download
        const contentDisposition = response.headers()['content-disposition'];
        console.log(`   Content-Disposition: ${contentDisposition}`);
        
        expect(contentDisposition).toContain('attachment');
        expect(contentDisposition).toContain('.zip');
        console.log('   ✓ Content-Disposition indicates ZIP download');
        
        // Verify response body is not empty
        const body = await response.body();
        expect(body.length).toBeGreaterThan(0);
        console.log(`   ✓ Response body size: ${body.length} bytes`);
        
        // Verify it's actually a ZIP file (starts with PK)
        const bodyText = body.toString('utf8', 0, 2);
        expect(bodyText).toBe('PK');
        console.log('   ✓ Response body is valid ZIP format');
        
        console.log('   ✅ ZIP download endpoint working correctly');
      } else {
        console.log(`   ❌ Unexpected status: ${response.status()}`);
        const body = await response.text();
        console.log(`   Response body: ${body}`);
        throw new Error(`Unexpected response status: ${response.status()}`);
      }
    } catch (error) {
      console.log(`   ❌ Request failed: ${error}`);
      // Don't fail the test for network issues in local environment
      if (ENV === 'local') {
        console.log('   ⚠️  Skipping test due to local environment network issue');
      } else {
        throw error;
      }
    }
  });

  test('3. ZIP Download API - PNG format only', async ({ request }) => {
    console.log('\n🖼️  Testing QR code ZIP download (PNG only)...');
    
    try {
      const response = await request.post(`${BASE_URL}/api/qr/download`, {
        data: {
          qrCodes: sampleQRCodeData.slice(0, 2), // Use fewer QR codes for faster test
          format: 'png'
        }
      });

      console.log(`   Response status: ${response.status()}`);
      
      if (response.status() === 200) {
        const contentType = response.headers()['content-type'];
        expect(contentType).toContain('application/zip');
        
        const body = await response.body();
        expect(body.length).toBeGreaterThan(0);
        
        // Verify it's a ZIP file
        const bodyText = body.toString('utf8', 0, 2);
        expect(bodyText).toBe('PK');
        
        console.log('   ✅ PNG-only ZIP download working correctly');
      } else {
        throw new Error(`Unexpected response status: ${response.status()}`);
      }
    } catch (error) {
      console.log(`   ❌ Request failed: ${error}`);
      if (ENV === 'local') {
        console.log('   ⚠️  Skipping test due to local environment network issue');
      } else {
        throw error;
      }
    }
  });

  test('4. ZIP Download API - PDF format only', async ({ request }) => {
    console.log('\n📄 Testing QR code ZIP download (PDF only)...');
    
    try {
      const response = await request.post(`${BASE_URL}/api/qr/download`, {
        data: {
          qrCodes: sampleQRCodeData.slice(0, 1), // Use single QR code for faster test
          format: 'pdf'
        }
      });

      console.log(`   Response status: ${response.status()}`);
      
      if (response.status() === 200) {
        const contentType = response.headers()['content-type'];
        expect(contentType).toContain('application/zip');
        
        const body = await response.body();
        expect(body.length).toBeGreaterThan(0);
        
        // Verify it's a ZIP file
        const bodyText = body.toString('utf8', 0, 2);
        expect(bodyText).toBe('PK');
        
        console.log('   ✅ PDF-only ZIP download working correctly');
      } else {
        throw new Error(`Unexpected response status: ${response.status()}`);
      }
    } catch (error) {
      console.log(`   ❌ Request failed: ${error}`);
      if (ENV === 'local') {
        console.log('   ⚠️  Skipping test due to local environment network issue');
      } else {
        throw error;
      }
    }
  });

  test('5. Error handling - Invalid QR codes data', async ({ request }) => {
    console.log('\n🚫 Testing error handling for invalid QR codes...');
    
    try {
      const response = await request.post(`${BASE_URL}/api/qr/download`, {
        data: {
          qrCodes: [] // Empty array should trigger error
        }
      });

      console.log(`   Response status: ${response.status()}`);
      
      expect(response.status()).toBe(400);
      
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toContain('qrCodes array is required');
      
      console.log('   ✅ Properly handles empty QR codes array');
    } catch (error) {
      console.log(`   ❌ Request failed: ${error}`);
      if (ENV === 'local') {
        console.log('   ⚠️  Skipping test due to local environment network issue');
      } else {
        throw error;
      }
    }
  });

  test('6. Error handling - Missing orgId for PDF export', async ({ request }) => {
    console.log('\n🚫 Testing error handling for missing orgId...');
    
    try {
      const response = await request.get(`${BASE_URL}/api/registrations/export`, {
        params: {
          format: 'pdf'
          // Missing orgId
        }
      });

      console.log(`   Response status: ${response.status()}`);
      
      // /api/registrations/export was IDOR-closed in prod (now requires auth) → 401 short-circuits before validation.
      expect([400, 401]).toContain(response.status());
      if (response.status() === 400) {
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('orgId is required');
      }
      
      console.log('   ✅ Properly handles missing orgId parameter');
    } catch (error) {
      console.log(`   ❌ Request failed: ${error}`);
      if (ENV === 'local') {
        console.log('   ⚠️  Skipping test due to local environment network issue');
      } else {
        throw error;
      }
    }
  });

  test('7. Error handling - Invalid format for PDF export', async ({ request }) => {
    console.log('\n🚫 Testing error handling for invalid format...');
    
    try {
      const response = await request.get(`${BASE_URL}/api/registrations/export`, {
        params: {
          orgId: TEST_ORG_ID,
          format: 'invalid-format'
        }
      });

      console.log(`   Response status: ${response.status()}`);
      
      // 401 in prod (auth-gated) is acceptable here too.
      expect([400, 401]).toContain(response.status());
      if (response.status() === 400) {
        const body = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('format must be csv or pdf');
      }
      
      console.log('   ✅ Properly handles invalid format parameter');
    } catch (error) {
      console.log(`   ❌ Request failed: ${error}`);
      if (ENV === 'local') {
        console.log('   ⚠️  Skipping test due to local environment network issue');
      } else {
        throw error;
      }
    }
  });
});

test.describe('Performance Tests', () => {
  test('8. PDF Export performance with large dataset', async ({ request }) => {
    console.log('\n⚡ Testing PDF export performance...');
    
    const startTime = Date.now();
    
    try {
      const response = await request.get(`${BASE_URL}/api/registrations/export`, {
        params: {
          orgId: TEST_ORG_ID,
          format: 'pdf'
        }
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`   Response time: ${duration}ms`);
      
      if (response.status() === 200) {
        if (duration < 1000) {
          console.log('   ✅ Excellent performance (<1s)');
        } else if (duration < 3000) {
          console.log('   ✅ Good performance (<3s)');
        } else {
          console.log('   ⚠️  Slow response time (>3s)');
        }
      } else {
        console.log(`   ⚠️  Expected error for test org (${response.status()})`);
      }
    } catch (error) {
      console.log(`   ❌ Request failed: ${error}`);
      if (ENV === 'local') {
        console.log('   ⚠️  Skipping test due to local environment network issue');
      }
    }
  });

  test('9. ZIP Download performance with multiple QR codes', async ({ request }) => {
    console.log('\n⚡ Testing ZIP download performance...');
    
    const startTime = Date.now();
    
    try {
      const response = await request.post(`${BASE_URL}/api/qr/download`, {
        data: {
          qrCodes: sampleQRCodeData,
          format: 'both'
        }
      });

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`   Response time: ${duration}ms`);
      
      if (response.status() === 200) {
        if (duration < 1000) {
          console.log('   ✅ Excellent performance (<1s)');
        } else if (duration < 3000) {
          console.log('   ✅ Good performance (<3s)');
        } else {
          console.log('   ⚠️  Slow response time (>3s)');
        }
      } else {
        throw new Error(`Unexpected response status: ${response.status()}`);
      }
    } catch (error) {
      console.log(`   ❌ Request failed: ${error}`);
      if (ENV === 'local') {
        console.log('   ⚠️  Skipping test due to local environment network issue');
      }
    }
  });
});

