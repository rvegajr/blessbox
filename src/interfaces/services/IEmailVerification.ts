/**
 * Email verification service interface
 * Follows ISP - only methods related to email verification
 */
export interface IEmailVerification {
  /**
   * Send verification code to email
   * @param email - Email address to verify
   * @returns Promise resolving to success status
   */
  sendVerificationCode(email: string): Promise<boolean>;

  /**
   * Verify the code sent to email
   * @param email - Email address
   * @param code - 6-digit verification code
   * @returns Promise resolving to verification token
   */
  verifyCode(email: string, code: string): Promise<string>;

  /**
   * Check if email has pending verification
   * @param email - Email address to check
   * @returns Promise resolving to pending status
   */
  hasPendingVerification(email: string): Promise<boolean>;
}

/**
 * Verification result interface
 */
export interface IVerificationResult {
  success: boolean;
  token?: string;
  error?: string;
  attemptsRemaining?: number;
}