import { useCallback } from 'react';

export function useTapRipple() {
  return useCallback((e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const span = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    span.style.cssText = `
      position:absolute;width:${size}px;height:${size}px;
      border-radius:50%;background:rgba(255,255,255,0.35);
      left:${e.clientX - rect.left - size / 2}px;
      top:${e.clientY - rect.top - size / 2}px;
      pointer-events:none;
    `;
    span.className = 'ripple-anim';
    el.style.position = 'relative';
    el.style.overflow = 'hidden';
    el.appendChild(span);
    setTimeout(() => span.remove(), 500);
  }, []);
}
