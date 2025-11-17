// Simple Registration API Tests - Focus on API behavior
import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the entire module
vi.mock('@/lib/services/RegistrationService', () => ({
  RegistrationService: vi.fn().mockImplementation(() => ({
    submitRegistration: vi.fn().mockResolvedValue({
      id: 'reg-123',
      qrCodeSetId: 'qr-set-123',
      qrCodeId: 'qr-123',
      registrationData: '{"name":"John Doe","email":"john@example.com"}',
      deliveryStatus: 'pending',
      registeredAt: '2025-01-01T00:00:00Z'
    }),
    listRegistrations: vi.fn().mockResolvedValue([
      {
        id: 'reg-1',
        qrCodeSetId: 'qr-set-1',
        qrCodeId: 'qr-1',
        registrationData: '{"name":"John Doe","email":"john@example.com"}',
        deliveryStatus: 'pending',
        registeredAt: '2025-01-01T00:00:00Z'
      }
    ])
  }))
}));

// Mock the OData parser
vi.mock('@/lib/utils/odataParser', () => ({
  parseODataQuery: vi.fn(() => ({
    filter: [],
    orderBy: [],
    top: undefined,
    skip: undefined,
    count: false
  }))
}));

describe('Registration API - Simple Tests', () => {
  it('should handle POST request with valid data', async () => {
    // Import after mocking
    const { POST } = await import('../../../app/api/registrations/route');
    
    const request = new NextRequest('http://localhost:3000/api/registrations', {
      method: 'POST',
      body: JSON.stringify({
        orgSlug: 'test-org',
        qrLabel: 'test-qr',
        formData: {
          name: 'John Doe',
          email: 'john@example.com'
        }
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.registration).toBeDefined();
    expect(data.message).toBe('Registration submitted successfully');
  });

  it('should handle POST request with missing orgSlug', async () => {
    const { POST } = await import('../../../app/api/registrations/route');
    
    const request = new NextRequest('http://localhost:3000/api/registrations', {
      method: 'POST',
      body: JSON.stringify({
        qrLabel: 'test-qr',
        formData: { name: 'John Doe' }
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Missing required fields');
  });

  it('should handle GET request with organizationId', async () => {
    const { GET } = await import('../../../app/api/registrations/route');
    
    const request = new NextRequest('http://localhost:3000/api/registrations?organizationId=org-123');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.count).toBeDefined();
  });

  it('should handle GET request without organizationId', async () => {
    const { GET } = await import('../../../app/api/registrations/route');
    
    const request = new NextRequest('http://localhost:3000/api/registrations');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain('organizationId query parameter is required');
  });

  it('should handle invalid JSON in POST request', async () => {
    const { POST } = await import('../../../app/api/registrations/route');
    
    const request = new NextRequest('http://localhost:3000/api/registrations', {
      method: 'POST',
      body: 'invalid json'
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
