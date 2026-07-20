/**
 * gatewayConfig — single source of truth for Noctusoft gateway routing.
 *
 * Every Square/SendGrid call goes through the Noctusoft relay (a drop-in proxy
 * that holds the upstream credentials). Previously each service re-derived the
 * prod-vs-sandbox host from SQUARE_ENVIRONMENT independently, and they DRIFTED:
 * some used `process.env.SQUARE_ENVIRONMENT === 'production'` (case-sensitive, no
 * trim) while others used `getEnv(...).toLowerCase()`. A value like "Production"
 * or " production " would route the SDK + health probe to prod but the order
 * verifier + checkout to sandbox — a silent split-brain in production. This
 * module centralizes the decision so every path agrees, using the lenient
 * (sanitized + lowercased) interpretation everywhere.
 */
import { getEnv } from '../utils/env';

export type SquareEnv = 'production' | 'sandbox';

const SQUARE_PROD_HOST = 'connect.squareup.noctusoft.com';
const SQUARE_SANDBOX_HOST = 'connect.squareupsandbox.noctusoft.com';
const SENDGRID_RELAY_DEFAULT = 'https://api.sendgrid.noctusoft.com';

/** Canonical Square environment label — trims + lowercases SQUARE_ENVIRONMENT. */
export function squareEnv(): SquareEnv {
  return getEnv('SQUARE_ENVIRONMENT', 'sandbox').toLowerCase() === 'production'
    ? 'production'
    : 'sandbox';
}

/** Square API proxy base URL (no trailing slash) for the given/active environment. */
export function squareGatewayBaseUrl(env: SquareEnv = squareEnv()): string {
  return `https://${env === 'production' ? SQUARE_PROD_HOST : SQUARE_SANDBOX_HOST}`;
}

/** SendGrid relay base URL — honours SENDGRID_API_URL override; no trailing slash. */
export function sendgridRelayBaseUrl(): string {
  return (getEnv('SENDGRID_API_URL') || SENDGRID_RELAY_DEFAULT).replace(/\/$/, '');
}

/** The single gateway credential — the relay holds the upstream Square/SendGrid keys. */
export function gatewayDeployKey(): string {
  return getEnv('NOCTUSOFT_DEPLOY_KEY');
}

/**
 * Whether ANY gateway credential is available: a Vercel OIDC identity (present
 * on every Vercel deployment once OIDC federation is enabled) or the static
 * NOCTUSOFT_DEPLOY_KEY fallback. Use this for "is the gateway configured?"
 * gating instead of checking the deploy key directly.
 */
export function hasGatewayAuth(): boolean {
  return !!(process.env.VERCEL_OIDC_TOKEN || process.env.VERCEL || gatewayDeployKey());
}

/**
 * Bearer credential for the relay. Prefers the deployment's Vercel OIDC token
 * (short-lived, never stored, nothing to leak or rotate) and falls back to
 * NOCTUSOFT_DEPLOY_KEY for local dev and non-Vercel environments. The relay
 * accepts both (OIDC is verified against the team's JWKS).
 */
export async function gatewayAuthToken(): Promise<string | null> {
  if (process.env.VERCEL_OIDC_TOKEN || process.env.VERCEL) {
    try {
      const { getVercelOidcToken } = await import('@vercel/oidc');
      const token = await getVercelOidcToken();
      if (token) return token;
    } catch {
      // OIDC unavailable (federation disabled or token expired) — fall through.
    }
  }
  return gatewayDeployKey() || null;
}
