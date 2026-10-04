// Typed access to the API that electron/preload.cjs exposes on window.careConnect.
//
// The renderer never imports Electron or Node modules. Everything that needs the
// operating system (files, menus, notifications, tray) goes through this narrow
// bridge, which the preload script builds with contextBridge. When the React
// app runs in a plain browser (npm run dev without Electron, or in Jest) the
// bridge is absent and getDesktop() returns null, so every caller degrades to
// browser-only behaviour.

export interface SessionInfo {
  signedIn: boolean
  userName: string
  unread: number
  nextMedication: string | null
}

export type Result<T extends object = object> =
  | ({ ok: true } & T)
  | { ok: false; canceled?: boolean; error?: string }

export interface AppInfo {
  name: string
  version: string
  platform: string
  electron: string
}

export interface CareConnectBridge {
  platform: string
  onMenuCommand: (listener: (action: string) => void) => () => void
  setSession: (info: SessionInfo) => void
  loadCareData: () => Promise<Result<{ data: unknown | null }>>
  saveCareData: (data: unknown) => Promise<Result<{ savedAt: string }>>
  exportCareData: (data: unknown) => Promise<Result<{ filePath: string }>>
  importCareData: () => Promise<Result<{ data: unknown; filePath: string }>>
  clearCareData: () => Promise<Result>
  notify: (title: string, body: string) => Promise<boolean>
  getAppInfo: () => Promise<AppInfo>
}

declare global {
  interface Window {
    careConnect?: CareConnectBridge
  }
}

export function getDesktop(): CareConnectBridge | null {
  if (typeof window === "undefined") return null
  return window.careConnect ?? null
}

export function isDesktop(): boolean {
  return getDesktop() !== null
}

/** File name only, for status messages (never show full paths in the UI). */
export function baseName(filePath: string): string {
  const parts = filePath.split(/[\\/]/)
  return parts[parts.length - 1] || filePath
}
