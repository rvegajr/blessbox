/**
 * Onboarding Session Tests (TDD)
 * 
 * Tests the onboarding session management:
 * - Session cleanup when starting new organization
 * - Session keys management
 * - Form data persistence
 * 
 * Verifies ISP compliance of OnboardingSessionService
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  OnboardingSessionService, 
  clearOnboardingSession 
} from './OnboardingSessionService';
import { ONBOARDING_SESSION_KEYS } from '../interfaces/IOnboardingSession';

/**
 * Helper to populate mock session data
 */
function populateOnboardingSession(): void {
  sessionStorage.setItem('onboarding_organizationId', 'org_old_123');
  sessionStorage.setItem('onboarding_contactEmail', 'old@example.com');
  sessionStorage.setItem('onboarding_emailVerified', 'true');
  sessionStorage.setItem('onboarding_formData', JSON.stringify({ fields: [], title: 'Old Form' }));
  sessionStorage.setItem('onboarding_formSaved', 'true');
  sessionStorage.setItem('onboarding_step', '3');
  sessionStorage.setItem('onboarding_qrGenerated', 'true');
}

describe('Onboarding Session Management', () => {
  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('clearOnboardingSession', () => {
    it('should remove all onboarding-related session keys', () => {
      // Arrange - populate session with old data
      populateOnboardingSession();
      
      // Verify data exists
      expect(sessionStorage.getItem('onboarding_organizationId')).toBe('org_old_123');
      expect(sessionStorage.getItem('onboarding_emailVerified')).toBe('true');

      // Act
      clearOnboardingSession();

      // Assert - all keys should be cleared
      ONBOARDING_SESSION_KEYS.forEach(key => {
        expect(sessionStorage.getItem(key)).toBeNull();
      });
    });

    it('should not affect non-onboarding session keys', () => {
      // Arrange
      populateOnboardingSession();
      sessionStorage.setItem('other_key', 'should_persist');
      sessionStorage.setItem('user_preferences', 'dark_mode');

      // Act
      clearOnboardingSession();

      // Assert
      expect(sessionStorage.getItem('other_key')).toBe('should_persist');
      expect(sessionStorage.getItem('user_preferences')).toBe('dark_mode');
    });

    it('should handle empty sessionStorage gracefully', () => {
      // Arrange - sessionStorage is already empty

      // Act & Assert - should not throw
      expect(() => clearOnboardingSession()).not.toThrow();
    });

    it('should handle partial session data', () => {
      // Arrange - only some keys exist
      sessionStorage.setItem('onboarding_organizationId', 'org_123');
      sessionStorage.setItem('onboarding_step', '1');
      // Other keys don't exist

      // Act
      clearOnboardingSession();

      // Assert - all keys should be cleared (or remain non-existent)
      ONBOARDING_SESSION_KEYS.forEach(key => {
        expect(sessionStorage.getItem(key)).toBeNull();
      });
    });
  });

  describe('Session Key Constants', () => {
    it('should include organizationId key', () => {
      expect(ONBOARDING_SESSION_KEYS).toContain('onboarding_organizationId');
    });

    it('should include contactEmail key', () => {
      expect(ONBOARDING_SESSION_KEYS).toContain('onboarding_contactEmail');
    });

    it('should include emailVerified key', () => {
      expect(ONBOARDING_SESSION_KEYS).toContain('onboarding_emailVerified');
    });

    it('should include formData key', () => {
      expect(ONBOARDING_SESSION_KEYS).toContain('onboarding_formData');
    });

    it('should include formSaved key', () => {
      expect(ONBOARDING_SESSION_KEYS).toContain('onboarding_formSaved');
    });

    it('should include step key', () => {
      expect(ONBOARDING_SESSION_KEYS).toContain('onboarding_step');
    });

    it('should include qrGenerated key', () => {
      expect(ONBOARDING_SESSION_KEYS).toContain('onboarding_qrGenerated');
    });
  });

  describe('Form Data Persistence', () => {
    it('should correctly serialize form data to sessionStorage', () => {
      // Arrange
      const formData = {
        fields: [
          { id: 'name', type: 'text' as const, label: 'Name', required: true },
          { id: 'gender', type: 'select' as const, label: 'Gender', required: true, options: ['Male', 'Female'] },
        ],
        title: 'Registration Form',
        description: 'Test form',
      };

      // Act
      sessionStorage.setItem('onboarding_formData', JSON.stringify(formData));
      const retrieved = JSON.parse(sessionStorage.getItem('onboarding_formData') || '{}');

      // Assert
      expect(retrieved.fields).toHaveLength(2);
      expect(retrieved.fields[1].options).toEqual(['Male', 'Female']);
      expect(retrieved.title).toBe('Registration Form');
    });

    it('should preserve dropdown options in form data', () => {
      // Arrange - this tests Issue 2 (dropdown options)
      const formData = {
        fields: [
          { 
            id: 'gender', 
            type: 'select' as const, 
            label: 'Gender', 
            required: true, 
            options: ['Male', 'Female', 'Other', 'Prefer not to say'] 
          },
        ],
        title: 'Test Form',
      };

      // Act
      sessionStorage.setItem('onboarding_formData', JSON.stringify(formData));
      const retrieved = JSON.parse(sessionStorage.getItem('onboarding_formData') || '{}');

      // Assert
      const selectField = retrieved.fields.find((f: any) => f.type === 'select');
      expect(selectField).toBeDefined();
      expect(selectField.options).toEqual(['Male', 'Female', 'Other', 'Prefer not to say']);
    });
  });
});

describe('OnboardingSessionService (ISP Compliance)', () => {
  let service: OnboardingSessionService;

  beforeEach(() => {
    sessionStorage.clear();
    service = new OnboardingSessionService();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('Organization ID management', () => {
    it('should set and get organization ID', () => {
      service.setOrganizationId('org_123');
      expect(service.getOrganizationId()).toBe('org_123');
    });

    it('should return null when organization ID not set', () => {
      expect(service.getOrganizationId()).toBeNull();
    });
  });

  describe('Contact Email management', () => {
    it('should set and get contact email', () => {
      service.setContactEmail('test@example.com');
      expect(service.getContactEmail()).toBe('test@example.com');
    });

    it('should return null when contact email not set', () => {
      expect(service.getContactEmail()).toBeNull();
    });
  });

  describe('Email Verification', () => {
    it('should track email verification status', () => {
      expect(service.isEmailVerified()).toBe(false);
      service.setEmailVerified(true);
      expect(service.isEmailVerified()).toBe(true);
      service.setEmailVerified(false);
      expect(service.isEmailVerified()).toBe(false);
    });
  });

  describe('Form Data management', () => {
    it('should set and get form data with dropdown options', () => {
      const formData = {
        fields: [
          { id: 'gender', type: 'select' as const, label: 'Gender', required: true, options: ['Male', 'Female'] },
        ],
        title: 'Test Form',
      };

      service.setFormData(formData);
      const retrieved = service.getFormData();

      expect(retrieved).not.toBeNull();
      expect(retrieved?.fields[0].options).toEqual(['Male', 'Female']);
    });

    it('should return null when form data not set', () => {
      expect(service.getFormData()).toBeNull();
    });

    it('should handle malformed JSON gracefully', () => {
      sessionStorage.setItem('onboarding_formData', 'not valid json');
      expect(service.getFormData()).toBeNull();
    });
  });

  describe('Form Saved status', () => {
    it('should track form saved status', () => {
      expect(service.isFormSaved()).toBe(false);
      service.setFormSaved(true);
      expect(service.isFormSaved()).toBe(true);
    });
  });

  describe('Current Step management', () => {
    it('should set and get current step', () => {
      service.setCurrentStep(3);
      expect(service.getCurrentStep()).toBe(3);
    });

    it('should return 0 when step not set', () => {
      expect(service.getCurrentStep()).toBe(0);
    });
  });

  describe('QR Generated status', () => {
    it('should track QR generation status', () => {
      expect(service.isQrGenerated()).toBe(false);
      service.setQrGenerated(true);
      expect(service.isQrGenerated()).toBe(true);
    });
  });

  describe('getSessionData', () => {
    it('should return all session data', () => {
      service.setOrganizationId('org_123');
      service.setContactEmail('test@example.com');
      service.setEmailVerified(true);
      service.setCurrentStep(2);

      const data = service.getSessionData();

      expect(data.organizationId).toBe('org_123');
      expect(data.contactEmail).toBe('test@example.com');
      expect(data.emailVerified).toBe(true);
      expect(data.currentStep).toBe(2);
    });
  });

  describe('clearSession', () => {
    it('should clear all session data', () => {
      // Populate
      service.setOrganizationId('org_123');
      service.setContactEmail('test@example.com');
      service.setEmailVerified(true);
      service.setFormSaved(true);
      service.setQrGenerated(true);
      service.setCurrentStep(4);

      // Clear
      service.clearSession();

      // Verify all cleared
      expect(service.getOrganizationId()).toBeNull();
      expect(service.getContactEmail()).toBeNull();
      expect(service.isEmailVerified()).toBe(false);
      expect(service.isFormSaved()).toBe(false);
      expect(service.isQrGenerated()).toBe(false);
      expect(service.getCurrentStep()).toBe(0);
    });
  });
});
