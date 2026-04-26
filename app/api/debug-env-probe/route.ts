import { NextRequest, NextResponse } from 'next/server';
import { requireDiagnosticsSecret } from '@/lib/security/diagnosticsAuth';
import { getEnv } from '@/lib/utils/env';

/**
 * One-shot debug probe to verify runtime env values match what's in Vercel storage.
 * Returns SHA-256 hash of values so we can compare without exposing secrets.
 * Gated by DIAGNOSTICS_SECRET. Safe to remove after the env-loading bug is resolved.
 */
export async function GET(req: NextRequest) {
  const gate = requireDiagnosticsSecret(req);
  if (gate) return gate;

  const crypto = await import('crypto');
  const hash = (s: string | undefined) =>
    s ? crypto.createHash('sha256').update(s).digest('hex').slice(0, 12) : null;

  const probe = (name: string) => {
    const raw = process.env[name];
    const sanitized = getEnv(name);
    return {
      raw_present: raw !== undefined,
      raw_len: raw?.length ?? 0,
      raw_endsWithNewline: raw?.endsWith('\n') ?? false,
      raw_endsWithBackslashN: raw?.endsWith('\\n') ?? false,
      raw_hash: hash(raw),
      sanitized_len: sanitized.length,
      sanitized_hash: hash(sanitized),
      diff: raw !== sanitized,
    };
  };

  return NextResponse.json({
    NODE_ENV: process.env.NODE_ENV,
    SENDGRID_API_KEY: probe('SENDGRID_API_KEY'),
    SENDGRID_FROM_EMAIL: probe('SENDGRID_FROM_EMAIL'),
    SMTP_PORT: probe('SMTP_PORT'),
    PROD_TEST_LOGIN_SECRET: probe('PROD_TEST_LOGIN_SECRET'),
    PROD_TEST_SEED_SECRET: probe('PROD_TEST_SEED_SECRET'),
    DIAGNOSTICS_TEST_RECIPIENT: probe('DIAGNOSTICS_TEST_RECIPIENT'),
    TURSO_AUTH_TOKEN: probe('TURSO_AUTH_TOKEN'),
  });
}
