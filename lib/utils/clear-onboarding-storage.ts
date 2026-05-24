/**
 * Clears every localStorage key the onboarding flow writes.
 *
 * Issue #23: the original list used a `blessbox_onboarding_*` namespace that
 * does not exist anywhere in the app — the actual keys are written by
 * `app/onboarding/organization-setup/page.tsx` and friends as `onboarding_*`
 * (no prefix). The util was therefore a no-op and the previous org's name
 * leaked into the next "Add organization" flow.
 *
 * Both the legacy and current key patterns are cleared so nothing is left
 * behind regardless of when storage was first written.
 */

const ONBOARDING_KEYS = [
  // Current keys (organization-setup, email-verification, form-builder, qr-configuration)
  'onboarding_orgName',
  'onboarding_eventName',
  'onboarding_contactEmail',
  'onboarding_contactPhone',
  'onboarding_contactAddress',
  'onboarding_contactCity',
  'onboarding_contactState',
  'onboarding_contactZip',
  'onboarding_customDomain',
  'onboarding_organizationId',
  'onboarding_formConfig',
  'onboarding_formTitle',
  'onboarding_formDescription',
  'onboarding_qrConfig',
  'onboarding_eventType',
  'onboarding_step',
  // Legacy (kept so existing browsers also get cleaned up)
  'blessbox_onboarding_email',
  'blessbox_onboarding_org_name',
  'blessbox_onboarding_org_id',
  'blessbox_onboarding_step',
  'blessbox_onboarding_verified',
  'blessbox_onboarding_data',
];

export function clearOnboardingStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  for (const key of ONBOARDING_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to clear localStorage key: ${key}`, error);
    }
  }
}
