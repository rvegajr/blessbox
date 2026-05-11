'use client';
import { useEffect, useRef, useState } from 'react';
import { getPublicEnvBoolean } from '@/lib/utils/env';

/**
 * Traklet QA testing widget with top-right positioning.
 *
 * The GitHub PAT is NEVER exposed to the browser. Instead, we point the
 * Traklet GitHub adapter at our server-side proxy (`/api/dev/traklet-proxy`)
 * which attaches the real `TRAKLET_PAT` before forwarding to api.github.com.
 *
 * Env-var read is routed through `getPublicEnvBoolean` so trailing newlines
 * or surrounding quotes from .env files / Vercel UI pastes don't break the
 * boolean comparison silently. Mismatches are logged via `[env]` warnings.
 */
export function TrakletDevWidget() {
  const instanceRef = useRef<{ destroy: () => void } | null>(null);
  const initRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pass the literal `process.env.NEXT_PUBLIC_*` so Next.js inlines it at
  // build time; the helper takes care of sanitization at runtime.
  const enabled = getPublicEnvBoolean(
    process.env.NEXT_PUBLIC_TRAKLET_ENABLED,
    'NEXT_PUBLIC_TRAKLET_ENABLED',
  );

  useEffect(() => {
    if (!enabled || initRef.current) {
      setIsLoading(false);
      return;
    }
    initRef.current = true;

    // Resolve an absolute baseUrl (Traklet's zod schema requires .url()).
    const origin =
      typeof window !== 'undefined' ? window.location.origin : '';
    const proxyBaseUrl = `${origin}/api/dev/traklet-proxy`;

    (async () => {
      try {
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
        setIsLoading(false);
        
        // Position Traklet widget in top-right corner
        if (typeof document !== 'undefined') {
          const style = document.createElement('style');
          style.textContent = `
            [data-traklet-root] {
              position: fixed !important;
              top: 20px !important;
              right: 20px !important;
              z-index: 9999 !important;
            }
          `;
          document.head.appendChild(style);
        }
      } catch (err) {
        console.error('[Traklet] Failed to load:', err);
        setError(err instanceof Error ? err.message : 'Failed to load');
        setIsLoading(false);
      }
    })();

    return () => {
      instanceRef.current?.destroy();
      instanceRef.current = null;
      initRef.current = false;
    };
  }, [enabled]);

  if (enabled) {
    return (
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9998,
          pointerEvents: 'none',
        }}
      >
        {isLoading && (
          <div
            style={{
              padding: '8px 12px',
              background: '#3b82f6',
              color: 'white',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            Loading QA Tools...
          </div>
        )}
        {error && (
          <div
            style={{
              padding: '8px 12px',
              background: '#ef4444',
              color: 'white',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            QA Tools: {error}
          </div>
        )}
      </div>
    );
  }

  return null;
}
