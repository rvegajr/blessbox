import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { IEmailVerification } from '@interfaces/services/IEmailVerification';
import { EmailVerificationService } from '@implementations/services/EmailVerificationService';

/**
 * EmailVerification Test Specification
 * Written BEFORE implementation (TDD)
 */
describe('EmailVerification', () => {
  let emailVerification: IEmailVerification;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    
    emailVerification = new EmailVerificationService();
  });

  describe('sendVerificationCode', () => {
    it('should send verification code successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await emailVerification.sendVerificationCode('test@example.com');
      
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/onboarding/send-verification'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('test@example.com')
        })
      );
    });

    it('should return false on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Server error' })
      });

      const result = await emailVerification.sendVerificationCode('test@example.com');
      
      expect(result).toBe(false);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await emailVerification.sendVerificationCode('test@example.com');
      
      expect(result).toBe(false);
    });

    it('should validate email before sending', async () => {
      const result = await emailVerification.sendVerificationCode('invalid-email');
      
      expect(result).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('verifyCode', () => {
    it('should verify code successfully', async () => {
      const mockToken = 'verification-token-123';
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, token: mockToken })
      });

      const result = await emailVerification.verifyCode('test@example.com', '123456');
      
      expect(result).toBe(mockToken);
    });

    it('should throw error on invalid code', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ 
          error: 'Invalid code',
          attemptsRemaining: 2 
        })
      });

      await expect(
        emailVerification.verifyCode('test@example.com', '000000')
      ).rejects.toThrow('Invalid verification code');
    });

    it('should validate code format', async () => {
      await expect(
        emailVerification.verifyCode('test@example.com', '12345') // Too short
      ).rejects.toThrow('Invalid code format');
      
      await expect(
        emailVerification.verifyCode('test@example.com', 'abcdef') // Not numeric
      ).rejects.toThrow('Invalid code format');
      
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle expired codes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ 
          error: 'Code expired',
          code: 'EXPIRED' 
        })
      });

      await expect(
        emailVerification.verifyCode('test@example.com', '123456')
      ).rejects.toThrow('Verification code has expired');
    });
  });

  describe('hasPendingVerification', () => {
    it('should check for pending verification', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pending: true })
      });

      const result = await emailVerification.hasPendingVerification('test@example.com');
      
      expect(result).toBe(true);
    });

    it('should return false when no pending verification', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ pending: false })
      });

      const result = await emailVerification.hasPendingVerification('test@example.com');
      
      expect(result).toBe(false);
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false
      });

      const result = await emailVerification.hasPendingVerification('test@example.com');
      
      expect(result).toBe(false);
    });
  });

  describe('rate limiting', () => {
    it('should respect rate limits', async () => {
      // Simulate rate limit response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ 
          error: 'Too many requests',
          retryAfter: 3600 
        })
      });

      const result = await emailVerification.sendVerificationCode('test@example.com');
      
      expect(result).toBe(false);
    });
  });
});