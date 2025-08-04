/**
 * Validation service interface
 * Provides validation methods for various input types
 */
export interface IValidationService {
  /**
   * Validate email format
   * @param email - Email to validate
   * @returns true if valid
   */
  validateEmail(email: string): boolean;

  /**
   * Validate phone number format
   * @param phone - Phone number to validate
   * @returns true if valid
   */
  validatePhone(phone: string): boolean;

  /**
   * Validate domain name format
   * @param domain - Domain to validate
   * @returns true if valid
   */
  validateDomain(domain: string): boolean;

  /**
   * Validate zip code
   * @param zipCode - Zip code to validate
   * @returns true if valid
   */
  validateZipCode(zipCode: string): boolean;

  /**
   * Validate required field
   * @param value - Value to check
   * @returns true if not empty
   */
  validateRequired(value: any): boolean;

  /**
   * Get validation error message
   * @param field - Field name
   * @param type - Validation type
   * @returns Error message
   */
  getErrorMessage(field: string, type: string): string;
}

/**
 * Validation result interface
 */
export interface IValidationResult {
  isValid: boolean;
  errors: IValidationError[];
}

/**
 * Validation error interface
 */
export interface IValidationError {
  field: string;
  message: string;
  code: string;
}