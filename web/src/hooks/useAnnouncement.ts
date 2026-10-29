import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Text for a polite status region (role="status"). The text is cleared and set again after a short delay.
 * When a dialog closes, focus moves back to the page and the screen reader speaks the newly focused element;
 * a message set at the same moment is easily dropped or talked over in Safari with VoiceOver, so the
 * announcement is made once focus has settled.
 */
export function useAnnouncement(delayMs = 600) {
  const [message, setMessage] = useState('');
  const timer = useRef<number | undefined>(undefined);
  const announce = useCallback((text: string) => {
    window.clearTimeout(timer.current);
    setMessage('');
    timer.current = window.setTimeout(() => setMessage(text), delayMs);
  }, [delayMs]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return [message, announce] as const;
}
