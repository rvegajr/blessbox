/**
 * P0 Fix: Clear onboarding localStorage keys
 * Prevents auth leak where old onboarding data persists across sessions
 */

const ONBOARDING_KEYS = [
  'blessbox_onboarding_email',
  'blessbox_onboarding_org_name',
  'blessbox_onboarding_org_id',
  'blessbox_onboarding_step',
  'blessbox_onboarding_verified',
  'blessbox_onboarding_data'
];

export function clearOnboardingStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  for (const key of ONBOARDING_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      // Silently fail if localStorage is unavailable
      console.warn(`Failed to clear localStorage key: ${key}`, error);
    }
  }
}
