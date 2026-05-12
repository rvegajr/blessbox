'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * Traklet QA testing widget (v0.1.7) with top-right positioning.
 * GitHub PAT is proxied server-side via /api/dev/traklet-proxy.
 * Renders nothing while loading — Traklet mounts its own UI once ready.
 */
export function TrakletDevWidget() {
  const instanceRef = useRef<{ destroy: () => void } | null>(null);
  const initRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const enabled = process.env.NEXT_PUBLIC_TRAKLET_ENABLED?.trim() === 'true';

  useEffect(() => {
    if (!enabled || initRef.current) return;
    initRef.current = true;

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const proxyBaseUrl = `${origin}/api/dev/traklet-proxy`;

    (async () => {
      try {
        const { Traklet } = await import('traklet');
        instanceRef.current = await Traklet.init({
          adapter: 'github',
          // Token required by Traklet schema but never sent to GitHub —
          // the proxy strips this header and substitutes the server-side TRAKLET_PAT.
          token: 'proxy',
          baseUrl: proxyBaseUrl,
          projects: [{ id: 'rvegajr/blessbox', name: 'BlessBox' }],
        });

        // Pin Traklet's self-mounted widget to the top-right corner.
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
      }
    })();

    return () => {
      instanceRef.current?.destroy();
      instanceRef.current = null;
      initRef.current = false;
    };
  }, [enabled]);

  // While loading: render nothing visible — Traklet mounts its own widget once ready.
  // Only surface an error if something actually broke (dev console also gets it).
  if (enabled && error) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9998,
          padding: '8px 12px',
          background: '#ef4444',
          color: 'white',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 500,
        }}
      >
        Traklet failed to load: {error}
      </div>
    );
  }

  return null;
}
