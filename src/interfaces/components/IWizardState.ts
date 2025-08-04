/**
 * Wizard state interface - Read operations
 * Segregated from actions for CQRS pattern
 */
export interface IWizardState {
  getCurrentStep(): number;
  getTotalSteps(): number;
  canProceed(): boolean;
  canGoBack(): boolean;
  isComplete(): boolean;
  getStepData(step: number): any;
  getSessionId(): string;
}

/**
 * Wizard actions interface - Write operations
 */
export interface IWizardActions {
  next(): void;
  back(): void;
  goToStep(step: number): void;
  save(): Promise<void>;
  reset(): void;
  setStepData(step: number, data: any): void;
}

/**
 * Combined wizard store interface
 */
export interface IWizardStore extends IWizardState, IWizardActions {}

/**
 * Wizard step definition
 */
export interface IWizardStep {
  id: string;
  title: string;
  description?: string;
  component: string;
  validation?: () => boolean;
}

/**
 * Wizard configuration
 */
export const WIZARD_STEPS: IWizardStep[] = [
  {
    id: 'organization',
    title: 'Organization Setup',
    description: 'Enter your organization details',
    component: 'OrganizationSetup'
  },
  {
    id: 'verification',
    title: 'Email Verification',
    description: 'Verify your email address',
    component: 'EmailVerification'
  },
  {
    id: 'form-builder',
    title: 'Registration Form',
    description: 'Customize your registration form',
    component: 'FormBuilder'
  },
  {
    id: 'qr-config',
    title: 'QR Code Setup',
    description: 'Configure QR codes and languages',
    component: 'QRConfiguration'
  }
];