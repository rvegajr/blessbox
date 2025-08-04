// Simple in-memory storage for verification codes
// This will be shared across API endpoints

interface VerificationCode {
  code: string;
  createdAt: Date;
  email: string;
}

// Global storage (will persist during server session)
const verificationCodes = new Map<string, VerificationCode>();

export const storeVerificationCode = (email: string, code: string): void => {
  verificationCodes.set(email, {
    code,
    createdAt: new Date(),
    email,
  });
  console.log(`📝 Stored verification code for ${email}`);
};

export const getVerificationCode = (email: string): VerificationCode | null => {
  const stored = verificationCodes.get(email);
  if (!stored) {
    console.log(`❌ No verification code found for ${email}`);
    return null;
  }

  // Check if expired (15 minutes)
  const now = new Date();
  const expirationTime = new Date(stored.createdAt.getTime() + 15 * 60 * 1000);
  
  if (now > expirationTime) {
    console.log(`⏰ Verification code expired for ${email}`);
    verificationCodes.delete(email);
    return null;
  }

  return stored;
};

export const verifyAndRemoveCode = (email: string, code: string): boolean => {
  const stored = getVerificationCode(email);
  
  if (!stored) {
    return false;
  }

  if (stored.code !== code) {
    console.log(`❌ Invalid code for ${email}. Expected: ${stored.code}, Got: ${code}`);
    return false;
  }

  // Code is valid, remove it
  verificationCodes.delete(email);
  console.log(`✅ Code verified and removed for ${email}`);
  return true;
};

export const hasVerificationCode = (email: string): boolean => {
  return getVerificationCode(email) !== null;
};

// Debug function to see all stored codes
export const debugStorage = (): void => {
  console.log('📊 Current verification codes:');
  for (const [email, data] of verificationCodes.entries()) {
    console.log(`  ${email}: ${data.code} (created: ${data.createdAt.toISOString()})`);
  }
};