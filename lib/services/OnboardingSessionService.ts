/**
 * OnboardingSessionService - ISP Compliant Implementation
 * 
 * Implements IOnboardingSession for browser sessionStorage management
 * during the onboarding wizard flow.
 * 
 * Single responsibility: Persist and retrieve onboarding state from sessionStorage
 */

import type {
  IOnboardingSession,
  OnboardingSessionData,
  OnboardingFormData,
  ONBOARDING_SESSION_KEYS,
} from '../interfaces/IOnboardingSession';

export class OnboardingSessionService implements IOnboardingSession {
  private readonly KEYS = {
    organizationId: 'onboarding_organizationId',
    contactEmail: 'onboarding_contactEmail',
    emailVerified: 'onboarding_emailVerified',
    formData: 'onboarding_formData',
    formSaved: 'onboarding_formSaved',
    step: 'onboarding_step',
    qrGenerated: 'onboarding_qrGenerated',
  } as const;

  private isClient(): boolean {
    return typeof window !== 'undefined';
  }

  clearSession(): void {
    if (!this.isClient()) return;
    
    Object.values(this.KEYS).forEach(key => {
      sessionStorage.removeItem(key);
    });
  }

  getSessionData(): OnboardingSessionData {
    if (!this.isClient()) {
      return {};
    }

    return {
      organizationId: this.getOrganizationId() || undefined,
      contactEmail: this.getContactEmail() || undefined,
      emailVerified: this.isEmailVerified(),
      formData: this.getFormData() || undefined,
      formSaved: this.isFormSaved(),
      currentStep: this.getCurrentStep(),
      qrGenerated: this.isQrGenerated(),
    };
  }

  setOrganizationId(id: string): void {
    if (!this.isClient()) return;
    sessionStorage.setItem(this.KEYS.organizationId, id);
  }

  getOrganizationId(): string | null {
    if (!this.isClient()) return null;
    return sessionStorage.getItem(this.KEYS.organizationId);
  }

  setContactEmail(email: string): void {
    if (!this.isClient()) return;
    sessionStorage.setItem(this.KEYS.contactEmail, email);
  }

  getContactEmail(): string | null {
    if (!this.isClient()) return null;
    return sessionStorage.getItem(this.KEYS.contactEmail);
  }

  setEmailVerified(verified: boolean): void {
    if (!this.isClient()) return;
    sessionStorage.setItem(this.KEYS.emailVerified, verified ? 'true' : 'false');
  }

  isEmailVerified(): boolean {
    if (!this.isClient()) return false;
    return sessionStorage.getItem(this.KEYS.emailVerified) === 'true';
  }

  setFormData(data: OnboardingFormData): void {
    if (!this.isClient()) return;
    sessionStorage.setItem(this.KEYS.formData, JSON.stringify(data));
  }

  getFormData(): OnboardingFormData | null {
    if (!this.isClient()) return null;
    
    const stored = sessionStorage.getItem(this.KEYS.formData);
    if (!stored) return null;
    
    try {
      return JSON.parse(stored) as OnboardingFormData;
    } catch {
      return null;
    }
  }

  setFormSaved(saved: boolean): void {
    if (!this.isClient()) return;
    sessionStorage.setItem(this.KEYS.formSaved, saved ? 'true' : 'false');
  }

  isFormSaved(): boolean {
    if (!this.isClient()) return false;
    return sessionStorage.getItem(this.KEYS.formSaved) === 'true';
  }

  setCurrentStep(step: number): void {
    if (!this.isClient()) return;
    sessionStorage.setItem(this.KEYS.step, String(step));
  }

  getCurrentStep(): number {
    if (!this.isClient()) return 0;
    const stored = sessionStorage.getItem(this.KEYS.step);
    return stored ? parseInt(stored, 10) : 0;
  }

  setQrGenerated(generated: boolean): void {
    if (!this.isClient()) return;
    sessionStorage.setItem(this.KEYS.qrGenerated, generated ? 'true' : 'false');
  }

  isQrGenerated(): boolean {
    if (!this.isClient()) return false;
    return sessionStorage.getItem(this.KEYS.qrGenerated) === 'true';
  }
}

// Export singleton instance for convenience
export const onboardingSession = new OnboardingSessionService();

// Export helper function for clearing session (used in components)
export function clearOnboardingSession(): void {
  onboardingSession.clearSession();
}
