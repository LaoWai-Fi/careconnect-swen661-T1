import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export function SkipLink() {
  return <a className="skip-link" href="#main-content" onClick={(event) => {
    const main = document.getElementById('main-content');
    if (main) { event.preventDefault(); main.tabIndex = -1; main.focus(); main.scrollIntoView({ block: 'start' }); }
  }}>Skip to main content</a>;
}

export default function RouteAccessibility() {
  const { pathname } = useLocation();
  const previousPath = useRef(pathname);
  useEffect(() => {
    const shouldFocus = previousPath.current !== pathname;
    previousPath.current = pathname;
    const frame = requestAnimationFrame(() => {
      const heading = document.querySelector<HTMLElement>('main h1');
      document.title = `${heading?.textContent?.trim() || 'CareConnect'} | CareConnect`;
      if (shouldFocus && heading && !document.querySelector('dialog[open]')) {
        heading.tabIndex = -1;
        heading.focus();
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);
  return null;
}
