// Temporary in-memory storage for verification codes
// TODO: Replace with database implementation

interface VerificationCode {
  email: string;
  code: string;
  createdAt: Date;
  expiresAt: Date;
  attempts: number;
  verified: boolean;
}

// In-memory store (will be lost on server restart)
const verificationCodes = new Map<string, VerificationCode>();

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetAt: Date }>();

export const storeVerificationCode = (email: string, code: string): void => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes

  verificationCodes.set(email, {
    email,
    code,
    createdAt: now,
    expiresAt,
    attempts: 0,
    verified: false,
  });
};

export const getVerificationCode = (email: string): VerificationCode | null => {
  const stored = verificationCodes.get(email);
  if (!stored) return null;

  // Check if expired
  if (new Date() > stored.expiresAt) {
    verificationCodes.delete(email);
    return null;
  }

  return stored;
};

export const verifyCode = (email: string, code: string): { success: boolean; error?: string } => {
  const stored = getVerificationCode(email);
  
  if (!stored) {
    return { success: false, error: 'No verification code found or code expired' };
  }

  // Increment attempt count
  stored.attempts++;

  // Check for too many attempts
  if (stored.attempts > 5) {
    verificationCodes.delete(email);
    return { success: false, error: 'Too many failed attempts. Please request a new code.' };
  }

  // Check if code matches
  if (stored.code !== code) {
    return { success: false, error: 'Invalid verification code' };
  }

  // Mark as verified and remove from store
  stored.verified = true;
  verificationCodes.delete(email);
  
  return { success: true };
};

export const hasVerificationCode = (email: string): boolean => {
  return getVerificationCode(email) !== null;
};

export const clearVerificationCode = (email: string): void => {
  verificationCodes.delete(email);
};

// Rate limiting functions
export const checkRateLimit = (email: string): { allowed: boolean; resetAt?: Date } => {
  const now = new Date();
  const rateLimit = rateLimitStore.get(email);

  if (!rateLimit) {
    // First request
    rateLimitStore.set(email, {
      count: 1,
      resetAt: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour
    });
    return { allowed: true };
  }

  // Check if rate limit period has reset
  if (now > rateLimit.resetAt) {
    rateLimitStore.set(email, {
      count: 1,
      resetAt: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour
    });
    return { allowed: true };
  }

  // Check if under limit (5 requests per hour)
  if (rateLimit.count < 5) {
    rateLimit.count++;
    return { allowed: true };
  }

  return { allowed: false, resetAt: rateLimit.resetAt };
};

// Cleanup expired codes and rate limits (called periodically)
export const cleanupExpired = (): void => {
  const now = new Date();

  // Clean up expired verification codes
  for (const [email, code] of verificationCodes.entries()) {
    if (now > code.expiresAt) {
      verificationCodes.delete(email);
    }
  }

  // Clean up expired rate limits
  for (const [email, rateLimit] of rateLimitStore.entries()) {
    if (now > rateLimit.resetAt) {
      rateLimitStore.delete(email);
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupExpired, 5 * 60 * 1000);