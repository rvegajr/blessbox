import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import {
  squareEnv,
  squareGatewayBaseUrl,
  sendgridRelayBaseUrl,
  hasGatewayAuth,
  gatewayAuthToken,
} from './gatewayConfig';

vi.mock('@vercel/oidc', () => ({ getVercelOidcToken: vi.fn() }));
import { getVercelOidcToken } from '@vercel/oidc';

const PROD_HOST = 'https://connect.squareup.noctusoft.com';
const SANDBOX_HOST = 'https://connect.squareupsandbox.noctusoft.com';

const ORIGINAL = { ...process.env };
afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe('gatewayConfig.squareEnv', () => {
  it('defaults to sandbox when SQUARE_ENVIRONMENT is unset', () => {
    delete process.env.SQUARE_ENVIRONMENT;
    expect(squareEnv()).toBe('sandbox');
  });

  it('resolves production', () => {
    process.env.SQUARE_ENVIRONMENT = 'production';
    expect(squareEnv()).toBe('production');
  });

  // The drift fix: every gateway path must agree on the env regardless of case /
  // whitespace. Previously some services used a case-sensitive strict compare and
  // would route "Production" to sandbox while others routed it to prod.
  it('is lenient about case and surrounding whitespace', () => {
    for (const v of ['Production', 'PRODUCTION', '  production  ']) {
      process.env.SQUARE_ENVIRONMENT = v;
      expect(squareEnv()).toBe('production');
    }
  });

  it('treats any non-production value as sandbox', () => {
    for (const v of ['sandbox', 'dev', 'staging', '']) {
      process.env.SQUARE_ENVIRONMENT = v;
      expect(squareEnv()).toBe('sandbox');
    }
  });
});

describe('gatewayConfig.squareGatewayBaseUrl', () => {
  it('maps env labels to the right proxy host', () => {
    expect(squareGatewayBaseUrl('production')).toBe(PROD_HOST);
    expect(squareGatewayBaseUrl('sandbox')).toBe(SANDBOX_HOST);
  });

  it('uses the active env when no argument is given', () => {
    process.env.SQUARE_ENVIRONMENT = 'production';
    expect(squareGatewayBaseUrl()).toBe(PROD_HOST);
    process.env.SQUARE_ENVIRONMENT = 'sandbox';
    expect(squareGatewayBaseUrl()).toBe(SANDBOX_HOST);
  });
});

describe('gatewayConfig.sendgridRelayBaseUrl', () => {
  it('defaults to the Noctusoft SendGrid relay', () => {
    delete process.env.SENDGRID_API_URL;
    expect(sendgridRelayBaseUrl()).toBe('https://api.sendgrid.noctusoft.com');
  });

  it('honours SENDGRID_API_URL and strips a trailing slash', () => {
    process.env.SENDGRID_API_URL = 'https://relay.example.com/';
    expect(sendgridRelayBaseUrl()).toBe('https://relay.example.com');
  });
});

// Auth model: the app prefers its Vercel OIDC identity (nothing to leak/rotate)
// and falls back to the static NOCTUSOFT_DEPLOY_KEY for local dev / non-Vercel.
describe('gatewayConfig auth resolution', () => {
  beforeEach(() => {
    vi.mocked(getVercelOidcToken).mockReset();
    delete process.env.VERCEL;
    delete process.env.VERCEL_OIDC_TOKEN;
    delete process.env.NOCTUSOFT_DEPLOY_KEY;
  });

  describe('hasGatewayAuth', () => {
    it('is false when no OIDC identity and no deploy key', () => {
      expect(hasGatewayAuth()).toBe(false);
    });

    it('is true when a deploy key is set', () => {
      process.env.NOCTUSOFT_DEPLOY_KEY = 'nsins_dk_test';
      expect(hasGatewayAuth()).toBe(true);
    });

    it('is true on Vercel (VERCEL) even without a deploy key', () => {
      process.env.VERCEL = '1';
      expect(hasGatewayAuth()).toBe(true);
    });

    it('is true when a Vercel OIDC token is present', () => {
      process.env.VERCEL_OIDC_TOKEN = 'header.payload.sig';
      expect(hasGatewayAuth()).toBe(true);
    });
  });

  describe('gatewayAuthToken', () => {
    it('returns null when nothing is configured', async () => {
      await expect(gatewayAuthToken()).resolves.toBeNull();
    });

    it('returns the deploy key when not on Vercel', async () => {
      process.env.NOCTUSOFT_DEPLOY_KEY = 'nsins_dk_local';
      await expect(gatewayAuthToken()).resolves.toBe('nsins_dk_local');
      expect(getVercelOidcToken).not.toHaveBeenCalled();
    });

    it('prefers the Vercel OIDC token when available', async () => {
      process.env.VERCEL = '1';
      process.env.NOCTUSOFT_DEPLOY_KEY = 'nsins_dk_fallback';
      vi.mocked(getVercelOidcToken).mockResolvedValue('oidc-token-abc');
      await expect(gatewayAuthToken()).resolves.toBe('oidc-token-abc');
    });

    it('falls back to the deploy key when OIDC minting fails', async () => {
      process.env.VERCEL = '1';
      process.env.NOCTUSOFT_DEPLOY_KEY = 'nsins_dk_fallback';
      vi.mocked(getVercelOidcToken).mockRejectedValue(new Error('OIDC disabled'));
      await expect(gatewayAuthToken()).resolves.toBe('nsins_dk_fallback');
    });

    it('falls back to the deploy key when OIDC returns empty', async () => {
      process.env.VERCEL = '1';
      process.env.NOCTUSOFT_DEPLOY_KEY = 'nsins_dk_fallback';
      vi.mocked(getVercelOidcToken).mockResolvedValue('');
      await expect(gatewayAuthToken()).resolves.toBe('nsins_dk_fallback');
    });
  });
});
