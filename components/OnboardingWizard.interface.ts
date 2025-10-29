// src/interfaces/OnboardingWizard.interface.ts
import type { ReactNode } from 'react';

export interface OnboardingStep {
  id: string;
  title: string;
  description?: string;
  component: ReactNode;
  isCompleted?: boolean;
  isOptional?: boolean;
  canSkip?: boolean;
}

export interface OnboardingWizardProps {
  steps: OnboardingStep[];
  currentStep: number;
  onStepChange: (stepIndex: number) => void;
  onComplete: () => void;
  onSkip: () => void;
  className?: string;
  'data-testid'?: string;
}

export interface WizardStepperProps {
  steps: OnboardingStep[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  className?: string;
  'data-testid'?: string;
}

export interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  canGoNext: boolean;
  canGoPrevious: boolean;
  isLastStep: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onComplete: () => void;
  onSkip: () => void;
  className?: string;
  'data-testid'?: string;
}

export interface OrganizationFormData {
  organizationName: string;
  contactName: string;
  email: string;
  phone?: string;
  website?: string;
  description?: string;
}

export interface OrganizationFormProps {
  data: OrganizationFormData;
  onChange: (data: OrganizationFormData) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  errors?: Record<string, string>;
  className?: string;
  'data-testid'?: string;
}

export interface EmailVerificationProps {
  email: string;
  onVerify: (code: string) => void;
  onResend: () => void;
  isLoading?: boolean;
  error?: string;
  className?: string;
  'data-testid'?: string;
}

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'textarea' | 'checkbox';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

export interface FormBuilderData {
  fields: FormField[];
  title: string;
  description?: string;
}

export interface FormBuilderProps {
  data: FormBuilderData;
  onChange: (data: FormBuilderData) => void;
  onPreview: () => void;
  isLoading?: boolean;
  className?: string;
  'data-testid'?: string;
}

export interface QRConfigData {
  qrCodes: Array<{
    id: string;
    label: string;
    description?: string;
    url: string;
  }>;
  settings: {
    size: number;
    format: 'png' | 'svg';
    includeLogo: boolean;
  };
}

export interface QRConfigProps {
  data: QRConfigData;
  onChange: (data: QRConfigData) => void;
  onGenerate: () => void;
  onDownload: () => void;
  isLoading?: boolean;
  className?: string;
  'data-testid'?: string;
}
