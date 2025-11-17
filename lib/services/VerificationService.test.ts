// VerificationService Tests - TDD Approach
// Tests the actual implementation against the interface

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VerificationService } from './VerificationService';
import type { 
  VerificationCode,
  VerificationResult,
  RateLimitInfo
} from '../interfaces/IVerificationService';
import { getDbClient } from '../db';
import { EmailService } from './EmailService';

// Mock the database
vi.mock('../db', () => ({
  getDbClient: vi.fn(),
}));

// Mock the email service
vi.mock('./EmailService', () => ({
  EmailService: vi.fn(() => ({
    sendEmail: vi.fn().mockResolvedValue({ success: true }),
  })),
}));

describe('VerificationService', () => {
  let service: VerificationService;
  let mockDb: any;
  let mockEmailService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set test environment to avoid email sending
    process.env.NODE_ENV = 'test';
    
    mockDb = {
      execute: vi.fn(),
    };
    
    (getDbClient as any).mockReturnValue(mockDb);
    mockDb.execute.mockResolvedValue({ rows: [] });
    
    mockEmailService = {
      sendEmail: vi.fn().mockResolvedValue({ success: true }),
    };
    (EmailService as any).mockImplementation(() => mockEmailService);
    
    service = new VerificationService();
  });

  describe('generateCode', () => {
    it('should generate a 6-digit code', async () => {
      const code = await service.generateCode('test@example.com');
      
      expect(code).toMatch(/^\d{6}$/);
      expect(code.length).toBe(6);
    });

    it('should generate unique codes', async () => {
      const code1 = await service.generateCode('test@example.com');
      const code2 = await service.generateCode('test@example.com');
      
      // Codes should be different (very high probability)
      expect(code1).not.toBe(code2);
    });
  });

  describe('sendVerificationCode', () => {
    it('should send verification code successfully', async () => {
      // Mock no existing codes
      mockDb.execute.mockResolvedValueOnce({ rows: [] });
      
      // Mock code insertion
      mockDb.execute.mockResolvedValueOnce({ rows: [] });
      
      const result = await service.sendVerificationCode('test@example.com');
      
      expect(result.success).toBe(true);
      expect(result.code).toMatch(/^\d{6}$/);
      expect(mockEmailService.sendEmail).toHaveBeenCalled();
    });

    it('should invalidate previous codes when sending new one', async () => {
      // Mock existing code
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          id: 'existing-id',
          email: 'test@example.com',
          code: '123456',
          verified: 0,
        }]
      });
      
      // Mock update to invalidate old code
      mockDb.execute.mockResolvedValueOnce({ rows: [] });
      
      // Mock new code insertion
      mockDb.execute.mockResolvedValueOnce({ rows: [] });
      
      await service.sendVerificationCode('test@example.com');
      
      // Should have called update to invalidate old code
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          sql: expect.stringContaining('UPDATE'),
        })
      );
    });

    it('should enforce rate limiting (3 per hour)', async () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
      
      // Mock 3 recent codes (rate limit exceeded)
      mockDb.execute.mockResolvedValueOnce({
        rows: [
          { id: '1', created_at: oneHourAgo.toISOString() },
          { id: '2', created_at: oneHourAgo.toISOString() },
          { id: '3', created_at: oneHourAgo.toISOString() },
        ]
      });
      
      const result = await service.sendVerificationCode('test@example.com');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('rate limit');
    });

    it('should allow sending if rate limit not exceeded', async () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      
      // Mock old codes (outside rate limit window)
      mockDb.execute.mockResolvedValueOnce({
        rows: [
          { id: '1', created_at: twoHoursAgo.toISOString() },
        ]
      });
      
      // Mock new code insertion
      mockDb.execute.mockResolvedValueOnce({ rows: [] });
      
      const result = await service.sendVerificationCode('test@example.com');
      
      expect(result.success).toBe(true);
    });

    it('should return error for invalid email', async () => {
      const result = await service.sendVerificationCode('invalid-email');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('email');
    });
  });

  describe('verifyCode', () => {
    it('should verify code successfully', async () => {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      
      // Mock finding code
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          id: 'code-id',
          email: 'test@example.com',
          code: '123456',
          attempts: 0,
          expires_at: expiresAt,
          verified: 0,
        }]
      });
      
      // Mock update to mark as verified
      mockDb.execute.mockResolvedValueOnce({ rows: [] });
      
      const result = await service.verifyCode('test@example.com', '123456');
      
      expect(result.success).toBe(true);
      expect(result.verified).toBe(true);
    });

    it('should return error for incorrect code', async () => {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      
      // Mock finding code
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          id: 'code-id',
          email: 'test@example.com',
          code: '123456',
          attempts: 0,
          expires_at: expiresAt,
          verified: 0,
        }]
      });
      
      // Mock increment attempts
      mockDb.execute.mockResolvedValueOnce({ rows: [] });
      
      const result = await service.verifyCode('test@example.com', 'wrong-code');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('incorrect');
    });

    it('should return error for expired code', async () => {
      const expiredAt = new Date(Date.now() - 1000).toISOString();
      
      // Mock finding expired code
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          id: 'code-id',
          email: 'test@example.com',
          code: '123456',
          attempts: 0,
          expires_at: expiredAt,
          verified: 0,
        }]
      });
      
      const result = await service.verifyCode('test@example.com', '123456');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('expired');
    });

    it('should return error for already verified code', async () => {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      
      // Mock finding already verified code
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          id: 'code-id',
          email: 'test@example.com',
          code: '123456',
          attempts: 0,
          expires_at: expiresAt,
          verified: 1,
        }]
      });
      
      const result = await service.verifyCode('test@example.com', '123456');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('already verified');
    });

    it('should return error after max attempts (5)', async () => {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      
      // Mock finding code with max attempts
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          id: 'code-id',
          email: 'test@example.com',
          code: '123456',
          attempts: 5,
          expires_at: expiresAt,
          verified: 0,
        }]
      });
      
      const result = await service.verifyCode('test@example.com', 'wrong-code');
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('max attempts');
    });

    it('should increment attempts on wrong code', async () => {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      
      // Mock finding code
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          id: 'code-id',
          email: 'test@example.com',
          code: '123456',
          attempts: 2,
          expires_at: expiresAt,
          verified: 0,
        }]
      });
      
      // Mock increment attempts
      mockDb.execute.mockResolvedValueOnce({ rows: [] });
      
      await service.verifyCode('test@example.com', 'wrong-code');
      
      // Should have called update to increment attempts
      expect(mockDb.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          sql: expect.stringContaining('UPDATE'),
        })
      );
    });
  });

  describe('getVerificationCode', () => {
    it('should return verification code for valid email', async () => {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      
      mockDb.execute.mockResolvedValueOnce({
        rows: [{
          id: 'code-id',
          email: 'test@example.com',
          code: '123456',
          attempts: 0,
          created_at: new Date().toISOString(),
          expires_at: expiresAt,
          verified: 0,
        }]
      });
      
      const code = await service.getVerificationCode('test@example.com');
      
      expect(code).toBeDefined();
      expect(code?.email).toBe('test@example.com');
      expect(code?.code).toBe('123456');
    });

    it('should return null for non-existent code', async () => {
      mockDb.execute.mockResolvedValueOnce({ rows: [] });
      
      const code = await service.getVerificationCode('nonexistent@example.com');
      
      expect(code).toBeNull();
    });
  });

  describe('checkRateLimit', () => {
    it('should return canSend=true when under limit', async () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      
      // Mock old codes (outside rate limit window)
      mockDb.execute.mockResolvedValueOnce({
        rows: [
          { id: '1', created_at: twoHoursAgo.toISOString() },
        ]
      });
      
      const info = await service.checkRateLimit('test@example.com');
      
      expect(info.canSend).toBe(true);
      expect(info.remainingAttempts).toBeGreaterThan(0);
    });

    it('should return canSend=false when rate limit exceeded', async () => {
      const now = new Date();
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
      
      // Mock 3 recent codes
      mockDb.execute.mockResolvedValueOnce({
        rows: [
          { id: '1', created_at: thirtyMinutesAgo.toISOString() },
          { id: '2', created_at: thirtyMinutesAgo.toISOString() },
          { id: '3', created_at: thirtyMinutesAgo.toISOString() },
        ]
      });
      
      const info = await service.checkRateLimit('test@example.com');
      
      expect(info.canSend).toBe(false);
      expect(info.remainingAttempts).toBe(0);
    });
  });

  describe('isCodeExpired', () => {
    it('should return true for expired code', () => {
      const expiredAt = new Date(Date.now() - 1000).toISOString();
      const code: VerificationCode = {
        id: 'code-id',
        email: 'test@example.com',
        code: '123456',
        attempts: 0,
        createdAt: new Date().toISOString(),
        expiresAt: expiredAt,
        verified: false,
      };
      
      expect(service.isCodeExpired(code)).toBe(true);
    });

    it('should return false for valid code', () => {
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const code: VerificationCode = {
        id: 'code-id',
        email: 'test@example.com',
        code: '123456',
        attempts: 0,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt,
        verified: false,
      };
      
      expect(service.isCodeExpired(code)).toBe(false);
    });
  });

  describe('hasExceededMaxAttempts', () => {
    it('should return true when attempts >= 5', () => {
      const code: VerificationCode = {
        id: 'code-id',
        email: 'test@example.com',
        code: '123456',
        attempts: 5,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        verified: false,
      };
      
      expect(service.hasExceededMaxAttempts(code)).toBe(true);
    });

    it('should return false when attempts < 5', () => {
      const code: VerificationCode = {
        id: 'code-id',
        email: 'test@example.com',
        code: '123456',
        attempts: 3,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        verified: false,
      };
      
      expect(service.hasExceededMaxAttempts(code)).toBe(false);
    });
  });
});
