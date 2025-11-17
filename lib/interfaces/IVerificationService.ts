// IVerificationService - Interface Segregation Principle Compliant
// Single responsibility: Email verification code generation, validation, and management

export interface VerificationCode {
  id: string;
  email: string;
  code: string;
  attempts: number;
  createdAt: string;
  expiresAt: string;
  verified: boolean;
}

export interface VerificationResult {
  success: boolean;
  message: string;
  verified?: boolean;
  remainingAttempts?: number;
}

export interface RateLimitInfo {
  canSend: boolean;
  remainingAttempts: number;
  resetAt?: string;
}

export interface IVerificationService {
  // Code generation
  generateCode(email: string): Promise<string>;
  
  // Code sending
  sendVerificationCode(email: string): Promise<{ success: boolean; message: string; code?: string }>;
  
  // Code validation
  verifyCode(email: string, code: string): Promise<VerificationResult>;
  
  // Code retrieval
  getVerificationCode(email: string): Promise<VerificationCode | null>;
  getLatestVerificationCode(email: string): Promise<VerificationCode | null>;
  
  // Rate limiting
  checkRateLimit(email: string): Promise<RateLimitInfo>;
  
  // Code management
  invalidateCode(email: string): Promise<void>;
  incrementAttempts(email: string, code: string): Promise<void>;
  
  // Validation
  isCodeExpired(code: VerificationCode): boolean;
  isCodeVerified(code: VerificationCode): boolean;
  hasExceededMaxAttempts(code: VerificationCode): boolean;
}
