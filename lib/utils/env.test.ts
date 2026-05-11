/**
 * Environment Variable Sanitization Tests (TDD)
 *
 * Tests written BEFORE implementation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getEnv,
  getEnvBoolean,
  getPublicEnvBoolean,
  getRequiredEnv,
  logEnvIssue,
  sanitizeEnvValue,
  sanitizePublicEnv,
} from './env';

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

  describe('sanitizePublicEnv (client/inlined values)', () => {
    it('returns sanitized value for the trailing-newline case from production', () => {
      // This is the exact bug we hit on Vercel: NEXT_PUBLIC_TRAKLET_ENABLED came
      // through as "true\n" because the .env file ended with a newline.
      expect(
        sanitizePublicEnv('true\n', 'NEXT_PUBLIC_TRAKLET_ENABLED'),
      ).toBe('true');
    });

    it('returns empty string for undefined (browser dynamic lookup)', () => {
      expect(sanitizePublicEnv(undefined, 'NEXT_PUBLIC_MISSING')).toBe('');
    });

    it('returns empty string for null', () => {
      expect(sanitizePublicEnv(null, 'NEXT_PUBLIC_NULL')).toBe('');
    });

    it('strips surrounding quotes', () => {
      expect(sanitizePublicEnv('"value"', 'NEXT_PUBLIC_QUOTED')).toBe('value');
    });
  });

  describe('getPublicEnvBoolean', () => {
    it('returns true for "true\\n" (the production bug)', () => {
      expect(
        getPublicEnvBoolean('true\n', 'NEXT_PUBLIC_TRAKLET_ENABLED'),
      ).toBe(true);
    });

    it('returns true for "true"', () => {
      expect(getPublicEnvBoolean('true', 'NEXT_PUBLIC_FLAG')).toBe(true);
    });

    it('returns true for "1", "yes", "on" (case-insensitive)', () => {
      expect(getPublicEnvBoolean('1', 'NEXT_PUBLIC_FLAG')).toBe(true);
      expect(getPublicEnvBoolean('YES', 'NEXT_PUBLIC_FLAG')).toBe(true);
      expect(getPublicEnvBoolean('On', 'NEXT_PUBLIC_FLAG')).toBe(true);
    });

    it('returns default when value is undefined', () => {
      expect(getPublicEnvBoolean(undefined, 'NEXT_PUBLIC_MISSING', true)).toBe(true);
      expect(getPublicEnvBoolean(undefined, 'NEXT_PUBLIC_MISSING', false)).toBe(false);
    });

    it('returns false for arbitrary strings', () => {
      expect(getPublicEnvBoolean('disabled', 'NEXT_PUBLIC_FLAG')).toBe(false);
      expect(getPublicEnvBoolean('false', 'NEXT_PUBLIC_FLAG')).toBe(false);
    });
  });

  describe('logEnvIssue (structured warning)', () => {
    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('does not warn when sanitization is a no-op', () => {
      logEnvIssue('CLEAN_VAR', 'value', 'value');
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('warns once with structured metadata when raw differs from sanitized', () => {
      logEnvIssue('DIRTY_VAR_A', 'true\n', 'true');
      expect(warnSpy).toHaveBeenCalledTimes(1);
      const call = warnSpy.mock.calls[0];
      expect(String(call[0])).toContain('[env] sanitized DIRTY_VAR_A');
      expect(call[1]).toMatchObject({
        key: 'DIRTY_VAR_A',
        hasNewline: true,
      });
    });

    it('does not log the actual env value', () => {
      logEnvIssue('SECRET_VAR_A', '"super-secret-token\n"', 'super-secret-token');
      const all = JSON.stringify(warnSpy.mock.calls);
      expect(all).not.toContain('super-secret-token');
    });

    it('de-duplicates per key (no log spam)', () => {
      logEnvIssue('DUPE_VAR', 'true\n', 'true');
      logEnvIssue('DUPE_VAR', 'true\n', 'true');
      logEnvIssue('DUPE_VAR', 'true\n', 'true');
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('integration: getEnv + getEnvBoolean still work end-to-end', () => {
    it('boolean reads tolerate trailing newlines', () => {
      process.env.FEATURE_FLAG_X = 'true\n';
      expect(getEnvBoolean('FEATURE_FLAG_X')).toBe(true);
    });

    it('boolean reads tolerate quoted values', () => {
      process.env.FEATURE_FLAG_Y = '"yes"';
      expect(getEnvBoolean('FEATURE_FLAG_Y')).toBe(true);
    });
  });
});

