// Registration API Tests
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '../../../app/api/registrations/route';

// Mock the RegistrationService
vi.mock('@/lib/services/RegistrationService', () => ({
  RegistrationService: vi.fn().mockImplementation(() => ({
    submitRegistration: vi.fn(),
    listRegistrations: vi.fn()
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

describe('Registration API', () => {
  let mockRegistrationService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRegistrationService = {
      submitRegistration: vi.fn(),
      listRegistrations: vi.fn()
    };
    
    // Reset the mock implementation
    const { RegistrationService } = require('@/lib/services/RegistrationService');
    RegistrationService.mockImplementation(() => mockRegistrationService);
  });

  describe('POST /api/registrations', () => {
    it('should submit registration with valid data', async () => {
      const mockRegistration = {
        id: 'reg-123',
        qrCodeSetId: 'qr-set-123',
        qrCodeId: 'qr-123',
        registrationData: '{"name":"John Doe","email":"john@example.com"}',
        deliveryStatus: 'pending',
        registeredAt: '2025-01-01T00:00:00Z'
      };

      mockRegistrationService.submitRegistration.mockResolvedValue(mockRegistration);

      const request = new NextRequest('http://localhost:3000/api/registrations', {
        method: 'POST',
        body: JSON.stringify({
          orgSlug: 'test-org',
          qrLabel: 'test-qr',
          formData: {
            name: 'John Doe',
            email: 'john@example.com'
          },
          metadata: {
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0...'
          }
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.registration).toEqual(mockRegistration);
      expect(data.message).toBe('Registration submitted successfully');
      expect(mockRegistrationService.submitRegistration).toHaveBeenCalledWith(
        'test-org',
        'test-qr',
        { name: 'John Doe', email: 'john@example.com' },
        { ipAddress: '192.168.1.1', userAgent: 'Mozilla/5.0...' }
      );
    });

    it('should submit registration without metadata', async () => {
      const mockRegistration = {
        id: 'reg-123',
        qrCodeSetId: 'qr-set-123',
        qrCodeId: 'qr-123',
        registrationData: '{"name":"John Doe","email":"john@example.com"}',
        deliveryStatus: 'pending',
        registeredAt: '2025-01-01T00:00:00Z'
      };

      mockRegistrationService.submitRegistration.mockResolvedValue(mockRegistration);

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
      expect(mockRegistrationService.submitRegistration).toHaveBeenCalledWith(
        'test-org',
        'test-qr',
        { name: 'John Doe', email: 'john@example.com' },
        undefined
      );
    });

    it('should return 400 for missing orgSlug', async () => {
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

    it('should return 400 for missing qrLabel', async () => {
      const request = new NextRequest('http://localhost:3000/api/registrations', {
        method: 'POST',
        body: JSON.stringify({
          orgSlug: 'test-org',
          formData: { name: 'John Doe' }
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required fields');
    });

    it('should return 400 for missing formData', async () => {
      const request = new NextRequest('http://localhost:3000/api/registrations', {
        method: 'POST',
        body: JSON.stringify({
          orgSlug: 'test-org',
          qrLabel: 'test-qr'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required fields');
    });

    it('should return 400 for invalid formData type', async () => {
      const request = new NextRequest('http://localhost:3000/api/registrations', {
        method: 'POST',
        body: JSON.stringify({
          orgSlug: 'test-org',
          qrLabel: 'test-qr',
          formData: 'invalid-string'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('formData must be an object');
    });

    it('should return 404 for form configuration not found', async () => {
      mockRegistrationService.submitRegistration.mockRejectedValue(
        new Error('Form configuration not found')
      );

      const request = new NextRequest('http://localhost:3000/api/registrations', {
        method: 'POST',
        body: JSON.stringify({
          orgSlug: 'invalid-org',
          qrLabel: 'invalid-qr',
          formData: { name: 'John Doe' }
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Registration form not found');
    });

    it('should return 400 for missing required fields', async () => {
      mockRegistrationService.submitRegistration.mockRejectedValue(
        new Error('Missing required field: email')
      );

      const request = new NextRequest('http://localhost:3000/api/registrations', {
        method: 'POST',
        body: JSON.stringify({
          orgSlug: 'test-org',
          qrLabel: 'test-qr',
          formData: { name: 'John Doe' }
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required field: email');
    });

    it('should return 500 for unexpected errors', async () => {
      mockRegistrationService.submitRegistration.mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest('http://localhost:3000/api/registrations', {
        method: 'POST',
        body: JSON.stringify({
          orgSlug: 'test-org',
          qrLabel: 'test-qr',
          formData: { name: 'John Doe', email: 'john@example.com' }
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('GET /api/registrations', () => {
    it('should return list of registrations', async () => {
      const mockRegistrations = [
        {
          id: 'reg-1',
          qrCodeSetId: 'qr-set-1',
          qrCodeId: 'qr-1',
          registrationData: '{"name":"John Doe","email":"john@example.com"}',
          deliveryStatus: 'pending',
          registeredAt: '2025-01-01T00:00:00Z'
        },
        {
          id: 'reg-2',
          qrCodeSetId: 'qr-set-1',
          qrCodeId: 'qr-2',
          registrationData: '{"name":"Jane Doe","email":"jane@example.com"}',
          deliveryStatus: 'delivered',
          registeredAt: '2025-01-01T01:00:00Z'
        }
      ];

      mockRegistrationService.listRegistrations.mockResolvedValue(mockRegistrations);

      const request = new NextRequest('http://localhost:3000/api/registrations?organizationId=org-123');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockRegistrations);
      expect(data.count).toBe(2);
      expect(mockRegistrationService.listRegistrations).toHaveBeenCalledWith('org-123', {});
    });

    it('should return 400 for missing organizationId', async () => {
      const request = new NextRequest('http://localhost:3000/api/registrations');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('organizationId query parameter is required');
    });

    it('should apply filters from OData query', async () => {
      const { parseODataQuery } = require('@/lib/utils/odataParser');
      parseODataQuery.mockReturnValue({
        filter: [
          { field: 'deliveryStatus', operator: 'eq', value: 'pending' }
        ],
        orderBy: [],
        top: undefined,
        skip: undefined,
        count: false
      });

      const mockRegistrations = [
        {
          id: 'reg-1',
          qrCodeSetId: 'qr-set-1',
          qrCodeId: 'qr-1',
          registrationData: '{"name":"John Doe","email":"john@example.com"}',
          deliveryStatus: 'pending',
          registeredAt: '2025-01-01T00:00:00Z'
        }
      ];

      mockRegistrationService.listRegistrations.mockResolvedValue(mockRegistrations);

      const request = new NextRequest('http://localhost:3000/api/registrations?organizationId=org-123&$filter=deliveryStatus eq \'pending\'');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockRegistrationService.listRegistrations).toHaveBeenCalledWith('org-123', {
        deliveryStatus: 'pending'
      });
    });

    it('should return 500 for unexpected errors', async () => {
      mockRegistrationService.listRegistrations.mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new NextRequest('http://localhost:3000/api/registrations?organizationId=org-123');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });
  });
});
