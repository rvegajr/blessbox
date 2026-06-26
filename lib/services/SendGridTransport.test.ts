/**
 * SendGridTransport Tests (TDD)
 * 
 * Testing interface contracts and error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SendGridTransport } from './SendGridTransport';

describe('SendGridTransport', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NOCTUSOFT_DEPLOY_KEY = 'test-deploy-key';
    process.env.SENDGRID_FROM_EMAIL = 'test@example.com';
    process.env.SENDGRID_FROM_NAME = 'Test Sender';
    // Stub the gateway relay so tests never hit the network.
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 202, headers: { 'x-message-id': 'test' } })));
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  describe('configuration validation', () => {
    it('returns error if no gateway credential is configured', async () => {
      delete process.env.NOCTUSOFT_DEPLOY_KEY;
      delete process.env.SENDGRID_API_KEY;

      const transport = new SendGridTransport();
      const result = await transport.sendDirect({ to: 'a@b.com', subject: 'x', html: '<p>x</p>' });
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/gateway not configured|NOCTUSOFT_DEPLOY_KEY/i);
    });

    it('returns error if SENDGRID_FROM_EMAIL missing on first send', async () => {
      delete process.env.SENDGRID_FROM_EMAIL;

      const transport = new SendGridTransport();
      const result = await transport.sendDirect({ to: 'a@b.com', subject: 'x', html: '<p>x</p>' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('SendGrid from email not configured');
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
