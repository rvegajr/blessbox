/**
 * Normalize an email address for case-insensitive identity.
 * Trims whitespace and lowercases; returns empty string for falsy input.
 */
export function normalizeEmail(email: string | null | undefined): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}


