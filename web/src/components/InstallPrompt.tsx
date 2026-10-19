import { useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
const DISMISS_KEY = 'careconnect_install_dismissed_until';

export default function InstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [error, setError] = useState('');
  const [installing, setInstalling] = useState(false);
  const regionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone;
    if (standalone) return;
    const offer = (candidate: Event) => {
      candidate.preventDefault();
      try { if (Number(localStorage.getItem(DISMISS_KEY)) > Date.now()) return; } catch { /* session-only storage */ }
      setEvent(candidate as BeforeInstallPromptEvent);
    };
    const installed = () => setEvent(null);
    window.addEventListener('beforeinstallprompt', offer);
    window.addEventListener('appinstalled', installed);
    return () => {
      window.removeEventListener('beforeinstallprompt', offer);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  function dismiss() {
    const containedFocus = regionRef.current?.contains(document.activeElement);
    setEvent(null);
    try { localStorage.setItem(DISMISS_KEY, String(Date.now() + 14 * 86400000)); } catch { /* optional persistence */ }
    if (containedFocus) {
      const heading = document.querySelector<HTMLElement>('main h1') || document.querySelector<HTMLElement>('main');
      if (heading) { heading.tabIndex = -1; heading.focus(); }
    }
  }
  async function install() {
    if (!event || installing) return;
    setInstalling(true);
    setError('');
    try {
      await event.prompt();
      await event.userChoice;
      dismiss();
    } catch {
      setError('Installation could not start. Try again or use your browser’s Install app menu.');
    } finally { setInstalling(false); }
  }
  if (!event) return null;
  return (
    <section ref={regionRef} className="pwa-install" aria-labelledby="install-prompt-title"
      onKeyDown={(key) => { if (key.key === 'Escape') dismiss(); }}>
      <h2 id="install-prompt-title" className="text-lg">Install CareConnect</h2>
      <p>Open your demo care plan from your home screen, including offline after the first visit.</p>
      {error && <p role="alert">{error}</p>}
      <div className="pwa-update-actions">
        <button type="button" className="btn-primary" disabled={installing} onClick={() => void install()}>
          <Download size={18} aria-hidden="true" />{installing ? 'Opening installer…' : 'Install'}
        </button>
        <button type="button" className="btn-secondary" onClick={dismiss}>Not now</button>
      </div>
    </section>
  );
}
