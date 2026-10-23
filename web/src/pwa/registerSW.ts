let waitingRegistration: ServiceWorkerRegistration | null = null;
let reloadRequested = false;
export const UPDATE_EVENT = 'careconnect:pwa-update';
export function getWaitingUpdate() { return waitingRegistration; }
export function applyUpdate() {
  if (!waitingRegistration?.waiting) return;
  reloadRequested = true;
  waitingRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
}

export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator) || !window.isSecureContext) return;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadRequested) window.location.reload();
  });
  const register = async () => {
    try {
      const registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { updateViaCache: 'none' });
      const announce = () => {
        if (registration.waiting && navigator.serviceWorker.controller) {
          waitingRegistration = registration;
          window.dispatchEvent(new Event(UPDATE_EVENT));
        }
      };
      announce();
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => { if (worker.state === 'installed') announce(); });
      });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && navigator.onLine) void registration.update().catch(() => {});
      });
    } catch (error) {
      console.warn('Offline support is unavailable for this visit.', error);
    }
  };
  if (document.readyState === 'complete') void register();
  else window.addEventListener('load', () => void register(), { once: true });
}
