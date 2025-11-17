// OrganizationService Tests - TDD Approach
// Tests the actual implementation against the interface

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrganizationService } from './OrganizationService';
import type { 
  Organization, 
  OrganizationCreate, 
  OrganizationUpdate,
  EmailVerificationResult
} from '../interfaces/IOrganizationService';
import { getDbClient } from '../db';

// Mock the database
vi.mock('../db', () => ({
  getDbClient: vi.fn(),
}));

describe('OrganizationService', () => {
  let service: OrganizationService;
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockDb = {
      execute: vi.fn(),
    };
    
    (getDbClient as any).mockReturnValue(mockDb);
    mockDb.execute.mockResolvedValue({ rows: [] });
    
    service = new OrganizationService();
  });

  describe('createOrganization', () => {
    it('should create organization with valid data', async () => {
      const orgData: OrganizationCreate = {
        name: 'Test Organization',
        eventName: 'Test Event',
        contactEmail: 'test@example.com',
        contactPhone: '555-1234',
        contactAddress: '123 Main St',
        contactCity: 'Anytown',
        contactState: 'CA',
        contactZip: '12345',
      };

      const mockInsert = vi.fn().mockReturnThis();
      const mockValues = vi.fn().mockReturnThis();
      const mockReturning = vi.fn().mockResolvedValue([{
        id: 'org-123',
        name: 'Test Organization',
        event_name: 'Test Event',
        contact_email: 'test@example.com',
        contact_phone: '555-1234',
        contact_address: '123 Main St',
        contact_city: 'Anytown',
        contact_state: 'CA',
        contact_zip: '12345',
        email_verified: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      }]);

      mockDb.insert.mockReturnValue({
        values: mockValues,
        returning: mockReturning,
      });
      mockValues.mockReturnValue({
        returning: mockReturning,
      });

      // Mock email uniqueness check
      const mockSelect = vi.fn().mockReturnThis();
      const mockFrom = vi.fn().mockReturnThis();
      const mockWhere = vi.fn().mockResolvedValue([]);

      mockDb.select.mockReturnValue({
        from: mockFrom,
        where: mockWhere,
      });
      mockFrom.mockReturnValue({
        where: mockWhere,
      });

      const organization = await service.createOrganization(orgData);

      expect(organization).toBeDefined();
      expect(organization.id).toBe('org-123');
      expect(organization.name).toBe('Test Organization');
      expect(organization.contactEmail).toBe('test@example.com');
      expect(organization.emailVerified).toBe(false);
    });

    it('should throw error for duplicate email', async () => {
      const orgData: OrganizationCreate = {
        name: 'Test Organization',
        contactEmail: 'existing@example.com',
      };

      // Mock email uniqueness check - email exists
      const mockSelect = vi.fn().mockReturnThis();
      const mockFrom = vi.fn().mockReturnThis();
      const mockWhere = vi.fn().mockResolvedValue([{
        id: 'existing-org',
        contact_email: 'existing@example.com',
      }]);

      mockDb.select.mockReturnValue({
        from: mockFrom,
        where: mockWhere,
      });
      mockFrom.mockReturnValue({
        where: mockWhere,
      });

      await expect(
        service.createOrganization(orgData)
      ).rejects.toThrow('Organization with this email already exists');
    });

    it('should throw error for invalid email format', async () => {
      const orgData: OrganizationCreate = {
        name: 'Test Organization',
        contactEmail: 'invalid-email',
      };

      await expect(
        service.createOrganization(orgData)
      ).rejects.toThrow();
    });

    it('should throw error for missing required fields', async () => {
      const orgData = {
        name: 'Test Organization',
        // Missing contactEmail
      } as OrganizationCreate;

      await expect(
        service.createOrganization(orgData)
      ).rejects.toThrow();
    });
  });

  describe('getOrganization', () => {
    it('should return organization for valid ID', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockFrom = vi.fn().mockReturnThis();
      const mockWhere = vi.fn().mockResolvedValue([{
        id: 'org-123',
        name: 'Test Organization',
        contact_email: 'test@example.com',
        email_verified: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      }]);

      mockDb.select.mockReturnValue({
        from: mockFrom,
        where: mockWhere,
      });
      mockFrom.mockReturnValue({
        where: mockWhere,
      });

      const organization = await service.getOrganization('org-123');

      expect(organization).toBeDefined();
      expect(organization?.id).toBe('org-123');
      expect(organization?.name).toBe('Test Organization');
    });

    it('should return null for invalid ID', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockFrom = vi.fn().mockReturnThis();
      const mockWhere = vi.fn().mockResolvedValue([]);

      mockDb.select.mockReturnValue({
        from: mockFrom,
        where: mockWhere,
      });
      mockFrom.mockReturnValue({
        where: mockWhere,
      });

      const organization = await service.getOrganization('invalid-id');

      expect(organization).toBeNull();
    });
  });

  describe('getOrganizationByEmail', () => {
    it('should return organization for valid email', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockFrom = vi.fn().mockReturnThis();
      const mockWhere = vi.fn().mockResolvedValue([{
        id: 'org-123',
        name: 'Test Organization',
        contact_email: 'test@example.com',
        email_verified: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      }]);

      mockDb.select.mockReturnValue({
        from: mockFrom,
        where: mockWhere,
      });
      mockFrom.mockReturnValue({
        where: mockWhere,
      });

      const organization = await service.getOrganizationByEmail('test@example.com');

      expect(organization).toBeDefined();
      expect(organization?.contactEmail).toBe('test@example.com');
    });

    it('should return null for non-existent email', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockFrom = vi.fn().mockReturnThis();
      const mockWhere = vi.fn().mockResolvedValue([]);

      mockDb.select.mockReturnValue({
        from: mockFrom,
        where: mockWhere,
      });
      mockFrom.mockReturnValue({
        where: mockWhere,
      });

      const organization = await service.getOrganizationByEmail('nonexistent@example.com');

      expect(organization).toBeNull();
    });
  });

  describe('updateOrganization', () => {
    it('should update organization successfully', async () => {
      // Mock get organization (first call)
      const mockSelect = vi.fn().mockReturnThis();
      const mockFrom = vi.fn().mockReturnThis();
      const mockWhere = vi.fn()
        .mockResolvedValueOnce([{
          id: 'org-123',
          name: 'Test Organization',
          contact_email: 'test@example.com',
          email_verified: false,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        }])
        .mockResolvedValueOnce([{
          id: 'org-123',
          name: 'Updated Organization',
          contact_email: 'test@example.com',
          email_verified: false,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T01:00:00Z',
        }]);

      mockDb.select.mockReturnValue({
        from: mockFrom,
        where: mockWhere,
      });
      mockFrom.mockReturnValue({
        where: mockWhere,
      });

      // Mock update
      const mockUpdate = vi.fn().mockReturnThis();
      const mockSet = vi.fn().mockReturnThis();
      const mockUpdateWhere = vi.fn().mockResolvedValue([]);

      mockDb.update.mockReturnValue({
        set: mockSet,
        where: mockUpdateWhere,
      });
      mockSet.mockReturnValue({
        where: mockUpdateWhere,
      });

      const updates: OrganizationUpdate = {
        name: 'Updated Organization',
        contactPhone: '555-9999',
      };

      const organization = await service.updateOrganization('org-123', updates);

      expect(organization.name).toBe('Updated Organization');
    });

    it('should throw error for non-existent organization', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockFrom = vi.fn().mockReturnThis();
      const mockWhere = vi.fn().mockResolvedValue([]);

      mockDb.select.mockReturnValue({
        from: mockFrom,
        where: mockWhere,
      });
      mockFrom.mockReturnValue({
        where: mockWhere,
      });

      const updates: OrganizationUpdate = {
        name: 'Updated Organization',
      };

      await expect(
        service.updateOrganization('invalid-id', updates)
      ).rejects.toThrow('Organization not found');
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      // Mock get organization
      const mockSelect = vi.fn().mockReturnThis();
      const mockFrom = vi.fn().mockReturnThis();
      const mockWhere = vi.fn()
        .mockResolvedValueOnce([{
          id: 'org-123',
          name: 'Test Organization',
          contact_email: 'test@example.com',
          email_verified: false,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        }])
        .mockResolvedValueOnce([{
          id: 'org-123',
          name: 'Test Organization',
          contact_email: 'test@example.com',
          email_verified: true,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T01:00:00Z',
        }]);

      mockDb.select.mockReturnValue({
        from: mockFrom,
        where: mockWhere,
      });
      mockFrom.mockReturnValue({
        where: mockWhere,
      });

      // Mock update
      const mockUpdate = vi.fn().mockReturnThis();
      const mockSet = vi.fn().mockReturnThis();
      const mockUpdateWhere = vi.fn().mockResolvedValue([]);

      mockDb.update.mockReturnValue({
        set: mockSet,
        where: mockUpdateWhere,
      });
      mockSet.mockReturnValue({
        where: mockUpdateWhere,
      });

      const result = await service.verifyEmail('org-123');

      expect(result.success).toBe(true);
      expect(result.organization).toBeDefined();
      expect(result.organization?.emailVerified).toBe(true);
    });

    it('should return error for non-existent organization', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockFrom = vi.fn().mockReturnThis();
      const mockWhere = vi.fn().mockResolvedValue([]);

      mockDb.select.mockReturnValue({
        from: mockFrom,
        where: mockWhere,
      });
      mockFrom.mockReturnValue({
        where: mockWhere,
      });

      const result = await service.verifyEmail('invalid-id');

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });

  describe('validateOrganizationData', () => {
    it('should validate correct organization data', async () => {
      const orgData: OrganizationCreate = {
        name: 'Test Organization',
        contactEmail: 'test@example.com',
      };

      const result = await service.validateOrganizationData(orgData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should return errors for invalid data', async () => {
      const orgData = {
        name: '',
        contactEmail: 'invalid-email',
      } as OrganizationCreate;

      const result = await service.validateOrganizationData(orgData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });
  });

  describe('checkEmailUniqueness', () => {
    it('should return true for unique email', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockFrom = vi.fn().mockReturnThis();
      const mockWhere = vi.fn().mockResolvedValue([]);

      mockDb.select.mockReturnValue({
        from: mockFrom,
        where: mockWhere,
      });
      mockFrom.mockReturnValue({
        where: mockWhere,
      });

      const isUnique = await service.checkEmailUniqueness('new@example.com');

      expect(isUnique).toBe(true);
    });

    it('should return false for existing email', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockFrom = vi.fn().mockReturnThis();
      const mockWhere = vi.fn().mockResolvedValue([{
        id: 'org-123',
        contact_email: 'existing@example.com',
      }]);

      mockDb.select.mockReturnValue({
        from: mockFrom,
        where: mockWhere,
      });
      mockFrom.mockReturnValue({
        where: mockWhere,
      });

      const isUnique = await service.checkEmailUniqueness('existing@example.com');

      expect(isUnique).toBe(false);
    });

    it('should exclude specified ID when checking uniqueness', async () => {
      const mockSelect = vi.fn().mockReturnThis();
      const mockFrom = vi.fn().mockReturnThis();
      const mockWhere = vi.fn().mockResolvedValue([]);

      mockDb.select.mockReturnValue({
        from: mockFrom,
        where: mockWhere,
      });
      mockFrom.mockReturnValue({
        where: mockWhere,
      });

      const isUnique = await service.checkEmailUniqueness('test@example.com', 'org-123');

      expect(isUnique).toBe(true);
    });
  });
});
