// RegistrationService Tests - TDD Approach
// Tests the actual implementation against the interface

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RegistrationService } from './RegistrationService';
import type { 
  RegistrationFormConfig, 
  Registration, 
  RegistrationFormData,
  RegistrationMetadata,
  RegistrationFilters,
  RegistrationUpdate
} from '../interfaces/IRegistrationService';

// Mock the database client
vi.mock('../db', () => ({
  getDbClient: () => ({
    execute: vi.fn()
  })
}));

describe('RegistrationService', () => {
  let service: RegistrationService;
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RegistrationService();
    mockDb = (service as any).db;
  });

  describe('getFormConfig', () => {
    it('should return form config for valid org and QR label', async () => {
      // Mock organization lookup
      mockDb.execute
        .mockResolvedValueOnce({
          rows: [{
            id: 'org-123',
            name: 'Test Organization',
            custom_domain: 'test-org'
          }]
        })
        // Mock QR code set lookup
        .mockResolvedValueOnce({
          rows: [{
            id: 'qr-set-123',
            organization_id: 'org-123',
            name: 'Test Registration Form',
            language: 'en',
            form_fields: JSON.stringify([
              {
                id: 'name',
                type: 'text',
                label: 'Full Name',
                placeholder: 'Enter your name',
                required: true
              },
              {
                id: 'email',
                type: 'email',
                label: 'Email Address',
                placeholder: 'Enter your email',
                required: true
              }
            ]),
            qr_codes: JSON.stringify([
              {
                id: 'qr-123',
                label: 'test-qr',
                url: 'https://blessbox.app/register/test-org/test-qr',
                dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
              }
            ])
          }]
        });

      const config = await service.getFormConfig('test-org', 'test-qr');

      expect(config).toBeDefined();
      expect(config?.id).toBe('qr-set-123');
      expect(config?.organizationId).toBe('org-123');
      expect(config?.name).toBe('Test Registration Form');
      expect(config?.language).toBe('en');
      expect(config?.formFields).toHaveLength(2);
      expect(config?.qrCodes).toHaveLength(1);
      expect(config?.qrCodes[0].label).toBe('test-qr');
    });

    it('should return null for invalid organization', async () => {
      mockDb.execute.mockResolvedValueOnce({ rows: [] });

      const config = await service.getFormConfig('invalid-org', 'test-qr');

      expect(config).toBeNull();
    });

    it('should return null for invalid QR label', async () => {
      mockDb.execute
        .mockResolvedValueOnce({
          rows: [{
            id: 'org-123',
            name: 'Test Organization',
            custom_domain: 'test-org'
          }]
        })
        .mockResolvedValueOnce({
          rows: [{
            id: 'qr-set-123',
            organization_id: 'org-123',
            name: 'Test Registration Form',
            language: 'en',
            form_fields: JSON.stringify([]),
            qr_codes: JSON.stringify([
              {
                id: 'qr-123',
                label: 'different-qr',
                url: 'https://blessbox.app/register/test-org/different-qr'
              }
            ])
          }]
        });

      const config = await service.getFormConfig('test-org', 'invalid-qr');

      expect(config).toBeNull();
    });
  });

  describe('submitRegistration', () => {
    it('should submit registration with valid data', async () => {
      // Mock form config lookup
      mockDb.execute
        .mockResolvedValueOnce({
          rows: [{
            id: 'org-123',
            name: 'Test Organization',
            custom_domain: 'test-org'
          }]
        })
        .mockResolvedValueOnce({
          rows: [{
            id: 'qr-set-123',
            organization_id: 'org-123',
            name: 'Test Registration Form',
            language: 'en',
            form_fields: JSON.stringify([
              {
                id: 'name',
                type: 'text',
                label: 'Full Name',
                required: true
              },
              {
                id: 'email',
                type: 'email',
                label: 'Email Address',
                required: true
              }
            ]),
            qr_codes: JSON.stringify([
              {
                id: 'qr-123',
                label: 'test-qr',
                url: 'https://blessbox.app/register/test-org/test-qr'
              }
            ])
          }]
        })
        // Mock registration insertion
        .mockResolvedValueOnce({ rows: [] });

      const formData: RegistrationFormData = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      const metadata: RegistrationMetadata = {
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        referrer: 'https://example.com'
      };

      const registration = await service.submitRegistration(
        'test-org',
        'test-qr',
        formData,
        metadata
      );

      expect(registration).toBeDefined();
      expect(registration.id).toBeDefined();
      expect(registration.qrCodeSetId).toBe('qr-set-123');
      expect(registration.qrCodeId).toBe('qr-123');
      expect(registration.registrationData).toBe(JSON.stringify(formData));
      expect(registration.ipAddress).toBe(metadata.ipAddress);
      expect(registration.userAgent).toBe(metadata.userAgent);
      expect(registration.referrer).toBe(metadata.referrer);
      expect(registration.deliveryStatus).toBe('pending');
      expect(registration.registeredAt).toBeDefined();

      // Verify database insert was called
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          sql: expect.stringContaining('INSERT INTO registrations'),
          args: expect.arrayContaining([
            expect.any(String), // id
            'qr-set-123', // qrCodeSetId
            'qr-123', // qrCodeId
            JSON.stringify(formData), // registrationData
            metadata.ipAddress,
            metadata.userAgent,
            metadata.referrer
          ])
        })
      );
    });

    it('should throw error for missing required fields', async () => {
      // Mock form config lookup
      mockDb.execute
        .mockResolvedValueOnce({
          rows: [{
            id: 'org-123',
            name: 'Test Organization',
            custom_domain: 'test-org'
          }]
        })
        .mockResolvedValueOnce({
          rows: [{
            id: 'qr-set-123',
            organization_id: 'org-123',
            name: 'Test Registration Form',
            language: 'en',
            form_fields: JSON.stringify([
              {
                id: 'name',
                type: 'text',
                label: 'Full Name',
                required: true
              },
              {
                id: 'email',
                type: 'email',
                label: 'Email Address',
                required: true
              }
            ]),
            qr_codes: JSON.stringify([
              {
                id: 'qr-123',
                label: 'test-qr',
                url: 'https://blessbox.app/register/test-org/test-qr'
              }
            ])
          }]
        });

      const formData: RegistrationFormData = {
        name: 'John Doe'
        // Missing required email field
      };

      await expect(
        service.submitRegistration('test-org', 'test-qr', formData)
      ).rejects.toThrow('Missing required field: email');
    });

    it('should throw error for invalid org/QR combination', async () => {
      mockDb.execute.mockResolvedValueOnce({ rows: [] });

      const formData: RegistrationFormData = {
        name: 'John Doe',
        email: 'john@example.com'
      };

      await expect(
        service.submitRegistration('invalid-org', 'invalid-qr', formData)
      ).rejects.toThrow('Form configuration not found');
    });
  });

  describe('listRegistrations', () => {
    it('should return list of registrations without filters', async () => {
      mockDb.execute.mockResolvedValueOnce({
        rows: [
          {
            id: 'reg-1',
            qr_code_set_id: 'qr-set-1',
            qr_code_id: 'qr-1',
            registration_data: '{"name":"John Doe","email":"john@example.com"}',
            ip_address: '192.168.1.1',
            user_agent: 'Mozilla/5.0...',
            referrer: 'https://example.com',
            delivery_status: 'pending',
            delivered_at: null,
            registered_at: '2025-01-01T00:00:00Z'
          },
          {
            id: 'reg-2',
            qr_code_set_id: 'qr-set-1',
            qr_code_id: 'qr-2',
            registration_data: '{"name":"Jane Doe","email":"jane@example.com"}',
            ip_address: '192.168.1.2',
            user_agent: 'Mozilla/5.0...',
            referrer: null,
            delivery_status: 'delivered',
            delivered_at: '2025-01-01T01:00:00Z',
            registered_at: '2025-01-01T00:30:00Z'
          }
        ]
      });

      const registrations = await service.listRegistrations('org-123');

      expect(registrations).toHaveLength(2);
      expect(registrations[0].id).toBe('reg-1');
      expect(registrations[0].deliveryStatus).toBe('pending');
      expect(registrations[1].id).toBe('reg-2');
      expect(registrations[1].deliveryStatus).toBe('delivered');
    });

    it('should apply filters correctly', async () => {
      mockDb.execute.mockResolvedValueOnce({
        rows: [
          {
            id: 'reg-1',
            qr_code_set_id: 'qr-set-1',
            qr_code_id: 'qr-1',
            registration_data: '{"name":"John Doe","email":"john@example.com"}',
            delivery_status: 'pending',
            registered_at: '2025-01-01T00:00:00Z'
          }
        ]
      });

      const filters: RegistrationFilters = {
        deliveryStatus: 'pending',
        qrCodeSetId: 'qr-set-1'
      };

      const registrations = await service.listRegistrations('org-123', filters);

      expect(registrations).toHaveLength(1);
      expect(registrations[0].deliveryStatus).toBe('pending');

      // Verify filter was applied in SQL query
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          sql: expect.stringContaining('delivery_status = ?'),
          args: expect.arrayContaining(['pending'])
        })
      );
    });
  });

  describe('getRegistration', () => {
    it('should return registration for valid ID', async () => {
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          id: 'reg-123',
          qr_code_set_id: 'qr-set-123',
          qr_code_id: 'qr-123',
          registration_data: '{"name":"John Doe","email":"john@example.com"}',
          delivery_status: 'pending',
          registered_at: '2025-01-01T00:00:00Z'
        }]
      });

      const registration = await service.getRegistration('reg-123');

      expect(registration).toBeDefined();
      expect(registration?.id).toBe('reg-123');
      expect(registration?.qrCodeSetId).toBe('qr-set-123');
    });

    it('should return null for invalid ID', async () => {
      mockDb.execute.mockResolvedValueOnce({ rows: [] });

      const registration = await service.getRegistration('invalid-id');

      expect(registration).toBeNull();
    });
  });

  describe('updateRegistration', () => {
    it('should update registration status', async () => {
      // Mock get registration (first call)
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          id: 'reg-123',
          qr_code_set_id: 'qr-set-123',
          qr_code_id: 'qr-123',
          registration_data: '{"name":"John Doe","email":"john@example.com"}',
          delivery_status: 'pending',
          registered_at: '2025-01-01T00:00:00Z'
        }]
      });

      // Mock update
      mockDb.execute.mockResolvedValueOnce({ rows: [] });

      // Mock get registration (second call after update)
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          id: 'reg-123',
          qr_code_set_id: 'qr-set-123',
          qr_code_id: 'qr-123',
          registration_data: '{"name":"John Doe","email":"john@example.com"}',
          delivery_status: 'delivered',
          delivered_at: '2025-01-01T01:00:00Z',
          registered_at: '2025-01-01T00:00:00Z'
        }]
      });

      const updates: RegistrationUpdate = {
        deliveryStatus: 'delivered'
      };

      const registration = await service.updateRegistration('reg-123', updates);

      expect(registration.deliveryStatus).toBe('delivered');
      expect(registration.deliveredAt).toBeDefined();

      // Verify update was called
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          sql: expect.stringContaining('UPDATE registrations'),
          args: expect.arrayContaining(['delivered', expect.any(String), 'reg-123'])
        })
      );
    });

    it('should throw error for non-existent registration', async () => {
      mockDb.execute.mockResolvedValueOnce({ rows: [] });

      const updates: RegistrationUpdate = {
        deliveryStatus: 'delivered'
      };

      await expect(
        service.updateRegistration('non-existent-id', updates)
      ).rejects.toThrow('Registration not found');
    });
  });

  describe('deleteRegistration', () => {
    it('should delete registration successfully', async () => {
      mockDb.execute.mockResolvedValueOnce({ rows: [] });

      await expect(
        service.deleteRegistration('reg-123')
      ).resolves.not.toThrow();

      // Verify delete was called
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          sql: expect.stringContaining('DELETE FROM registrations'),
          args: ['reg-123']
        })
      );
    });
  });

  describe('getRegistrationStats', () => {
    it('should return registration statistics', async () => {
      mockDb.execute
        .mockResolvedValueOnce({ rows: [{ count: 10 }] }) // total
        .mockResolvedValueOnce({ rows: [{ count: 5 }] })  // pending
        .mockResolvedValueOnce({ rows: [{ count: 4 }] })  // delivered
        .mockResolvedValueOnce({ rows: [{ count: 1 }] })  // cancelled
        .mockResolvedValueOnce({ rows: [{ count: 2 }] })  // today
        .mockResolvedValueOnce({ rows: [{ count: 7 }] })  // this week
        .mockResolvedValueOnce({ rows: [{ count: 10 }] }); // this month

      const stats = await service.getRegistrationStats('org-123');

      expect(stats).toEqual({
        total: 10,
        pending: 5,
        delivered: 4,
        cancelled: 1,
        today: 2,
        thisWeek: 7,
        thisMonth: 10
      });
    });
  });
});
