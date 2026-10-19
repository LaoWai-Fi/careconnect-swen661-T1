import { useEffect, useState } from 'react';
import { applyUpdate, getWaitingUpdate, UPDATE_EVENT } from '../pwa/registerSW';

export default function PwaStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  const [update, setUpdate] = useState(Boolean(getWaitingUpdate()));
  useEffect(() => {
    const network = () => setOnline(navigator.onLine);
    const available = () => setUpdate(true);
    window.addEventListener('online', network);
    window.addEventListener('offline', network);
    window.addEventListener(UPDATE_EVENT, available);
    return () => {
      window.removeEventListener('online', network);
      window.removeEventListener('offline', network);
      window.removeEventListener(UPDATE_EVENT, available);
    };
  }, []);
  return (
    <>
      <div role="status" aria-label="Connection status" aria-live="polite" aria-atomic="true">
        {!online && <div className="pwa-status"><p>You’re offline. The demo care plan works on this device. Changes stay here and are not synced to a server.</p></div>}
      </div>
      {update && <section className="pwa-update" aria-labelledby="pwa-update-heading">
        <h2 id="pwa-update-heading" className="text-lg">An update is ready</h2>
        <p role="status" aria-live="polite">Finish editing before reloading to use the new version.</p>
        <div className="pwa-update-actions">
          <button type="button" className="btn-primary" onClick={applyUpdate}>Reload to update</button>
          <button type="button" className="btn-secondary" onClick={() => setUpdate(false)}>Later</button>
        </div>
      </section>}
    </>
  );
}
