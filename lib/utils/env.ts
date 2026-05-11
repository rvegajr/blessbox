/**
 * Environment Variable Utilities
 *
 * Safely retrieve and sanitize environment variables.
 * Prevents issues with newlines, quotes, and whitespace.
 *
 * IMPORTANT — Server vs. Client (NEXT_PUBLIC_*):
 *   On the server, `getEnv('FOO')` works because `process.env[key]` is dynamic.
 *   In client/edge bundles, Next.js statically inlines ONLY literal references
 *   like `process.env.NEXT_PUBLIC_FOO`. A dynamic lookup `process.env[key]`
 *   resolves to `undefined` in the browser.
 *
 *   Therefore client code MUST pass the literal value to the helpers below:
 *     `sanitizePublicEnv(process.env.NEXT_PUBLIC_FOO, 'NEXT_PUBLIC_FOO')`
 *     `getPublicEnvBoolean(process.env.NEXT_PUBLIC_FOO, 'NEXT_PUBLIC_FOO')`
 *
 * Whenever sanitization actually changes a value (trailing newline, surrounding
 * quotes, etc.) we emit a structured warning via `logEnvIssue` so we can spot
 * misconfigured env vars in logs instead of silently shipping broken behavior.
 */

const LOG_PREFIX = '[env]';

interface EnvIssue {
  key: string;
  rawLength: number;
  sanitizedLength: number;
  hasNewline: boolean;
  hasCarriageReturn: boolean;
  hasSurroundingWhitespace: boolean;
  hasSurroundingQuotes: boolean;
}

const reportedKeys = new Set<string>();

function describeIssue(key: string, raw: string, sanitized: string): EnvIssue {
  return {
    key,
    rawLength: raw.length,
    sanitizedLength: sanitized.length,
    hasNewline: /\n|\\n/.test(raw),
    hasCarriageReturn: /\r|\\r/.test(raw),
    hasSurroundingWhitespace: raw !== raw.trim(),
    hasSurroundingQuotes: /^["'`].*["'`]$/.test(raw.trim()),
  };
}

/**
 * Log a structured warning when an env var needed sanitization.
 * De-duplicates per (key) so we don't spam logs on every render/request.
 * NEVER logs the actual values — only structural metadata.
 */
export function logEnvIssue(key: string, raw: string, sanitized: string): void {
  if (raw === sanitized) return;
  if (reportedKeys.has(key)) return;
  reportedKeys.add(key);

  const issue = describeIssue(key, raw, sanitized);
  if (typeof console !== 'undefined' && typeof console.warn === 'function') {
    console.warn(
      `${LOG_PREFIX} sanitized ${key} (lenRaw=${issue.rawLength} -> ${issue.sanitizedLength})`,
      issue,
    );
  }
}

/** Internal: pure sanitization, no logging. */
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
 * Sanitize a NEXT_PUBLIC_* value passed in from the call site.
 * Use in client code where `process.env[key]` (dynamic lookup) does not work.
 *
 *   const enabled = sanitizePublicEnv(
 *     process.env.NEXT_PUBLIC_TRAKLET_ENABLED,
 *     'NEXT_PUBLIC_TRAKLET_ENABLED',
 *   );
 *
 * Logs (once) if the raw value needed any cleanup.
 */
export function sanitizePublicEnv(
  rawValue: string | null | undefined,
  key: string,
): string {
  const raw = typeof rawValue === 'string' ? rawValue : '';
  const sanitized = sanitize(raw);
  logEnvIssue(key, raw, sanitized);
  return sanitized;
}

/**
 * Get environment variable with automatic sanitization.
 * Server-side only — uses dynamic `process.env[key]` lookup which the browser
 * bundler does not inline. For client code, see `sanitizePublicEnv`.
 */
export function getEnv(key: string, defaultValue: string = ''): string {
  const raw = process.env[key];
  const sanitized = sanitize(raw);
  if (typeof raw === 'string') {
    logEnvIssue(key, raw, sanitized);
  }
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

const TRUTHY_BOOLEAN_VALUES = ['true', '1', 'yes', 'on'];

/** Get boolean env var. Treats 'true', '1', 'yes', 'on' as true (case-insensitive). */
export function getEnvBoolean(
  key: string,
  defaultValue: boolean = false,
): boolean {
  const value = getEnv(key).toLowerCase();
  if (!value) return defaultValue;
  return TRUTHY_BOOLEAN_VALUES.includes(value);
}

/**
 * Boolean variant of `sanitizePublicEnv` for client-side feature flags.
 *
 *   const enabled = getPublicEnvBoolean(
 *     process.env.NEXT_PUBLIC_TRAKLET_ENABLED,
 *     'NEXT_PUBLIC_TRAKLET_ENABLED',
 *   );
 */
export function getPublicEnvBoolean(
  rawValue: string | null | undefined,
  key: string,
  defaultValue: boolean = false,
): boolean {
  const sanitized = sanitizePublicEnv(rawValue, key).toLowerCase();
  if (!sanitized) return defaultValue;
  return TRUTHY_BOOLEAN_VALUES.includes(sanitized);
}

