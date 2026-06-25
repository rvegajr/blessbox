/**
 * testLoginPolicy — pure, side-effect-free decision for the /api/test/login route.
 *
 * Security context: the route can mint a session JWT. In production it must NEVER
 * mint superadmin/admin and must restrict logins to a fixed allow-list (a leaked
 * shared secret previously granted superadmin over every org). Kept pure so it is
 * unit-testable under vitest (lib/**) and the route stays a thin consumer.
 */

export interface TestLoginPolicyInput {
  isProd: boolean;
  email: string;
  admin: boolean;
  /** Allowed emails in production (e.g. parsed from QA_TEST_LOGIN_ALLOWED_EMAILS). */
  allowList: string[];
  requestedTtlSeconds?: number;
}

export interface TestLoginPolicyDecision {
  allowed: boolean;
  role: 'superadmin' | 'user';
  ttlSeconds: number;
  error?: string;
}

const DEFAULT_TTL_SECONDS = 3600; // 1h dev default
const PROD_MAX_TTL_SECONDS = 900; // 15m hard cap in production

export function decideTestLogin(input: TestLoginPolicyInput): TestLoginPolicyDecision {
  const requested = input.requestedTtlSeconds && input.requestedTtlSeconds > 0
    ? input.requestedTtlSeconds
    : DEFAULT_TTL_SECONDS;

  if (!input.isProd) {
    // Local/dev convenience preserved: admin requests may mint superadmin.
    return {
      allowed: true,
      role: input.admin ? 'superadmin' : 'user',
      ttlSeconds: requested,
    };
  }

  // Production policy.
  if (input.admin) {
    return { allowed: false, role: 'user', ttlSeconds: 0, error: 'admin login is not permitted in production' };
  }

  const normalized = input.email.trim().toLowerCase();
  const allowed = input.allowList.map((e) => e.trim().toLowerCase()).includes(normalized);
  if (!allowed) {
    return { allowed: false, role: 'user', ttlSeconds: 0, error: 'email is not on the production test-login allow-list' };
  }

  return {
    allowed: true,
    role: 'user', // never superadmin in production
    ttlSeconds: Math.min(requested, PROD_MAX_TTL_SECONDS),
  };
}
