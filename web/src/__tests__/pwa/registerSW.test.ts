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
