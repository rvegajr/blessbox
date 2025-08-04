// 🎊 JOYFUL TDD TESTS FOR AUTHENTICATION SERVICE! 🎊
// These tests will guide us to PERFECT implementation! ✨

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AuthenticationService } from '../../../implementations/auth/AuthenticationService';
import type { IAuthenticationService } from '../../../interfaces/auth/IAuthenticationService';
import { createDatabaseConnection, closeDatabaseConnection } from '../../../database/connection';
import { createTestOrganization, cleanupTestOrganization } from '../../helpers/test-data-setup';

describe('🚀 AuthenticationService - The Most Joyful Auth System Ever!', () => {
  let authService: IAuthenticationService;
  let testEmail: string;
  let testUserId: string;

  beforeEach(async () => {
    // 🌟 Set up our beautiful test environment with TURSO POWER!
    process.env.TURSO_DATABASE_URL = 'libsql://blessbox-local-rvegajr.aws-us-east-2.turso.io';
    process.env.TURSO_AUTH_TOKEN = '***JWT_REDACTED***';
    
    await createDatabaseConnection();
    authService = new AuthenticationService();
    testEmail = `test-${Date.now()}@blessbox.app`;
    
    // 🎊 Create test organization with PURE JOY!
    const testOrg = await createTestOrganization(testEmail);
    testUserId = testOrg.id;
  });

  afterEach(async () => {
    // 🧹 Clean up with love
    await cleanupTestOrganization(testEmail);
    await closeDatabaseConnection();
  });

  describe('🎯 Passwordless Login Flow - Pure Magic!', () => {
    it('should send login code with PURE JOY! 🎉', async () => {
      // 🚀 ARRANGE - Set up our test scenario
      const email = testEmail;

      // 🎊 ACT - Execute the magical function
      const result = await authService.requestLoginCode(email);

      // ✨ ASSERT - Verify the magic happened
      expect(result.success).toBe(true);
      expect(result.message).toContain('Login code sent');
      expect(result.expiresIn).toBe(900); // 15 minutes of pure joy
      expect(result.attemptsRemaining).toBe(3);
    });

    it('should verify login code and create session! 🌟', async () => {
      // 🚀 ARRANGE
      await authService.requestLoginCode(testEmail);
      // In real test, we'd get the code from database, for now mock it
      const mockCode = '123456';

      // 🎊 ACT
      const result = await authService.verifyLoginCode(testEmail, mockCode);

      // ✨ ASSERT
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user?.email).toBe(testEmail);
    });

    it('should handle invalid codes gracefully! 💫', async () => {
      // 🚀 ARRANGE
      await authService.requestLoginCode(testEmail);

      // 🎊 ACT
      const result = await authService.verifyLoginCode(testEmail, 'wrong-code');

      // ✨ ASSERT
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid or expired code');
    });
  });

  describe('🔐 Password Management - User Choice!', () => {
    it('should allow setting password in dashboard! 🎨', async () => {
      // 🚀 ARRANGE
      const strongPassword = 'MyAmazingPassword123!';

      // 🎊 ACT
      await authService.setPassword(testUserId, strongPassword);
      const hasPassword = await authService.hasPassword(testUserId);

      // ✨ ASSERT
      expect(hasPassword).toBe(true);
    });

    it('should login with password when set! 🔑', async () => {
      // 🚀 ARRANGE
      const password = 'SuperSecurePassword456!';
      await authService.setPassword(testUserId, password);

      // 🎊 ACT
      const result = await authService.loginWithPassword(testEmail, password);

      // ✨ ASSERT
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.token).toBeDefined();
    });
  });

  describe('🎯 Token Management - Secure & Smooth!', () => {
    it('should validate tokens with EXCELLENCE! ⭐', async () => {
      // 🚀 ARRANGE
      const loginResult = await authService.verifyLoginCode(testEmail, '123456');
      const token = loginResult.token!;

      // 🎊 ACT
      const user = await authService.validateToken(token);

      // ✨ ASSERT
      expect(user).toBeDefined();
      expect(user?.email).toBe(testEmail);
    });

    it('should refresh tokens beautifully! 🔄', async () => {
      // 🚀 ARRANGE
      const loginResult = await authService.verifyLoginCode(testEmail, '123456');
      const refreshToken = loginResult.refreshToken!;

      // 🎊 ACT
      const newToken = await authService.refreshToken(refreshToken);

      // ✨ ASSERT
      expect(newToken).toBeDefined();
      expect(typeof newToken).toBe('string');
    });
  });

  describe('🏗️ ISP Compliance - Beautiful Architecture!', () => {
    it('should have exactly the right methods - no more, no less! 🎯', () => {
      // 🌟 Verify our interface is perfectly focused
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(authService));
      const expectedMethods = [
        'constructor',
        'requestLoginCode',
        'verifyLoginCode', 
        'loginWithPassword',
        'setPassword',
        'hasPassword',
        'validateToken',
        'refreshToken',
        'logout'
      ];

      expectedMethods.forEach(method => {
        expect(methods).toContain(method);
      });

      // 🎊 Perfect ISP compliance!
      expect(methods.length).toBe(expectedMethods.length);
    });
  });
});