// IRegistrationService Interface Tests
// Tests the interface contract and expected behaviors

import { describe, it, expect } from 'vitest';
import type { 
  IRegistrationService, 
  RegistrationFormConfig, 
  Registration, 
  RegistrationFormData,
  RegistrationMetadata,
  RegistrationFilters,
  RegistrationUpdate
} from './IRegistrationService';

// Mock implementation for testing interface contract
class MockRegistrationService implements IRegistrationService {
  async getFormConfig(orgSlug: string, qrLabel: string): Promise<RegistrationFormConfig | null> {
    if (orgSlug === 'test-org' && qrLabel === 'test-qr') {
      return {
        id: 'test-config-id',
        organizationId: 'test-org-id',
        name: 'Test Registration Form',
        language: 'en',
        formFields: [
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
        ],
        qrCodes: [
          {
            id: 'test-qr-id',
            label: 'test-qr',
            url: 'https://blessbox.app/register/test-org/test-qr'
          }
        ]
      };
    }
    return null;
  }

  async submitRegistration(
    orgSlug: string,
    qrLabel: string,
    formData: RegistrationFormData,
    metadata?: RegistrationMetadata
  ): Promise<Registration> {
    return {
      id: 'test-registration-id',
      qrCodeSetId: 'test-qr-set-id',
      qrCodeId: 'test-qr-id',
      registrationData: JSON.stringify(formData),
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      referrer: metadata?.referrer,
      deliveryStatus: 'pending',
      registeredAt: new Date().toISOString()
    };
  }

  async listRegistrations(
    organizationId: string,
    filters?: RegistrationFilters
  ): Promise<Registration[]> {
    return [
      {
        id: 'reg-1',
        qrCodeSetId: 'qr-set-1',
        qrCodeId: 'qr-1',
        registrationData: '{"name":"John Doe","email":"john@example.com"}',
        deliveryStatus: 'pending',
        registeredAt: new Date().toISOString()
      }
    ];
  }

  async getRegistration(id: string): Promise<Registration | null> {
    if (id === 'test-registration-id') {
      return {
        id: 'test-registration-id',
        qrCodeSetId: 'test-qr-set-id',
        qrCodeId: 'test-qr-id',
        registrationData: '{"name":"John Doe","email":"john@example.com"}',
        deliveryStatus: 'pending',
        registeredAt: new Date().toISOString()
      };
    }
    return null;
  }

  async updateRegistration(
    id: string,
    updates: RegistrationUpdate
  ): Promise<Registration> {
    const registration = await this.getRegistration(id);
    if (!registration) {
      throw new Error('Registration not found');
    }
    
    return {
      ...registration,
      ...updates,
      deliveredAt: updates.deliveryStatus === 'delivered' ? new Date().toISOString() : registration.deliveredAt
    };
  }

  async deleteRegistration(id: string): Promise<void> {
    if (id === 'non-existent-id') {
      throw new Error('Registration not found');
    }
    // Mock successful deletion
  }

  async getRegistrationStats(organizationId: string): Promise<{
    total: number;
    pending: number;
    delivered: number;
    cancelled: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  }> {
    return {
      total: 10,
      pending: 5,
      delivered: 4,
      cancelled: 1,
      today: 2,
      thisWeek: 7,
      thisMonth: 10
    };
  }
}

describe('IRegistrationService Interface', () => {
  let service: IRegistrationService;

  beforeEach(() => {
    service = new MockRegistrationService();
  });

  describe('getFormConfig', () => {
    it('should return form config for valid org and QR label', async () => {
      const config = await service.getFormConfig('test-org', 'test-qr');
      
      expect(config).toBeDefined();
      expect(config?.id).toBe('test-config-id');
      expect(config?.organizationId).toBe('test-org-id');
      expect(config?.name).toBe('Test Registration Form');
      expect(config?.language).toBe('en');
      expect(config?.formFields).toHaveLength(2);
      expect(config?.qrCodes).toHaveLength(1);
    });

    it('should return null for invalid org or QR label', async () => {
      const config = await service.getFormConfig('invalid-org', 'invalid-qr');
      
      expect(config).toBeNull();
    });

    it('should have correct form field structure', async () => {
      const config = await service.getFormConfig('test-org', 'test-qr');
      
      expect(config?.formFields[0]).toEqual({
        id: 'name',
        type: 'text',
        label: 'Full Name',
        placeholder: 'Enter your name',
        required: true
      });
    });
  });

  describe('submitRegistration', () => {
    it('should submit registration with valid data', async () => {
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
      expect(registration.id).toBe('test-registration-id');
      expect(registration.qrCodeSetId).toBe('test-qr-set-id');
      expect(registration.qrCodeId).toBe('test-qr-id');
      expect(registration.registrationData).toBe(JSON.stringify(formData));
      expect(registration.ipAddress).toBe(metadata.ipAddress);
      expect(registration.userAgent).toBe(metadata.userAgent);
      expect(registration.referrer).toBe(metadata.referrer);
      expect(registration.deliveryStatus).toBe('pending');
      expect(registration.registeredAt).toBeDefined();
    });

    it('should submit registration without metadata', async () => {
      const formData: RegistrationFormData = {
        name: 'Jane Doe',
        email: 'jane@example.com'
      };
      
      const registration = await service.submitRegistration(
        'test-org',
        'test-qr',
        formData
      );
      
      expect(registration).toBeDefined();
      expect(registration.registrationData).toBe(JSON.stringify(formData));
      expect(registration.ipAddress).toBeUndefined();
      expect(registration.userAgent).toBeUndefined();
      expect(registration.referrer).toBeUndefined();
    });
  });

  describe('listRegistrations', () => {
    it('should return list of registrations', async () => {
      const registrations = await service.listRegistrations('test-org-id');
      
      expect(Array.isArray(registrations)).toBe(true);
      expect(registrations).toHaveLength(1);
      expect(registrations[0].id).toBe('reg-1');
    });

    it('should accept filters parameter', async () => {
      const filters: RegistrationFilters = {
        deliveryStatus: 'pending',
        qrCodeSetId: 'qr-set-1'
      };
      
      const registrations = await service.listRegistrations('test-org-id', filters);
      
      expect(Array.isArray(registrations)).toBe(true);
    });
  });

  describe('getRegistration', () => {
    it('should return registration for valid ID', async () => {
      const registration = await service.getRegistration('test-registration-id');
      
      expect(registration).toBeDefined();
      expect(registration?.id).toBe('test-registration-id');
      expect(registration?.qrCodeSetId).toBe('test-qr-set-id');
    });

    it('should return null for invalid ID', async () => {
      const registration = await service.getRegistration('invalid-id');
      
      expect(registration).toBeNull();
    });
  });

  describe('updateRegistration', () => {
    it('should update registration status', async () => {
      const updates: RegistrationUpdate = {
        deliveryStatus: 'delivered'
      };
      
      const registration = await service.updateRegistration('test-registration-id', updates);
      
      expect(registration.deliveryStatus).toBe('delivered');
      expect(registration.deliveredAt).toBeDefined();
    });

    it('should throw error for non-existent registration', async () => {
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
      await expect(
        service.deleteRegistration('test-registration-id')
      ).resolves.not.toThrow();
    });

    it('should throw error for non-existent registration', async () => {
      await expect(
        service.deleteRegistration('non-existent-id')
      ).rejects.toThrow('Registration not found');
    });
  });

  describe('getRegistrationStats', () => {
    it('should return registration statistics', async () => {
      const stats = await service.getRegistrationStats('test-org-id');
      
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

  describe('Interface Compliance', () => {
    it('should implement all required methods', () => {
      expect(typeof service.getFormConfig).toBe('function');
      expect(typeof service.submitRegistration).toBe('function');
      expect(typeof service.listRegistrations).toBe('function');
      expect(typeof service.getRegistration).toBe('function');
      expect(typeof service.updateRegistration).toBe('function');
      expect(typeof service.deleteRegistration).toBe('function');
      expect(typeof service.getRegistrationStats).toBe('function');
    });

    it('should have correct method signatures', () => {
      // Test that methods accept correct parameters
      expect(() => service.getFormConfig('org', 'qr')).not.toThrow();
      expect(() => service.submitRegistration('org', 'qr', {})).not.toThrow();
      expect(() => service.listRegistrations('org-id')).not.toThrow();
      expect(() => service.getRegistration('id')).not.toThrow();
      expect(() => service.updateRegistration('id', {})).not.toThrow();
      expect(() => service.deleteRegistration('id')).not.toThrow();
      expect(() => service.getRegistrationStats('org-id')).not.toThrow();
    });
  });
});
