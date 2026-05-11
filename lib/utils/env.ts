/**
 * Environment Variable Utilities
 *
 * Server-side helpers for reading environment variables with sanitization.
 * Prevents issues with newlines, quotes, and whitespace.
 */

function sanitize(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .trim()
    .replace(/\\n/g, '')
    .replace(/\\r/g, '')
    .replace(/\n/g, '')
    .replace(/\r/g, '')
    .replace(/^["'`]|["'`]$/g, '')
    .trim();
}

/**
 * Sanitize environment variable value.
 * Removes newlines, surrounding quotes, and whitespace.
 */
export function sanitizeEnvValue(value: string | null | undefined): string {
  return sanitize(value);
}

/**
 * Get environment variable with automatic sanitization.
 * Server-side only.
 */
export function getEnv(key: string, defaultValue: string = ''): string {
  const raw = process.env[key];
  const sanitized = sanitize(raw);
  return sanitized || defaultValue;
}

/**
 * Get required environment variable with automatic sanitization.
 * Throws if missing or empty after sanitization.
 */
export function getRequiredEnv(key: string, errorMessage?: string): string {
  const value = getEnv(key);

  if (!value) {
    throw new Error(
      errorMessage || `Environment variable ${key} is required but not set`,
    );
  }

  return value;
}

/** Get numeric environment variable. */
export function getEnvNumber(key: string, defaultValue: number): number {
  const value = getEnv(key);
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/** Get boolean env var. Treats 'true', '1', 'yes', 'on' as true (case-insensitive). */
export function getEnvBoolean(
  key: string,
  defaultValue: boolean = false,
): boolean {
  const value = getEnv(key).toLowerCase();
  if (!value) return defaultValue;
  return ['true', '1', 'yes', 'on'].includes(value);
}

