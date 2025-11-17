/**
 * Verification Code Utilities
 * Generates and validates verification codes for email verification
 */

/**
 * Generate a random 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Check if a verification code is valid format (6 digits)
 */
export function isValidCodeFormat(code: string): boolean {
  return /^\d{6}$/.test(code);
}

/**
 * Calculate expiration time (default: 15 minutes from now)
 */
export function getExpirationTime(minutes: number = 15): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

/**
 * Check if a verification code is expired
 */
export function isCodeExpired(expiresAt: Date | string): boolean {
  const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  return expiry < new Date();
}

/**
 * Check if too many attempts have been made (default: 5 max)
 */
export function hasExceededMaxAttempts(attempts: number, maxAttempts: number = 5): boolean {
  return attempts >= maxAttempts;
}

/**
 * Rate limiting check (default: 1 minute between requests)
 */
export function canSendVerificationCode(
  lastSentAt: Date | string | null,
  cooldownMinutes: number = 1
): boolean {
  if (!lastSentAt) return true;
  
  const lastSent = typeof lastSentAt === 'string' ? new Date(lastSentAt) : lastSentAt;
  const cooldownMs = cooldownMinutes * 60 * 1000;
  const timeSinceLastSent = Date.now() - lastSent.getTime();
  
  return timeSinceLastSent >= cooldownMs;
}
