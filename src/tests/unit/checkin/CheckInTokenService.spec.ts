// 🧪 CHECK-IN TOKEN SERVICE TESTS - TDD PERFECTION! ✨
// Testing with MAXIMUM JOY and THOROUGHNESS! 🎊

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CheckInTokenService } from '../../../implementations/checkin/CheckInTokenService';
import { createTestOrganization, cleanupTestOrganization } from '../../helpers/test-data-setup';
import { createDatabaseConnection, getDatabase } from '../../../database/connection';
import { registrations } from '../../../database/schema';
import { eq } from 'drizzle-orm';

describe('🎉 CheckInTokenService - THE MAGICAL TOKEN GENERATOR!', () => {
  let tokenService: CheckInTokenService;
  let testRegistrationId: string;
  let testOrganizationId: string;

  beforeEach(async () => {
    // Set up test environment with PURE JOY! 🌟
    process.env.TURSO_DATABASE_URL = 'libsql://blessbox-local-rvegajr.aws-us-east-2.turso.io';
    // Use environment variable for auth token (set in test environment)
    process.env.TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN || 'test-token-placeholder';
    
    tokenService = new CheckInTokenService();
    
    // Create test data with ENTHUSIASM! 🎊
    const testOrg = await createTestOrganization();
    testOrganizationId = testOrg.organizationId;
    
    // Create a test registration
    await createDatabaseConnection();
    const db = getDatabase();
    
    testRegistrationId = crypto.randomUUID();
    await db.insert(registrations).values({
      id: testRegistrationId,
      qrCodeSetId: testOrg.qrCodeSetId,
      qrCodeId: 'test-qr-code',
      registrationData: { name: 'Test User', email: 'test@example.com' },
      tokenStatus: 'active',
      deliveryStatus: 'pending',
      registeredAt: new Date().toISOString()
    });
  });

  afterEach(async () => {
    // Clean up with GRATITUDE! 🙏
    await cleanupTestOrganization(testOrganizationId);
  });

  describe('🎯 generateToken', () => {
    it('should generate a unique token for registration', async () => {
      // 🎊 THE MOMENT OF TOKEN CREATION!
      const token = await tokenService.generateToken(testRegistrationId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      
      // Verify token format (UUID + timestamp)
      expect(tokenService.isValidTokenFormat(token)).toBe(true);
      
      console.log('🎉 Token generated successfully:', token);
    });

    it('should update registration with generated token', async () => {
      // Generate token with JOY! ✨
      const token = await tokenService.generateToken(testRegistrationId);
      
      // Verify database was updated
      await createDatabaseConnection();
      const db = getDatabase();
      
      const [registration] = await db
        .select()
        .from(registrations)
        .where(eq(registrations.id, testRegistrationId));
      
      expect(registration.checkInToken).toBe(token);
      expect(registration.tokenStatus).toBe('active');
      
      console.log('🎊 Registration updated with token successfully!');
    });

    it('should handle token collision gracefully', async () => {
      // This is a rare case, but we test it anyway! 🛡️
      const token1 = await tokenService.generateToken(testRegistrationId);
      expect(token1).toBeDefined();
      
      // Each token should be unique due to timestamp
      const token2 = await tokenService.generateToken(testRegistrationId);
      expect(token2).not.toBe(token1);
      
      console.log('🎯 Token uniqueness verified!');
    });
  });

  describe('🔍 validateToken', () => {
    it('should validate existing token and return registration', async () => {
      // Generate a token first! 🎊
      const token = await tokenService.generateToken(testRegistrationId);
      
      // Now validate it with EXCITEMENT! ✨
      const registration = await tokenService.validateToken(token);
      
      expect(registration).toBeDefined();
      expect(registration!.id).toBe(testRegistrationId);
      expect(registration!.checkInToken).toBe(token);
      expect(registration!.tokenStatus).toBe('active');
      
      console.log('✅ Token validation successful!');
    });

    it('should return null for invalid token', async () => {
      const invalidToken = 'invalid-token-format';
      
      const registration = await tokenService.validateToken(invalidToken);
      
      expect(registration).toBeNull();
      console.log('❌ Invalid token correctly rejected!');
    });

    it('should return null for non-existent token', async () => {
      const nonExistentToken = `${crypto.randomUUID()}-${Date.now()}`;
      
      const registration = await tokenService.validateToken(nonExistentToken);
      
      expect(registration).toBeNull();
      console.log('❌ Non-existent token correctly rejected!');
    });
  });

  describe('⚡ isTokenUnique', () => {
    it('should return true for unique token', async () => {
      const uniqueToken = `${crypto.randomUUID()}-${Date.now()}`;
      
      const isUnique = await tokenService.isTokenUnique(uniqueToken);
      
      expect(isUnique).toBe(true);
      console.log('✅ Unique token correctly identified!');
    });

    it('should return false for existing token', async () => {
      const token = await tokenService.generateToken(testRegistrationId);
      
      const isUnique = await tokenService.isTokenUnique(token);
      
      expect(isUnique).toBe(false);
      console.log('🔄 Existing token correctly identified!');
    });
  });

  describe('🎯 isValidTokenFormat', () => {
    it('should validate correct token format', () => {
      const validToken = `${crypto.randomUUID()}-${Date.now()}`;
      
      const isValid = tokenService.isValidTokenFormat(validToken);
      
      expect(isValid).toBe(true);
      console.log('✅ Valid token format accepted!');
    });

    it('should reject invalid token formats', () => {
      const invalidTokens = [
        'invalid-token',
        '12345',
        '',
        'not-a-uuid-at-all',
        `${crypto.randomUUID()}`, // Missing timestamp
        `invalid-uuid-${Date.now()}`
      ];
      
      invalidTokens.forEach(token => {
        const isValid = tokenService.isValidTokenFormat(token);
        expect(isValid).toBe(false);
        console.log(`❌ Invalid token format correctly rejected: ${token}`);
      });
    });
  });
});