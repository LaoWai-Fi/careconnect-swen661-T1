import { render, screen, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import App from "../../src/App"
import type { CareConnectBridge } from "../../src/lib/desktop"

export type FakeBridge = jest.Mocked<CareConnectBridge> & {
  /** Simulates a native menu / tray command arriving from the main process. */
  emitMenu: (action: string) => void
}

/** Installs a fake window.careConnect, the API the preload script exposes. */
export function installBridge(overrides: Partial<CareConnectBridge> = {}): FakeBridge {
  const listeners = new Set<(action: string) => void>()
  const bridge = {
    platform: "win32",
    onMenuCommand: jest.fn((listener: (action: string) => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    }),
    setSession: jest.fn(),
    loadCareData: jest.fn().mockResolvedValue({ ok: true, data: null }),
    saveCareData: jest.fn().mockResolvedValue({ ok: true, savedAt: "2026-10-02T12:00:00Z" }),
    exportCareData: jest.fn().mockResolvedValue({ ok: true, filePath: "C:\\Users\\jane\\Documents\\plan.json" }),
    importCareData: jest.fn().mockResolvedValue({ ok: false, canceled: true }),
    clearCareData: jest.fn().mockResolvedValue({ ok: true }),
    notify: jest.fn().mockResolvedValue(true),
    getAppInfo: jest.fn().mockResolvedValue({ name: "CareConnect", version: "0.8.0", platform: "win32", electron: "44" }),
    ...overrides,
  } as unknown as FakeBridge
  bridge.emitMenu = (action: string) => {
    act(() => listeners.forEach((listener) => listener(action)))
  }
  window.careConnect = bridge
  return bridge
}

export function setup() {
  const user = userEvent.setup()
  const utils = render(<App />)
  return { user, ...utils }
}

/** Landing -> Sign in -> dashboard, using the real sign-in form. */
export async function signIn(user: ReturnType<typeof userEvent.setup>, email = "jane.roe@example.com") {
  await user.click(screen.getByRole("button", { name: /sign in to your workspace/i }))
  await user.type(screen.getByLabelText(/email address/i), email)
  await user.type(screen.getByLabelText(/^password/i), "asdf")
  await user.click(screen.getByRole("button", { name: /sign in$/i }))
  await screen.findByRole("navigation", {}, { timeout: 3000 })
}

/** Clicks a sidebar navigation item (Overview, Medications, ...). */
export async function goTo(user: ReturnType<typeof userEvent.setup>, label: string) {
  const nav = screen.getByRole("navigation", { name: /main navigation/i })
  const button = Array.from(nav.querySelectorAll("button")).find((b) => b.textContent?.includes(label))
  if (!button) throw new Error("No nav item " + label)
  await user.click(button)
}
