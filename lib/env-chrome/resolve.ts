import type { AppEnv } from './chrome';

const SYNONYMS: Record<string, AppEnv> = {
  production: 'production',
  prod: 'production',
  uat: 'uat',
  staging: 'uat',
  qa: 'uat',
  preview: 'uat',
  dev: 'dev',
  development: 'dev',
  local: 'local',
  test: 'local',
  'development-local': 'local',
};

export function normalizeEnv(raw: string | undefined | null): AppEnv {
  if (raw === undefined || raw === null) return 'unknown';
  const s = String(raw).trim().toLowerCase();
  if (!s) return 'unknown';
  return SYNONYMS[s] ?? 'unknown';
}

/**
 * Server-side env detection. Reads `process.env` in priority order:
 * APP_ENV → VERCEL_ENV → RAILWAY_ENVIRONMENT → NODE_ENV → 'local'.
 * Never returns 'unknown' — 'unknown' falls back to 'local' so a misconfigured
 * server still gets a slate banner instead of no signal at all.
 */
export function resolveServerEnv(): AppEnv {
  const raw =
    process.env.APP_ENV ||
    process.env.VERCEL_ENV ||
    process.env.RAILWAY_ENVIRONMENT ||
    process.env.NODE_ENV ||
    'local';
  const normalized = normalizeEnv(raw);
  return normalized === 'unknown' ? 'local' : normalized;
}

/**
 * True only in the production *environment*. Use this — NOT
 * `NODE_ENV === 'production'` — to gate environment-specific behaviour:
 * Vercel builds every deployment (dev, uat, prod) with `NODE_ENV=production`,
 * so `NODE_ENV` cannot distinguish dev/uat from prod. `resolveServerEnv()`
 * reads `APP_ENV` first and can.
 */
export function isProductionEnv(): boolean {
  return resolveServerEnv() === 'production';
}
