'use client';

import { useEffect, useRef } from 'react';

/**
 * Trap focus inside a container while `active` is true.
 *
 * Behavior:
 * - On activation, focus moves to the first focusable element inside.
 * - Tab / Shift+Tab cycle within the container.
 * - On deactivation, focus is restored to whatever was focused before.
 * - Escape key invokes the optional `onEscape` callback.
 *
 * Attach the returned ref to the modal/dialog root element.
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(
  active: boolean,
  onEscape?: () => void
) {
  const containerRef = useRef<T | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    previouslyFocusedRef.current = (typeof document !== 'undefined'
      ? (document.activeElement as HTMLElement | null)
      : null);

    const container = containerRef.current;
    if (!container) return;

    const getFocusable = (): HTMLElement[] => {
      const selector =
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
      return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
        (el) => !el.hasAttribute('aria-hidden') && el.offsetParent !== null
      );
    };

    // Initial focus
    const focusables = getFocusable();
    const first = focusables[0];
    if (first) first.focus();
    else container.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault();
        onEscape();
        return;
      }
      if (e.key !== 'Tab') return;
      const f = getFocusable();
      if (f.length === 0) {
        e.preventDefault();
        return;
      }
      const first = f[0];
      const last = f[f.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !container.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      const prev = previouslyFocusedRef.current;
      if (prev && typeof prev.focus === 'function') {
        try { prev.focus(); } catch (_) { /* noop */ }
      }
    };
  }, [active, onEscape]);

  return containerRef;
}

export default useFocusTrap;
