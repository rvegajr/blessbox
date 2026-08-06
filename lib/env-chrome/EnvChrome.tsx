'use client';

import { useEffect } from 'react';
import { applyEnvChrome, type AppEnv } from './chrome';

/**
 * Mount once in `app/layout.tsx`. Renders no DOM itself — it applies the
 * banner/title/favicon chrome via DOM mutation on mount.
 *
 * `env` is the server-authoritative value (from `resolveServerEnv()`), passed
 * as a plain string so it serializes across the server→client boundary. We
 * intentionally do NOT accept `HOST_RULES` here — those carry `RegExp` objects,
 * which React cannot pass from a Server Component to a Client Component. The
 * hostname mapping (`envFromHost`) stays a server/build-time concern.
 */
export function EnvChrome({ env, mailUrl }: { env: AppEnv; mailUrl?: string }) {
  useEffect(() => {
    applyEnvChrome(env, mailUrl);
  }, [env, mailUrl]);

  return null;
}
