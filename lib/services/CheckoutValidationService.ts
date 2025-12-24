/**
 * CheckoutValidationService - ISP Compliant Implementation
 * 
 * Implements ICheckoutValidation for checkout form validation
 * 
 * Single responsibility: Validate checkout inputs before payment
 */

import type {
  ICheckoutValidation,
  EmailValidationResult,
  CheckoutFormData,
  CheckoutValidationResult,
} from '../interfaces/ICheckoutValidation';

export class CheckoutValidationService implements ICheckoutValidation {
  private readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  validateEmail(email: string): EmailValidationResult {
    // Check for null/undefined
    if (email === null || email === undefined) {
      return {
        isValid: false,
        error: 'Email is required to complete checkout',
      };
    }

    // Check for empty or whitespace-only
    const trimmedEmail = String(email).trim();
    if (trimmedEmail.length === 0) {
      return {
        isValid: false,
        error: 'Email is required to complete checkout',
      };
    }

    // Check email format
    if (!this.EMAIL_REGEX.test(trimmedEmail)) {
      return {
        isValid: false,
        error: 'Please enter a valid email address',
      };
    }

    return { isValid: true };
  }

  validateCheckoutForm(data: CheckoutFormData): CheckoutValidationResult {
    const errors: Record<string, string> = {};

    // Validate email
    const emailResult = this.validateEmail(data.email);
    if (!emailResult.isValid) {
      errors.email = emailResult.error!;
    }

    // Validate plan type
    const validPlans = ['free', 'standard', 'enterprise'];
    if (!validPlans.includes(data.planType)) {
      errors.planType = 'Invalid plan type selected';
    }

    // Validate amount (must be non-negative)
    if (typeof data.amount !== 'number' || data.amount < 0) {
      errors.amount = 'Invalid amount';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  isEmailRequired(hasSession: boolean): boolean {
    // Email is always required - but if there's a session,
    // it will be auto-populated from the session
    return !hasSession;
  }
}

// Export singleton instance for convenience
export const checkoutValidation = new CheckoutValidationService();

// Export helper functions for use in components
export function validateEmail(email: string): EmailValidationResult {
  return checkoutValidation.validateEmail(email);
}

export function validateCheckoutForm(data: CheckoutFormData): CheckoutValidationResult {
  return checkoutValidation.validateCheckoutForm(data);
}
