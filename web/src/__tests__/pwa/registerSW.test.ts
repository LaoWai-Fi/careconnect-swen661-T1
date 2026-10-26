import { registerServiceWorker } from '../../pwa/registerSW';

type Env = { PROD: boolean; BASE_URL: string };
const env = () => (globalThis as unknown as { __VITE_ENV__: Env }).__VITE_ENV__;

function installServiceWorkerMock() {
  const register = jest.fn().mockResolvedValue({
    waiting: null,
    installing: null,
    addEventListener: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
  });
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: { register, controller: null, addEventListener: jest.fn() },
  });
  Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
  return register;
}

describe('registerServiceWorker', () => {
  afterEach(() => {
    env().PROD = false;
    env().BASE_URL = '/';
  });

  it('does nothing outside production builds', () => {
    const register = installServiceWorkerMock();
    registerServiceWorker();
    expect(register).not.toHaveBeenCalled();
  });

  it('registers sw.js under the configured base in production', async () => {
    env().PROD = true;
    env().BASE_URL = '/careconnect-swen661-T1/';
    const register = installServiceWorkerMock();
    registerServiceWorker();
    await Promise.resolve();
    expect(register).toHaveBeenCalledWith('/careconnect-swen661-T1/sw.js', { updateViaCache: 'none' });
  });

  it('skips registration on an insecure origin', () => {
    env().PROD = true;
    const register = installServiceWorkerMock();
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: false });
    registerServiceWorker();
    expect(register).not.toHaveBeenCalled();
  });
});

describe('service worker update flow', () => {
  type Listener = () => void;
  function mockRegistration(overrides: Record<string, unknown> = {}) {
    const listeners: Record<string, Listener[]> = {};
    const registration = {
      waiting: null as unknown,
      installing: null as unknown,
      addEventListener: (type: string, fn: Listener) => { (listeners[type] ||= []).push(fn); },
      update: jest.fn().mockResolvedValue(undefined),
      ...overrides,
    };
    return { registration, listeners };
  }
  function mockServiceWorker(registration: unknown, controller: unknown = {}) {
    const swListeners: Record<string, Listener[]> = {};
    const register = jest.fn().mockResolvedValue(registration);
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { register, controller, addEventListener: (t: string, fn: Listener) => { (swListeners[t] ||= []).push(fn); } },
    });
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
    return { register, swListeners };
  }
  const flush = () => new Promise(resolve => setTimeout(resolve, 0));

  beforeEach(() => { jest.resetModules(); env().PROD = true; });
  afterEach(() => { env().PROD = false; jest.restoreAllMocks(); });

  it('announces a waiting worker and applies the update on request', async () => {
    const waiting = { postMessage: jest.fn() };
    const { registration } = mockRegistration({ waiting });
    mockServiceWorker(registration);
    const mod = await import('../../pwa/registerSW');
    const heard = jest.fn();
    window.addEventListener(mod.UPDATE_EVENT, heard);
    mod.registerServiceWorker();
    await flush();
    expect(heard).toHaveBeenCalled();
    expect(mod.getWaitingUpdate()).toBe(registration);
    mod.applyUpdate();
    expect(waiting.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    window.removeEventListener(mod.UPDATE_EVENT, heard);
  });

  it('does nothing when no update is waiting', async () => {
    const { registration } = mockRegistration();
    mockServiceWorker(registration);
    const mod = await import('../../pwa/registerSW');
    mod.registerServiceWorker();
    await flush();
    expect(mod.getWaitingUpdate()).toBeNull();
    expect(() => mod.applyUpdate()).not.toThrow();
  });

  it('announces an update found after registration', async () => {
    const { registration, listeners } = mockRegistration();
    mockServiceWorker(registration);
    const mod = await import('../../pwa/registerSW');
    mod.registerServiceWorker();
    await flush();
    const stateListeners: Listener[] = [];
    const installing = { state: 'installed', addEventListener: (_: string, fn: Listener) => stateListeners.push(fn) };
    registration.installing = installing;
    registration.waiting = { postMessage: jest.fn() };
    listeners.updatefound.forEach(fn => fn());
    stateListeners.forEach(fn => fn());
    expect(mod.getWaitingUpdate()).toBe(registration);
  });

  it('checks for updates when the tab becomes visible again', async () => {
    const { registration } = mockRegistration();
    mockServiceWorker(registration);
    const mod = await import('../../pwa/registerSW');
    mod.registerServiceWorker();
    await flush();
    document.dispatchEvent(new Event('visibilitychange'));
    expect(registration.update).toHaveBeenCalled();
  });

  it('warns and keeps working when registration fails', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { register } = mockServiceWorker({});
    register.mockRejectedValue(new Error('blocked'));
    const mod = await import('../../pwa/registerSW');
    mod.registerServiceWorker();
    await flush();
    expect(warn).toHaveBeenCalled();
  });

  it('waits for the load event when the document is still loading', async () => {
    const { registration } = mockRegistration();
    const { register } = mockServiceWorker(registration);
    Object.defineProperty(document, 'readyState', { configurable: true, get: () => 'loading' });
    const mod = await import('../../pwa/registerSW');
    mod.registerServiceWorker();
    expect(register).not.toHaveBeenCalled();
    window.dispatchEvent(new Event('load'));
    await flush();
    expect(register).toHaveBeenCalled();
    Object.defineProperty(document, 'readyState', { configurable: true, get: () => 'complete' });
  });
});
