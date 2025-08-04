// TDD: Data Migration Tests
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataMigrationService } from '../../../implementations/migration/DataMigrationService';
import type { 
  IDataMigration, 
  OnboardingSessionData,
  QRCodeSessionData 
} from '../../../interfaces/migration/IDataMigration';

// Mock repositories
const mockOrganizationRepo = {
  create: vi.fn(),
  findByEmail: vi.fn(),
  markEmailVerified: vi.fn(),
};

const mockQRCodeRepo = {
  create: vi.fn(),
  findByOrganizationId: vi.fn(),
};

describe('DataMigrationService (TDD)', () => {
  let migrationService: IDataMigration;
  let sampleSessionData: OnboardingSessionData;
  let sampleQRCodes: QRCodeSessionData[];

  beforeEach(() => {
    migrationService = new DataMigrationService(mockOrganizationRepo, mockQRCodeRepo);
    
    sampleSessionData = {
      organizationName: 'Test Organization',
      eventName: 'Test Event',
      customDomain: 'test.blessbox.app',
      contactEmail: 'test@example.com',
      contactPhone: '+1234567890',
      contactAddress: '123 Test St',
      contactCity: 'Test City',
      contactState: 'TS',
      contactZip: '12345',
      emailVerified: true,
      formLanguage: 'en',
      onboardingComplete: true,
      completedAt: '2025-01-04T20:00:00.000Z',
    };

    sampleQRCodes = [
      {
        id: 'qr-1',
        label: 'Main Entry',
        language: 'en',
        url: 'https://blessbox.app/register/test-org/main-entry',
        dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
        generatedAt: '2025-01-04T20:00:00.000Z',
      },
      {
        id: 'qr-2',
        label: 'VIP Entry',
        language: 'en',
        url: 'https://blessbox.app/register/test-org/vip-entry',
        dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
        generatedAt: '2025-01-04T20:00:00.000Z',
      },
    ];

    // Reset mocks
    vi.clearAllMocks();
  });

  describe('needsMigration()', () => {
    it('should return true for complete onboarding data', () => {
      // Act
      const result = migrationService.needsMigration(sampleSessionData);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for incomplete onboarding data', () => {
      // Arrange
      const incompleteData = { ...sampleSessionData, onboardingComplete: false };

      // Act
      const result = migrationService.needsMigration(incompleteData);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for data without email verification', () => {
      // Arrange
      const unverifiedData = { ...sampleSessionData, emailVerified: false };

      // Act
      const result = migrationService.needsMigration(unverifiedData);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('migrateOnboardingData()', () => {
    it('should create organization and return success', async () => {
      // Arrange
      const mockOrganization = {
        id: 'org-123',
        ...sampleSessionData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOrganizationRepo.findByEmail.mockResolvedValue(null);
      mockOrganizationRepo.create.mockResolvedValue(mockOrganization);

      // Act
      const result = await migrationService.migrateOnboardingData(sampleSessionData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.organizationId).toBe('org-123');
      expect(mockOrganizationRepo.create).toHaveBeenCalledWith({
        name: sampleSessionData.organizationName,
        eventName: sampleSessionData.eventName,
        customDomain: sampleSessionData.customDomain,
        contactEmail: sampleSessionData.contactEmail,
        contactPhone: sampleSessionData.contactPhone,
        contactAddress: sampleSessionData.contactAddress,
        contactCity: sampleSessionData.contactCity,
        contactState: sampleSessionData.contactState,
        contactZip: sampleSessionData.contactZip,
      });
    });

    it('should handle existing organization', async () => {
      // Arrange
      const existingOrg = { id: 'existing-org', ...sampleSessionData };
      mockOrganizationRepo.findByEmail.mockResolvedValue(existingOrg);

      // Act
      const result = await migrationService.migrateOnboardingData(sampleSessionData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.organizationId).toBe('existing-org');
      expect(mockOrganizationRepo.create).not.toHaveBeenCalled();
    });

    it('should mark email as verified if needed', async () => {
      // Arrange
      const unverifiedOrg = { 
        id: 'org-123', 
        ...sampleSessionData, 
        emailVerified: false 
      };
      
      mockOrganizationRepo.findByEmail.mockResolvedValue(unverifiedOrg);

      // Act
      await migrationService.migrateOnboardingData(sampleSessionData);

      // Assert
      expect(mockOrganizationRepo.markEmailVerified).toHaveBeenCalledWith('org-123');
    });

    it('should return error for invalid data', async () => {
      // Arrange
      const invalidData = { ...sampleSessionData, contactEmail: '' };

      // Act
      const result = await migrationService.migrateOnboardingData(invalidData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Contact email is required');
    });
  });

  describe('migrateQRCodeData()', () => {
    it('should create QR code set with codes', async () => {
      // Arrange
      const mockQRCodeSet = {
        id: 'qr-set-123',
        organizationId: 'org-123',
        name: 'Test Event QR Codes',
        language: 'en',
        formFields: [],
        qrCodes: sampleQRCodes,
        isActive: true,
        scanCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockQRCodeRepo.create.mockResolvedValue(mockQRCodeSet);

      // Act
      const result = await migrationService.migrateQRCodeData('org-123', sampleQRCodes);

      // Assert
      expect(result.success).toBe(true);
      expect(result.qrCodeSetId).toBe('qr-set-123');
      expect(mockQRCodeRepo.create).toHaveBeenCalledWith({
        organizationId: 'org-123',
        name: expect.stringContaining('QR Codes'),
        language: 'en',
        formFields: expect.any(Array),
        qrCodes: sampleQRCodes,
      });
    });

    it('should handle empty QR codes', async () => {
      // Act
      const result = await migrationService.migrateQRCodeData('org-123', []);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toContain('No QR codes to migrate');
    });
  });

  describe('getMigrationStatus()', () => {
    it('should return migration status for organization', async () => {
      // Arrange
      const mockOrganization = { id: 'org-123', ...sampleSessionData };
      const mockQRCodeSets = [{ id: 'qr-set-123', qrCodes: sampleQRCodes }];

      mockOrganizationRepo.findByEmail.mockResolvedValue(mockOrganization);
      mockQRCodeRepo.findByOrganizationId.mockResolvedValue(mockQRCodeSets);

      // Act
      const status = await migrationService.getMigrationStatus('org-123');

      // Assert
      expect(status.isMigrated).toBe(true);
      expect(status.organizationId).toBe('org-123');
      expect(status.hasQRCodes).toBe(true);
    });
  });

  describe('Interface Segregation Principle', () => {
    it('should only expose data migration methods', () => {
      // Assert that the service only has migration-related methods
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(migrationService));
      const expectedMethods = [
        'constructor',
        'migrateOnboardingData',
        'migrateQRCodeData',
        'needsMigration',
        'cleanupSessionData',
        'getMigrationStatus',
      ];

      expectedMethods.forEach(method => {
        expect(methods).toContain(method);
      });

      // Should not have authentication or validation methods
      expect(methods).not.toContain('validatePassword');
      expect(methods).not.toContain('generateToken');
      expect(methods).not.toContain('checkLimit');
    });
  });
});