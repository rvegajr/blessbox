/**
 * Onboarding Flow Utilities
 * Centralized logic for managing onboarding state and navigation
 */

export interface OnboardingProgress {
  organizationSetup: boolean;
  emailVerification: boolean;
  formBuilder: boolean;
  qrConfiguration: boolean;
}

export const ONBOARDING_STEPS = [
  { id: 'organization-setup', 
    path: '/onboarding/organization-setup',
    label: 'Organization Setup',
    step: 1 },
  { id: 'email-verification',
    path: '/onboarding/email-verification',
    label: 'Email Verification',
    step: 2 },
  { id: 'form-builder',
    path: '/onboarding/form-builder',
    label: 'Form Builder',
    step: 3 },
  { id: 'qr-configuration',
    path: '/onboarding/qr-configuration',
    label: 'QR Configuration',
    step: 4 },
] as const;

/**
 * Get current onboarding step from session storage
 */
export function getCurrentOnboardingStep(): number {
  const step = sessionStorage.getItem('onboarding_step');
  return step ? parseInt(step, 10) : 1;
}

/**
 * Set current onboarding step
 */
export function setCurrentOnboardingStep(step: number): void {
  sessionStorage.setItem('onboarding_step', step.toString());
}

/**
 * Get onboarding progress from session storage
 */
export function getOnboardingProgress(): OnboardingProgress {
  return {
    organizationSetup: sessionStorage.getItem('onboarding_organizationId') !== null,
    emailVerification: sessionStorage.getItem('onboarding_emailVerified') === 'true',
    formBuilder: sessionStorage.getItem('onboarding_formSaved') === 'true',
    qrConfiguration: sessionStorage.getItem('onboarding_qrGenerated') === 'true',
  };
}

/**
 * Mark a step as complete
 */
export function markStepComplete(stepId: keyof OnboardingProgress): void {
  switch (stepId) {
    case 'organizationSetup':
      // Already tracked by organizationId
      break;
    case 'emailVerification':
      sessionStorage.setItem('onboarding_emailVerified', 'true');
      break;
    case 'formBuilder':
      sessionStorage.setItem('onboarding_formSaved', 'true');
      break;
    case 'qrConfiguration':
      sessionStorage.setItem('onboarding_qrGenerated', 'true');
      break;
  }
}

/**
 * Check if user can access a step (has completed previous steps)
 */
export function canAccessStep(stepNumber: number): boolean {
  const progress = getOnboardingProgress();

  switch (stepNumber) {
    case 1:
      return true; // Always accessible
    case 2:
      return progress.organizationSetup;
    case 3:
      return progress.organizationSetup && progress.emailVerification;
    case 4:
      return progress.organizationSetup && progress.emailVerification && progress.formBuilder;
    default:
      return false;
  }
}

/**
 * Get next step path
 */
export function getNextStepPath(currentPath: string): string | null {
  const currentStep = ONBOARDING_STEPS.find(step => step.path === currentPath);
  if (!currentStep) return null;

  const nextStep = ONBOARDING_STEPS.find(step => step.step === currentStep.step + 1);
  return nextStep?.path || '/dashboard';
}

/**
 * Get previous step path
 */
export function getPreviousStepPath(currentPath: string): string | null {
  const currentStep = ONBOARDING_STEPS.find(step => step.path === currentPath);
  if (!currentStep) return null;

  const previousStep = ONBOARDING_STEPS.find(step => step.step === currentStep.step - 1);
  return previousStep?.path || null;
}

/**
 * Reset onboarding progress (for testing/debugging)
 */
export function resetOnboardingProgress(): void {
  sessionStorage.removeItem('onboarding_organizationId');
  sessionStorage.removeItem('onboarding_contactEmail');
  sessionStorage.removeItem('onboarding_step');
  sessionStorage.removeItem('onboarding_emailVerified');
  sessionStorage.removeItem('onboarding_formSaved');
  sessionStorage.removeItem('onboarding_qrGenerated');
}

