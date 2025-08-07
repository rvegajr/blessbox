import { IEmailVerification, IVerificationResult } from '@interfaces/services/IEmailVerification';

/**
 * Email verification service implementation
 * Handles sending and verifying email verification codes
 */
export class EmailVerificationService implements IEmailVerification {
  private readonly validationService = {
    validateEmail: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  };

  /**
   * Send verification code to email
   */
  async sendVerificationCode(email: string): Promise<boolean> {
    // Validate email format
    if (!this.validationService.validateEmail(email)) {
      return false;
    }

    try {
      const response = await fetch('/api/onboarding/send-verification-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error('Failed to send verification code:', error);
      return false;
    }
  }

  /**
   * Verify the code sent to email
   */
  async verifyCode(email: string, code: string): Promise<string> {
    // Validate code format
    if (!/^\d{6}$/.test(code)) {
      throw new Error('Invalid code format');
    }

    try {
      const response = await fetch('/api/onboarding/verify-code-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, code })
      });

      const result: IVerificationResult = await response.json();

      if (!response.ok) {
        if (result.error === 'Code expired') {
          throw new Error('Verification code has expired');
        }
        throw new Error('Invalid verification code');
      }

      if (!result.success || !result.token) {
        throw new Error('Invalid verification code');
      }

      return result.token;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Verification failed');
    }
  }

  /**
   * Check if email has pending verification
   */
  async hasPendingVerification(email: string): Promise<boolean> {
    try {
      const response = await fetch('/api/onboarding/check-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      return result.pending === true;
    } catch (error) {
      console.error('Failed to check pending verification:', error);
      return false;
    }
  }
}

/**
 * Create a singleton instance
 */
export const emailVerificationService = new EmailVerificationService(); 