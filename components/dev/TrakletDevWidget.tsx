'use client';
import { useEffect, useRef } from 'react';

/**
 * Dev-only Traklet widget loader.
 *
 * The GitHub PAT is NEVER exposed to the browser. Instead, we point the
 * Traklet GitHub adapter at our server-side proxy (`/api/dev/traklet-proxy`)
 * which attaches the real `TRAKLET_PAT` before forwarding to api.github.com.
 *
 * Mount is additionally hard-gated in `app/layout.tsx` by
 * `process.env.NODE_ENV !== 'production'`, so this component never renders
 * in production builds even if `NEXT_PUBLIC_TRAKLET_ENABLED` is misconfigured.
 */
export function TrakletDevWidget() {
  const instanceRef = useRef<{ destroy: () => void } | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_TRAKLET_ENABLED !== 'true' || initRef.current) {
      return;
    }
    initRef.current = true;

    // Resolve an absolute baseUrl (Traklet's zod schema requires .url()).
    const origin =
      typeof window !== 'undefined' ? window.location.origin : '';
    const proxyBaseUrl = `${origin}/api/dev/traklet-proxy`;

    (async () => {
      const { Traklet } = await import('traklet');
      instanceRef.current = await Traklet.init({
        adapter: 'github',
        // Token is required by Traklet's validator but never sent to GitHub:
        // the proxy strips this Authorization header and substitutes the
        // server-side TRAKLET_PAT.
        token: 'proxy',
        baseUrl: proxyBaseUrl,
        projects: [{ id: 'rvegajr/blessbox', name: 'BlessBox' }],
      });
    })().catch((err) => console.warn('[Traklet] Failed to load:', err));

    return () => {
      instanceRef.current?.destroy();
      instanceRef.current = null;
      initRef.current = false;
    };
  }, []);

  return null;
}
