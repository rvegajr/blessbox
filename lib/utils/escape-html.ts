/**
 * Escape a value for safe interpolation into an HTML context.
 *
 * Use for any user-controlled value (org name, email, participant fields, …)
 * substituted into an HTML email or page fragment. Do NOT use for the plain-text
 * branch of an email — there is no HTML context there to inject into.
 */
export function escapeHtml(input: unknown): string {
  const s = input == null ? '' : String(input);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
