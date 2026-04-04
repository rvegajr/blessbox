'use client';
import { useEffect, useRef } from 'react';

export function TrakletDevWidget() {
  const instanceRef = useRef<{ destroy: () => void } | null>(null);
  const initRef = useRef(false);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_TRAKLET_PAT;
    if (!token || process.env.NEXT_PUBLIC_TRAKLET_ENABLED !== 'true' || initRef.current) {
      return;
    }
    initRef.current = true;

    (async () => {
      const { Traklet } = await import('traklet');
      instanceRef.current = await Traklet.init({
        adapter: 'github',
        token,
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
