// TDD: Organization Repository Tests
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OrganizationRepository } from '../../../implementations/repositories/OrganizationRepository';
import type { IOrganizationRepository, CreateOrganizationData } from '../../../interfaces/database/IOrganizationRepository';

// Mock database for testing
const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  execute: vi.fn(),
};

// Mock Drizzle ORM
vi.mock('../../../database/connection', () => ({
  getDatabase: () => mockDb,
}));

describe('OrganizationRepository (TDD)', () => {
  let repository: IOrganizationRepository;
  let testOrganization: CreateOrganizationData;

  beforeEach(() => {
    repository = new OrganizationRepository();
    testOrganization = {
      name: 'Test Organization',
      eventName: 'Test Event',
      customDomain: 'test.blessbox.app',
      contactEmail: 'test@example.com',
      contactPhone: '+1234567890',
      contactAddress: '123 Test St',
      contactCity: 'Test City',
      contactState: 'TS',
      contactZip: '12345',
    };

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('create()', () => {
    it('should create a new organization', async () => {
      // Arrange
      const expectedOrganization = {
        id: 'test-uuid',
        ...testOrganization,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([expectedOrganization]),
        }),
      });

      // Act
      const result = await repository.create(testOrganization);

      // Assert
      expect(result).toEqual(expectedOrganization);
      expect(mockDb.insert).toHaveBeenCalledTimes(1);
    });

    it('should throw error for duplicate email', async () => {
      // Arrange
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockRejectedValue(new Error('duplicate key value violates unique constraint')),
        }),
      });

      // Act & Assert
      await expect(repository.create(testOrganization)).rejects.toThrow();
    });
  });

  describe('findById()', () => {
    it('should find organization by ID', async () => {
      // Arrange
      const expectedOrganization = {
        id: 'test-uuid',
        ...testOrganization,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([expectedOrganization]),
          }),
        }),
      });

      // Act
      const result = await repository.findById('test-uuid');

      // Assert
      expect(result).toEqual(expectedOrganization);
    });

    it('should return null for non-existent ID', async () => {
      // Arrange
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      // Act
      const result = await repository.findById('non-existent');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByEmail()', () => {
    it('should find organization by email', async () => {
      // Arrange
      const expectedOrganization = {
        id: 'test-uuid',
        ...testOrganization,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([expectedOrganization]),
          }),
        }),
      });

      // Act
      const result = await repository.findByEmail('test@example.com');

      // Assert
      expect(result).toEqual(expectedOrganization);
    });
  });

  describe('markEmailVerified()', () => {
    it('should mark email as verified', async () => {
      // Arrange
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      // Act
      await repository.markEmailVerified('test-uuid');

      // Assert
      expect(mockDb.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('update()', () => {
    it('should update organization data', async () => {
      // Arrange
      const updateData = { name: 'Updated Organization' };
      const expectedOrganization = {
        id: 'test-uuid',
        ...testOrganization,
        ...updateData,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([expectedOrganization]),
          }),
        }),
      });

      // Act
      const result = await repository.update('test-uuid', updateData);

      // Assert
      expect(result).toEqual(expectedOrganization);
    });
  });

  describe('Interface Segregation Principle', () => {
    it('should only expose organization-specific methods', () => {
      // Assert that the repository only has organization-related methods
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(repository));
      const expectedMethods = [
        'constructor',
        'create',
        'findById',
        'findByEmail',
        'findByDomain',
        'update',
        'markEmailVerified',
        'delete',
        'findAll',
        'count',
      ];

      expectedMethods.forEach(method => {
        expect(methods).toContain(method);
      });

      // Should not have QR code or registration methods
      expect(methods).not.toContain('findByQRCodeSetId');
      expect(methods).not.toContain('createRegistration');
    });
  });
});