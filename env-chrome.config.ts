import type { HostRule } from '@/lib/env-chrome/chrome';

/**
 * BlessBox-specific hostname → environment rules for the shared env-chrome
 * pattern. See `/Users/admin/.claude/plans/lovely-bouncing-pelican.md` for the
 * spec these follow.
 */
export const HOST_RULES: readonly HostRule[] = [
  [/^dev\.blessbox\.org$/i, 'dev'],
  [/^uat\.blessbox\.org$/i, 'uat'],
  [/^(www\.)?blessbox\.org$/i, 'production'],
  [/^(localhost|127\.0\.0\.1|\[::1\])$/i, 'local'],
];
