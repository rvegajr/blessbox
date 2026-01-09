/**
 * ICheckInTokenGenerator - Interface Segregation Principle
 * 
 * Responsible ONLY for generating and validating check-in tokens.
 * Does NOT handle check-in operations (that's IRegistrationCheckInService).
 */

export interface CheckInToken {
  token: string;
  registrationId: string;
  createdAt: string;
  expiresAt?: string;
}

export interface TokenValidationResult {
  valid: boolean;
  token?: CheckInToken;
  error?: string;
}

export interface ICheckInTokenGenerator {
  /**
   * Generate a unique check-in token for a registration.
   * Token format: UUID v4
   */
  generateToken(registrationId: string): string;

  /**
   * Validate token format (does not check database).
   * Returns true if token is a valid UUID format.
   */
  isValidTokenFormat(token: string): boolean;

  /**
   * Generate check-in URL from token.
   */
  generateCheckInUrl(token: string, baseUrl?: string): string;
}

