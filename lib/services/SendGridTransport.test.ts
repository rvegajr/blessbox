/**
 * SendGridTransport Tests (TDD)
 * 
 * Testing interface contracts and error handling
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SendGridTransport } from './SendGridTransport';

describe('SendGridTransport', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.SENDGRID_API_KEY = 'test-api-key';
    process.env.SENDGRID_FROM_EMAIL = 'test@example.com';
    process.env.SENDGRID_FROM_NAME = 'Test Sender';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('configuration validation', () => {
    it('throws error if SENDGRID_API_KEY missing', () => {
      delete process.env.SENDGRID_API_KEY;
      
      expect(() => new SendGridTransport()).toThrow('SendGrid API key not configured');
    });

    it('throws error if SENDGRID_FROM_EMAIL missing', () => {
      delete process.env.SENDGRID_FROM_EMAIL;
      
      expect(() => new SendGridTransport()).toThrow('SendGrid from email not configured');
    });

    it('uses default from name if not provided', () => {
      delete process.env.SENDGRID_FROM_NAME;
      
      const transport = new SendGridTransport();
      expect(transport).toBeDefined();
    });

    it('creates instance with valid config', () => {
      const transport = new SendGridTransport();
      expect(transport).toBeDefined();
      expect(transport.sendDirect).toBeDefined();
      expect(transport.sendWithRetry).toBeDefined();
    });
  });

  describe('interface contract', () => {
    it('sendDirect returns EmailResult with required fields', async () => {
      const transport = new SendGridTransport();
      
      const result = await transport.sendDirect({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      // Verify result has required EmailResult fields
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
      
      if (!result.success) {
        expect(result).toHaveProperty('error');
        expect(typeof result.error).toBe('string');
      }
    });

    it('sendWithRetry returns EmailResult with attempts count', async () => {
      const transport = new SendGridTransport();
      
      const result = await transport.sendWithRetry({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('attempts');
      expect(typeof result.attempts).toBe('number');
    });
  });
});
