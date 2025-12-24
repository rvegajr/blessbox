/**
 * IOnboardingSession - Interface Segregation Principle Compliant
 * 
 * Single responsibility: Managing onboarding session state in browser storage
 * 
 * This interface is intentionally narrow - it only handles session storage
 * for the onboarding wizard flow. It does NOT handle:
 * - API calls (use IOnboardingAPI)
 * - Form validation (use IFormConfigService)
 * - QR code generation (use IQRCodeService)
 */

export interface OnboardingFormData {
  fields: OnboardingFormField[];
  title: string;
  description?: string;
}

export interface OnboardingFormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'textarea' | 'checkbox';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];  // For select/dropdown fields
  order?: number;
}

export interface OnboardingSessionData {
  organizationId?: string;
  contactEmail?: string;
  emailVerified?: boolean;
  formData?: OnboardingFormData;
  formSaved?: boolean;
  currentStep?: number;
  qrGenerated?: boolean;
}

/**
 * IOnboardingSession - Session management for onboarding wizard
 * 
 * ISP: This interface focuses ONLY on session storage operations.
 * It does not include API calls, validation, or other concerns.
 */
export interface IOnboardingSession {
  /**
   * Clear all onboarding session data
   * Used when starting a new organization setup
   */
  clearSession(): void;

  /**
   * Get the current session data
   */
  getSessionData(): OnboardingSessionData;

  /**
   * Set the organization ID for the current session
   */
  setOrganizationId(id: string): void;

  /**
   * Get the organization ID from the current session
   */
  getOrganizationId(): string | null;

  /**
   * Set the contact email for the current session
   */
  setContactEmail(email: string): void;

  /**
   * Get the contact email from the current session
   */
  getContactEmail(): string | null;

  /**
   * Mark email as verified
   */
  setEmailVerified(verified: boolean): void;

  /**
   * Check if email is verified
   */
  isEmailVerified(): boolean;

  /**
   * Save form data to session
   */
  setFormData(data: OnboardingFormData): void;

  /**
   * Get form data from session
   */
  getFormData(): OnboardingFormData | null;

  /**
   * Mark form as saved
   */
  setFormSaved(saved: boolean): void;

  /**
   * Check if form is saved
   */
  isFormSaved(): boolean;

  /**
   * Set current step
   */
  setCurrentStep(step: number): void;

  /**
   * Get current step
   */
  getCurrentStep(): number;

  /**
   * Mark QR codes as generated
   */
  setQrGenerated(generated: boolean): void;

  /**
   * Check if QR codes are generated
   */
  isQrGenerated(): boolean;
}

/**
 * Session storage keys used by the onboarding session
 * Exported for testing purposes
 */
export const ONBOARDING_SESSION_KEYS = [
  'onboarding_organizationId',
  'onboarding_contactEmail',
  'onboarding_emailVerified',
  'onboarding_formData',
  'onboarding_formSaved',
  'onboarding_step',
  'onboarding_qrGenerated',
] as const;

export type OnboardingSessionKey = typeof ONBOARDING_SESSION_KEYS[number];
