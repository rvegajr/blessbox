import { describe, it, expect, afterEach } from 'vitest';
import { squareEnv, squareGatewayBaseUrl, sendgridRelayBaseUrl } from './gatewayConfig';

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
