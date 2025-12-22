/**
 * ICheckoutValidation - Interface Segregation Principle Compliant
 * 
 * Single responsibility: Validate checkout form inputs
 * 
 * This interface is intentionally narrow - it only handles validation.
 * It does NOT handle:
 * - Payment processing (use IPaymentProcessor)
 * - Session management (use IOnboardingSession)
 * - API calls
 */

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
}

export interface CheckoutFormData {
  email: string;
  planType: 'free' | 'standard' | 'enterprise';
  couponCode?: string;
  amount: number;
}

export interface CheckoutValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * ICheckoutValidation - Form validation for checkout
 * 
 * ISP: This interface focuses ONLY on validation.
 * Payment processing is handled by IPaymentProcessor.
 */
export interface ICheckoutValidation {
  /**
   * Validate email address
   */
  validateEmail(email: string): EmailValidationResult;

  /**
   * Validate entire checkout form
   */
  validateCheckoutForm(data: CheckoutFormData): CheckoutValidationResult;

  /**
   * Check if email is required based on session state
   */
  isEmailRequired(hasSession: boolean): boolean;
}
