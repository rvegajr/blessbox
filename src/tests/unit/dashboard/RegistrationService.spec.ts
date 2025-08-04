import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RegistrationService } from '../../../implementations/dashboard/RegistrationService';
import { getDatabase, testDatabaseConnection, createDatabaseConnection } from '../../../database/connection';
import { organizations, qrCodeSets, registrations } from '../../../database/schema';
import { eq, and } from 'drizzle-orm';
import type { IRegistrationService, RegistrationFilters, PaginationOptions } from '../../../interfaces/dashboard/IRegistrationService';

/**
 * TDD Tests for Registration Service - Using REAL TURSO Database!
 * Following Interface Segregation Principle
 * 
 * 🚀 These tests use actual TURSO SQLite database connections!
 * No mocks, no fake data - just pure, beautiful EDGE-POWERED reality!
 */

describe('RegistrationService (TDD with Real Database)', () => {
  let registrationService: IRegistrationService;
  let testOrgId: string;
  let testQRCodeSetId: string;
  let testRegistrationIds: string[] = [];
  let db: any;

  beforeEach(async () => {
    registrationService = new RegistrationService();
    
    // Initialize database connection
    createDatabaseConnection();
    db = getDatabase();
    
    // Test database connection first
    const connectionStatus = await testDatabaseConnection();
    if (!connectionStatus.success) {
      throw new Error('Database connection failed - cannot run tests');
    }

    // Create test organization - TURSO STYLE! 🚀
    testOrgId = crypto.randomUUID();
    await db.insert(organizations).values({
      id: testOrgId,
      name: 'Test Dashboard Organization',
      contactEmail: `test-dashboard-${Date.now()}@blessbox.app`,
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create test QR code set - TURSO POWERED! ⚡
    testQRCodeSetId = crypto.randomUUID();
    await db.insert(qrCodeSets).values({
      id: testQRCodeSetId,
      organizationId: testOrgId,
      name: 'Test QR Set',
      formFields: JSON.stringify([
        { name: 'firstName', type: 'text', required: true },
        { name: 'lastName', type: 'text', required: true },
        { name: 'email', type: 'email', required: true },
      ]),
      qrCodes: JSON.stringify([
        { id: 'main-qr', label: 'Main Entry', url: 'https://test.com/main' },
        { id: 'vip-qr', label: 'VIP Entry', url: 'https://test.com/vip' },
      ]),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create test registrations with different statuses - TURSO MAGIC! ✨
    const testRegistrations = [
      {
        id: crypto.randomUUID(),
        qrCodeSetId: testQRCodeSetId,
        qrCodeId: 'main-qr',
        registrationData: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@test.com',
        }),
        deliveryStatus: 'delivered' as const,
        deliveredAt: new Date().toISOString(),
        registeredAt: new Date().toISOString(),
        ipAddress: '192.168.1.1',
      },
      {
        id: crypto.randomUUID(),
        qrCodeSetId: testQRCodeSetId,
        qrCodeId: 'vip-qr',
        registrationData: JSON.stringify({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@test.com',
        }),
        deliveryStatus: 'pending' as const,
        registeredAt: new Date().toISOString(),
        ipAddress: '192.168.1.2',
      },
      {
        id: crypto.randomUUID(),
        qrCodeSetId: testQRCodeSetId,
        qrCodeId: 'main-qr',
        registrationData: JSON.stringify({
          firstName: 'Bob',
          lastName: 'Johnson',
          email: 'bob.johnson@test.com',
        }),
        deliveryStatus: 'failed' as const,
        registeredAt: new Date().toISOString(),
        ipAddress: '192.168.1.3',
      },
    ];

    await db.insert(registrations).values(testRegistrations);
    testRegistrationIds = testRegistrations.map(r => r.id);
  });

  afterEach(async () => {
    // Clean up test data
    if (testRegistrationIds.length > 0) {
      await db.delete(registrations).where(
        eq(registrations.qrCodeSetId, testQRCodeSetId)
      );
    }
    if (testQRCodeSetId) {
      await db.delete(qrCodeSets).where(eq(qrCodeSets.id, testQRCodeSetId));
    }
    if (testOrgId) {
      await db.delete(organizations).where(eq(organizations.id, testOrgId));
    }
    testRegistrationIds = [];
  });

  describe('getRegistrations() - The Heart of the Dashboard! 💖', () => {
    it('should return paginated registrations with default sorting (newest first)', async () => {
      const pagination: PaginationOptions = {
        page: 1,
        limit: 10,
        sortBy: 'registeredAt',
        sortOrder: 'desc',
      };

      const result = await registrationService.getRegistrations(
        testOrgId,
        undefined,
        pagination
      );

      expect(result.registrations).toHaveLength(3);
      expect(result.totalCount).toBe(3);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.hasNextPage).toBe(false);
      expect(result.hasPreviousPage).toBe(false);

      // Verify data structure
      const firstRegistration = result.registrations[0];
      expect(firstRegistration).toHaveProperty('id');
      expect(firstRegistration).toHaveProperty('registrationData');
      expect(firstRegistration).toHaveProperty('deliveryStatus');
      expect(firstRegistration.registrationData.firstName).toBeTruthy();
    });

    it('should filter by delivery status like a BOSS! 🚀', async () => {
      const filters: RegistrationFilters = {
        deliveryStatus: ['delivered'],
      };

      const result = await registrationService.getRegistrations(
        testOrgId,
        filters
      );

      expect(result.registrations).toHaveLength(1);
      expect(result.registrations[0].deliveryStatus).toBe('delivered');
      expect(result.registrations[0].registrationData.firstName).toBe('John');
    });

    it('should filter by multiple delivery statuses beautifully! ✨', async () => {
      const filters: RegistrationFilters = {
        deliveryStatus: ['pending', 'failed'],
      };

      const result = await registrationService.getRegistrations(
        testOrgId,
        filters
      );

      expect(result.registrations).toHaveLength(2);
      const statuses = result.registrations.map(r => r.deliveryStatus);
      expect(statuses).toContain('pending');
      expect(statuses).toContain('failed');
    });

    it('should handle pagination like a champion! 🏆', async () => {
      const pagination: PaginationOptions = {
        page: 1,
        limit: 2,
        sortBy: 'registeredAt',
        sortOrder: 'desc',
      };

      const result = await registrationService.getRegistrations(
        testOrgId,
        undefined,
        pagination
      );

      expect(result.registrations).toHaveLength(2);
      expect(result.totalCount).toBe(3);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(2);
      expect(result.hasNextPage).toBe(true);
      expect(result.hasPreviousPage).toBe(false);
    });

    it('should return empty results for non-existent organization gracefully', async () => {
      const fakeOrgId = '00000000-0000-0000-0000-000000000000';
      
      const result = await registrationService.getRegistrations(fakeOrgId);

      expect(result.registrations).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('getRegistrationById() - Finding Needles in Haystacks! 🔍', () => {
    it('should return registration by ID with all the juicy details', async () => {
      const registrationId = testRegistrationIds[0];
      
      const result = await registrationService.getRegistrationById(registrationId);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(registrationId);
      expect(result!.registrationData.firstName).toBe('John');
      expect(result!.deliveryStatus).toBe('delivered');
      expect(result!.deliveredAt).toBeInstanceOf(Date);
    });

    it('should return null for non-existent registration ID', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      
      const result = await registrationService.getRegistrationById(fakeId);

      expect(result).toBeNull();
    });
  });

  describe('updateDeliveryStatus() - Status Updates Galore! 📦', () => {
    it('should update delivery status from pending to delivered', async () => {
      const pendingRegistrationId = testRegistrationIds[1]; // Jane Smith
      
      const result = await registrationService.updateDeliveryStatus(
        pendingRegistrationId,
        'delivered'
      );

      expect(result).not.toBeNull();
      expect(result!.deliveryStatus).toBe('delivered');
      expect(result!.deliveredAt).toBeInstanceOf(Date);
      
      // Verify in database
      const [updated] = await db.select().from(registrations)
        .where(eq(registrations.id, pendingRegistrationId));
      expect(updated.deliveryStatus).toBe('delivered');
      expect(updated.deliveredAt).toBeInstanceOf(Date);
    });

    it('should update delivery status to failed', async () => {
      const registrationId = testRegistrationIds[1];
      
      const result = await registrationService.updateDeliveryStatus(
        registrationId,
        'failed'
      );

      expect(result).not.toBeNull();
      expect(result!.deliveryStatus).toBe('failed');
    });

    it('should return null for non-existent registration', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      
      const result = await registrationService.updateDeliveryStatus(
        fakeId,
        'delivered'
      );

      expect(result).toBeNull();
    });
  });

  describe('getRegistrationCountByQRCode() - Counting Made Fun! 🔢', () => {
    it('should return correct count for main QR code', async () => {
      const count = await registrationService.getRegistrationCountByQRCode('main-qr');
      
      expect(count).toBe(2); // John and Bob used main-qr
    });

    it('should return correct count for VIP QR code', async () => {
      const count = await registrationService.getRegistrationCountByQRCode('vip-qr');
      
      expect(count).toBe(1); // Only Jane used vip-qr
    });

    it('should return 0 for non-existent QR code', async () => {
      const count = await registrationService.getRegistrationCountByQRCode('non-existent-qr');
      
      expect(count).toBe(0);
    });
  });

  describe('bulkUpdateDeliveryStatus() - Bulk Operations Rock! 💪', () => {
    it('should update multiple registrations at once', async () => {
      const idsToUpdate = [testRegistrationIds[1], testRegistrationIds[2]]; // Jane and Bob
      
      const updatedCount = await registrationService.bulkUpdateDeliveryStatus(
        idsToUpdate,
        'delivered'
      );

      expect(updatedCount).toBe(2);
      
      // Verify in database
      const updated = await db.select().from(registrations)
        .where(eq(registrations.qrCodeSetId, testQRCodeSetId));
      
      const deliveredCount = updated.filter(r => r.deliveryStatus === 'delivered').length;
      expect(deliveredCount).toBe(3); // All should be delivered now
    });

    it('should handle empty array gracefully', async () => {
      const updatedCount = await registrationService.bulkUpdateDeliveryStatus(
        [],
        'delivered'
      );

      expect(updatedCount).toBe(0);
    });
  });

  describe('Interface Segregation Principle Compliance 🏗️', () => {
    it('should only expose registration-specific methods', () => {
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(registrationService));
      const expectedMethods = [
        'constructor',
        'getDb', // Private method for database connection
        'getRegistrations',
        'getRegistrationById',
        'updateDeliveryStatus',
        'getRegistrationCountByQRCode',
        'bulkUpdateDeliveryStatus'
      ];
      
      expect(methods).toEqual(expect.arrayContaining(expectedMethods));
      expect(methods.length).toBe(expectedMethods.length);
    });

    it('should not have search, export, or billing methods', () => {
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(registrationService));
      
      // These methods should NOT exist (they belong to other services)
      expect(methods).not.toContain('searchRegistrations');
      expect(methods).not.toContain('exportRegistrations');
      expect(methods).not.toContain('processPayment');
      expect(methods).not.toContain('generateQRCode');
    });
  });
});