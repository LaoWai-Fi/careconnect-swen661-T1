import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href]:not([inert]),button:not([disabled]):not([inert]),input:not([disabled]):not([inert]),select:not([disabled]):not([inert]),textarea:not([disabled]):not([inert]),[tabindex]:not([tabindex="-1"]):not([inert])';

function getFocusable(el: HTMLElement): HTMLElement[] {
  return Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
}

/**
 * Traps keyboard focus inside `containerRef` while `open` is true.
 * - On open: moves focus to the first focusable child (or the container itself).
 * - Tab / Shift+Tab cycle only among elements inside the container.
 * - Escape calls `onClose`.
 * - On close (or unmount): restores focus to the element that was active when the
 *   dialog opened.
 */
export function useFocusTrap(open: boolean, onClose: () => void) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;

    const trigger = document.activeElement as HTMLElement | null;
    const container = containerRef.current;
    if (!container) return;

    // Focus first focusable element after the browser has painted
    // (unless a field inside already took focus, e.g. via autoFocus).
    requestAnimationFrame(() => {
      if (container.contains(document.activeElement)) return;
      const els = getFocusable(container);
      (els[0] ?? container).focus();
    });

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const els = getFocusable(container!);
      if (!els.length) return;
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus when dialog closes or component unmounts
      if (trigger) requestAnimationFrame(() => trigger.focus());
    };
  }, [open]);

  return containerRef;
}
