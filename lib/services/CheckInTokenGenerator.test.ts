/**
 * CheckInTokenGenerator Tests (TDD)
 * 
 * Tests written FIRST, implementation follows.
 */

import { describe, it, expect } from 'vitest';
import { CheckInTokenGenerator } from './CheckInTokenGenerator';

describe('CheckInTokenGenerator', () => {
  const generator = new CheckInTokenGenerator();

  describe('generateToken', () => {
    it('should generate a valid UUID format token', () => {
      const registrationId = 'test-reg-123';
      const token = generator.generateToken(registrationId);

      // UUID v4 format: 8-4-4-4-12 hex characters
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(token).toMatch(uuidRegex);
    });

    it('should generate unique tokens for same registration ID', () => {
      const registrationId = 'test-reg-456';
      const token1 = generator.generateToken(registrationId);
      const token2 = generator.generateToken(registrationId);

      expect(token1).not.toBe(token2);
    });

    it('should generate different tokens for different registrations', () => {
      const token1 = generator.generateToken('reg-1');
      const token2 = generator.generateToken('reg-2');

      expect(token1).not.toBe(token2);
    });

    it('should generate token even with empty registration ID', () => {
      const token = generator.generateToken('');
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
    });
  });

  describe('isValidTokenFormat', () => {
    it('should return true for valid UUID format', () => {
      const validToken = 'a1b2c3d4-e5f6-4789-a012-3456789abcde';
      expect(generator.isValidTokenFormat(validToken)).toBe(true);
    });

    it('should return true for generated tokens', () => {
      const token = generator.generateToken('test-123');
      expect(generator.isValidTokenFormat(token)).toBe(true);
    });

    it('should return false for invalid format', () => {
      expect(generator.isValidTokenFormat('not-a-uuid')).toBe(false);
      expect(generator.isValidTokenFormat('12345')).toBe(false);
      expect(generator.isValidTokenFormat('')).toBe(false);
      expect(generator.isValidTokenFormat('a1b2c3d4-e5f6-1234-5678-9abcdef01234')).toBe(false); // not UUID v4
    });

    it('should return false for null or undefined', () => {
      expect(generator.isValidTokenFormat(null as any)).toBe(false);
      expect(generator.isValidTokenFormat(undefined as any)).toBe(false);
    });
  });

  describe('generateCheckInUrl', () => {
    it('should generate correct check-in URL with default base', () => {
      const token = 'abc123-def456-ghi789-jkl012';
      const url = generator.generateCheckInUrl(token);

      expect(url).toContain('/check-in/');
      expect(url).toContain(token);
    });

    it('should generate correct check-in URL with custom base', () => {
      const token = 'abc123-def456-ghi789-jkl012';
      const baseUrl = 'https://custom.com';
      const url = generator.generateCheckInUrl(token, baseUrl);

      expect(url).toBe(`https://custom.com/check-in/${token}`);
    });

    it('should handle base URL with trailing slash', () => {
      const token = 'abc123';
      const url = generator.generateCheckInUrl(token, 'https://example.com/');

      expect(url).toBe('https://example.com/check-in/abc123');
    });

    it('should use production URL when available', () => {
      const token = 'test-token';
      const url = generator.generateCheckInUrl(token);

      // Should contain either localhost or blessbox.org
      expect(url).toMatch(/localhost|blessbox\.org/);
      expect(url).toContain('/check-in/');
    });
  });
});

