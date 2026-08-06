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

/**
 * Where captured dev email lands. On the `dev` environment the relay routes
 * outbound mail to a smtp4dev sink (nothing is delivered); this is its web UI,
 * deep-linked to the BlessBox mailbox. Only meaningful on `dev` — `uat`
 * delivers real `[UAT]`-tagged mail via SendGrid, so there is nothing to view.
 */
export const DEV_MAIL_URL = 'https://mailpit.dev.noctusoft.com/#/BlessBox';
