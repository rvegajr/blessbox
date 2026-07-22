'use client';

import { useEffect } from 'react';
import { applyEnvChrome, envFromHost, type AppEnv, type HostRule } from './chrome';

/**
 * Mount once in `app/layout.tsx`. Renders no DOM itself — it applies the
 * banner/title/favicon chrome via DOM mutation on mount.
 *
 * `env` is the server-authoritative value (from `resolveServerEnv()`). We also
 * do an instant hostname guess before hydration for zero-flicker first paint,
 * then reconcile if the server disagrees.
 */
export function EnvChrome({
  env,
  hostRules,
}: {
  env: AppEnv;
  hostRules: readonly HostRule[];
}) {
  useEffect(() => {
    // Instant hostname-based first paint (before we trust the server value).
    const instant = envFromHost(location.hostname, hostRules);
    applyEnvChrome(instant);
    // Reconcile with the server value if it differs.
    if (env !== instant) applyEnvChrome(env);
  }, [env, hostRules]);

  return null;
}
