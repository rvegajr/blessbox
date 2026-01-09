/**
 * Environment Variable Sanitization Tests (TDD)
 * 
 * Tests written BEFORE implementation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getEnv, getRequiredEnv, sanitizeEnvValue } from './env';

describe('Environment Variable Utilities', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('sanitizeEnvValue', () => {
    it('removes newline characters', () => {
      expect(sanitizeEnvValue('value\n')).toBe('value');
      expect(sanitizeEnvValue('value\\n')).toBe('value');
      expect(sanitizeEnvValue('\nvalue\n')).toBe('value');
    });

    it('removes carriage returns', () => {
      expect(sanitizeEnvValue('value\r\n')).toBe('value');
      expect(sanitizeEnvValue('value\\r\\n')).toBe('value');
    });

    it('trims whitespace', () => {
      expect(sanitizeEnvValue('  value  ')).toBe('value');
      expect(sanitizeEnvValue('\tvalue\t')).toBe('value');
    });

    it('removes surrounding quotes', () => {
      expect(sanitizeEnvValue('"value"')).toBe('value');
      expect(sanitizeEnvValue("'value'")).toBe('value');
      expect(sanitizeEnvValue('`value`')).toBe('value');
    });

    it('handles multiple issues at once', () => {
      expect(sanitizeEnvValue('  "value\\n"  ')).toBe('value');
      expect(sanitizeEnvValue('"value\n"')).toBe('value');
    });

    it('returns empty string for null/undefined', () => {
      expect(sanitizeEnvValue(null)).toBe('');
      expect(sanitizeEnvValue(undefined)).toBe('');
    });

    it('preserves hyphens and underscores in tokens', () => {
      expect(sanitizeEnvValue('EAAAl4PVSA-test_123')).toBe('EAAAl4PVSA-test_123');
    });
  });

  describe('getEnv', () => {
    it('returns sanitized value when env var exists', () => {
      process.env.TEST_VAR = '  value\\n  ';
      expect(getEnv('TEST_VAR')).toBe('value');
    });

    it('returns default value when env var missing', () => {
      expect(getEnv('MISSING_VAR', 'default')).toBe('default');
    });

    it('returns empty string when env var missing and no default', () => {
      expect(getEnv('MISSING_VAR')).toBe('');
    });

    it('sanitizes Square tokens', () => {
      process.env.SQUARE_ACCESS_TOKEN = '"EAAAtest123\\n"';
      expect(getEnv('SQUARE_ACCESS_TOKEN')).toBe('EAAAtest123');
    });
  });

  describe('getRequiredEnv', () => {
    it('returns sanitized value when env var exists', () => {
      process.env.REQUIRED_VAR = '  value\\n  ';
      expect(getRequiredEnv('REQUIRED_VAR')).toBe('value');
    });

    it('throws error when env var missing', () => {
      expect(() => getRequiredEnv('MISSING_REQUIRED')).toThrow('Environment variable MISSING_REQUIRED is required but not set');
    });

    it('throws error when env var is empty after sanitization', () => {
      process.env.EMPTY_VAR = '  \n  ';
      expect(() => getRequiredEnv('EMPTY_VAR')).toThrow('Environment variable EMPTY_VAR is required but not set');
    });

    it('includes custom error message', () => {
      expect(() => getRequiredEnv('API_KEY', 'API key must be configured')).toThrow('API key must be configured');
    });
  });
});

