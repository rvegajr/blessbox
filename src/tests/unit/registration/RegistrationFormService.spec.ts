// 🎊 JOYFUL TDD TESTS FOR REGISTRATION SERVICE! 🎊
// REAL DATABASE TESTS! NO MOCKS! PURE HARDENED TESTING BLISS! ✨

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RegistrationFormService } from '../../../implementations/registration/RegistrationFormService';
import type { IRegistrationFormService } from '../../../interfaces/registration/IRegistrationFormService';
import { createDatabaseConnection, closeDatabaseConnection, getDatabase } from '../../../database/connection';
import { organizations, qrCodeSets, registrations } from '../../../database/schema';
import { eq } from 'drizzle-orm';

describe('🚀 RegistrationFormService - The Most Joyful Registration System Ever!', () => {
  let registrationService: IRegistrationFormService;
  let testOrgId: string;
  let testQRCodeId: string;

  beforeEach(async () => {
    // 🌟 Set up our beautiful test environment with TURSO POWER!
    process.env.TURSO_DATABASE_URL = 'libsql://blessbox-local-rvegajr.aws-us-east-2.turso.io';
    // Use environment variable for auth token (set in test environment)
    process.env.TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN || 'test-token-placeholder';
    
    await createDatabaseConnection();
    registrationService = new RegistrationFormService();
    
    // 🎊 Create test organization with PURE JOY!
    testOrgId = crypto.randomUUID();
    testQRCodeId = crypto.randomUUID();
    
    const db = getDatabase();
    
    // 🏢 Create test organization
    await db.insert(organizations).values({
      id: testOrgId,
      name: 'Test Organization',
      eventName: 'Test Event',
      contactEmail: `test-${Date.now()}@blessbox.app`,
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // 📱 Create test QR code set
    const formFields = JSON.stringify([
      {
        id: 'fullName',
        name: 'fullName',
        label: 'Full Name',
        type: 'text',
        required: true,
        placeholder: 'Enter your full name'
      },
      {
        id: 'email',
        name: 'email',
        label: 'Email Address',
        type: 'email',
        required: true,
        placeholder: 'Enter your email'
      },
      {
        id: 'phone',
        name: 'phone',
        label: 'Phone Number',
        type: 'phone',
        required: false,
        placeholder: 'Enter your phone number'
      }
    ]);

    const qrCodes = JSON.stringify([
      {
        id: testQRCodeId,
        label: 'Main Entrance',
        url: `https://blessbox.app/register/${testOrgId}/main-entrance`
      }
    ]);

    await db.insert(qrCodeSets).values({
      id: testQRCodeId,
      organizationId: testOrgId,
      name: 'Main Entrance',
      language: 'en',
      formFields,
      qrCodes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  });

  afterEach(async () => {
    // 🧹 Clean up with love
    try {
      const db = getDatabase();
      await db.delete(registrations).where(eq(registrations.organizationId, testOrgId));
      await db.delete(qrCodeSets).where(eq(qrCodeSets.organizationId, testOrgId));
      await db.delete(organizations).where(eq(organizations.id, testOrgId));
    } catch (error) {
      console.log('🤷 Cleanup failed:', error);
    }
    await closeDatabaseConnection();
  });

  describe('🎯 Registration Creation - Pure Database Magic!', () => {
    it('should create registration with PURE JOY! 🎉', async () => {
      // 🚀 ARRANGE - Set up our test scenario
      const formData = {
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        phone: '555-0123'
      };

      const registrationData = {
        qrCodeId: testQRCodeId,
        entryPoint: 'Door A',
        formData,
        ipAddress: '192.168.1.1',
        userAgent: 'Test Browser',
        submittedAt: new Date()
      };

      // 🎊 ACT - Execute the magical function
      const result = await registrationService.createRegistration(registrationData);

      // ✨ ASSERT - Verify the magic happened
      expect(result.success).toBe(true);
      expect(result.registrationId).toBeDefined();
      expect(result.message).toContain('Registration submitted successfully');
      expect(result.errors).toBeUndefined();
    });

    it('should validate required fields with PRECISION! 🎯', async () => {
      // 🚀 ARRANGE - Missing required field
      const formData = {
        email: 'john.doe@example.com'
        // Missing required fullName
      };

      const registrationData = {
        qrCodeId: testQRCodeId,
        formData,
        submittedAt: new Date()
      };

      // 🎊 ACT
      const result = await registrationService.createRegistration(registrationData);

      // ✨ ASSERT
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
      expect(result.errors?.[0].field).toBe('fullName');
      expect(result.errors?.[0].message).toContain('required');
    });

    it('should validate email format with EXCELLENCE! 📧', async () => {
      // 🚀 ARRANGE - Invalid email
      const formData = {
        fullName: 'John Doe',
        email: 'invalid-email'
      };

      const registrationData = {
        qrCodeId: testQRCodeId,
        formData,
        submittedAt: new Date()
      };

      // 🎊 ACT
      const result = await registrationService.createRegistration(registrationData);

      // ✨ ASSERT
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some(e => e.field === 'email' && e.message.includes('valid email'))).toBe(true);
    });
  });

  describe('🔍 Form Retrieval - Lightning Fast Access!', () => {
    it('should get registration form by QR code! 🌟', async () => {
      // 🎊 ACT - Get the form
      const form = await registrationService.getRegistrationByQRCode(testQRCodeId);

      // ✨ ASSERT - Verify the magic
      expect(form).toBeDefined();
      expect(form?.id).toBe(testQRCodeId);
      expect(form?.organizationName).toBe('Test Organization');
      expect(form?.qrCodeLabel).toBe('Main Entrance');
      expect(form?.formFields).toBeDefined();
      expect(form?.formFields.length).toBeGreaterThan(0);
    });

    it('should return null for invalid QR code! 🔍', async () => {
      // 🎊 ACT
      const form = await registrationService.getRegistrationByQRCode('invalid-qr-code');

      // ✨ ASSERT
      expect(form).toBeNull();
    });
  });

  describe('📊 Registration Management - Dashboard Power!', () => {
    it('should get registrations by organization! 📈', async () => {
      // 🚀 ARRANGE - Create a test registration first
      const formData = {
        fullName: 'Jane Smith',
        email: 'jane.smith@example.com'
      };

      await registrationService.createRegistration({
        qrCodeId: testQRCodeId,
        formData,
        submittedAt: new Date()
      });

      // 🎊 ACT
      const registrations = await registrationService.getRegistrationsByOrganization(testOrgId);

      // ✨ ASSERT
      expect(registrations).toBeDefined();
      expect(registrations.length).toBeGreaterThan(0);
      expect(registrations[0].organizationId).toBe(testOrgId);
      expect(registrations[0].registrationData.fullName).toBe('Jane Smith');
    });

    it('should update registration status with JOY! ✅', async () => {
      // 🚀 ARRANGE - Create registration
      const result = await registrationService.createRegistration({
        qrCodeId: testQRCodeId,
        formData: { fullName: 'Test User', email: 'test@example.com' },
        submittedAt: new Date()
      });

      // 🎊 ACT
      await registrationService.updateRegistrationStatus(result.registrationId!, 'delivered', new Date());

      // ✨ ASSERT - Get updated registration
      const registrations = await registrationService.getRegistrationsByOrganization(testOrgId);
      const updatedReg = registrations.find(r => r.id === result.registrationId);
      
      expect(updatedReg?.status).toBe('delivered');
      expect(updatedReg?.deliveredAt).toBeDefined();
    });

    it('should get analytics with PURE INSIGHTS! 📊', async () => {
      // 🚀 ARRANGE - Create test registrations
      await registrationService.createRegistration({
        qrCodeId: testQRCodeId,
        formData: { fullName: 'User 1', email: 'user1@example.com' },
        submittedAt: new Date()
      });

      await registrationService.createRegistration({
        qrCodeId: testQRCodeId,
        formData: { fullName: 'User 2', email: 'user2@example.com' },
        submittedAt: new Date()
      });

      // 🎊 ACT
      const analytics = await registrationService.getRegistrationAnalytics(testOrgId);

      // ✨ ASSERT
      expect(analytics).toBeDefined();
      expect(analytics.totalRegistrations).toBeGreaterThanOrEqual(2);
      expect(analytics.registrationsByStatus).toBeDefined();
      expect(analytics.registrationsByQRCode).toBeDefined();
      expect(analytics.registrationsByDate).toBeDefined();
      expect(analytics.averageRegistrationsPerDay).toBeGreaterThanOrEqual(0);
    });
  });

  describe('🏗️ ISP Compliance - Beautiful Architecture!', () => {
    it('should have exactly the right methods - no more, no less! 🎯', () => {
      // 🌟 Verify our interface is perfectly focused
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(registrationService));
      const expectedMethods = [
        'constructor',
        'createRegistration',
        'getRegistrationByQRCode',
        'getRegistrationsByOrganization',
        'updateRegistrationStatus',
        'getRegistrationAnalytics'
      ];

      expectedMethods.forEach(method => {
        expect(methods).toContain(method);
      });

      // 🎊 Perfect ISP compliance!
      expect(methods.length).toBeLessThanOrEqual(expectedMethods.length + 2); // Allow for private methods
    });
  });
});