/**
 * Environment Variable Utilities
 * 
 * Safely retrieve and sanitize environment variables
 * Prevents issues with newlines, quotes, and whitespace
 */

/**
 * Sanitize environment variable value
 * Removes newlines, quotes, and trims whitespace
 */
export function sanitizeEnvValue(value: string | null | undefined): string {
  if (!value) return '';

  return value
    .trim()                          // Remove leading/trailing whitespace
    .replace(/\\n/g, '')            // Remove literal \n
    .replace(/\\r/g, '')            // Remove literal \r  
    .replace(/\n/g, '')             // Remove actual newlines
    .replace(/\r/g, '')             // Remove actual carriage returns
    .replace(/^["'`]|["'`]$/g, '')  // Remove surrounding quotes (", ', `)
    .trim();                         // Final trim after quote removal
}

/**
 * Get environment variable with automatic sanitization
 * Returns empty string if not found
 */
export function getEnv(key: string, defaultValue: string = ''): string {
  const value = process.env[key];
  const sanitized = sanitizeEnvValue(value);
  return sanitized || defaultValue;
}

/**
 * Get required environment variable with automatic sanitization
 * Throws error if not found or empty after sanitization
 */
export function getRequiredEnv(key: string, errorMessage?: string): string {
  const value = getEnv(key);
  
  if (!value) {
    throw new Error(
      errorMessage || `Environment variable ${key} is required but not set`
    );
  }
  
  return value;
}

/**
 * Get numeric environment variable
 * Returns default if not a valid number
 */
export function getEnvNumber(key: string, defaultValue: number): number {
  const value = getEnv(key);
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Get boolean environment variable
 * Treats 'true', '1', 'yes' as true (case-insensitive)
 */
export function getEnvBoolean(key: string, defaultValue: boolean = false): boolean {
  const value = getEnv(key).toLowerCase();
  if (!value) return defaultValue;
  return ['true', '1', 'yes'].includes(value);
}

