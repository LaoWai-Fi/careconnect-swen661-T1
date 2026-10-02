'use strict'

// Security hardening that follows the Electron security checklist:
// https://www.electronjs.org/docs/latest/tutorial/security

// Only these sites may be opened, and only in the user's default browser.
const EXTERNAL_ALLOWLIST = ['github.com', 'www.nvaccess.org', 'www.electronjs.org']

/** webPreferences used for every window. */
function secureWebPreferences(preloadPath) {
  return {
    preload: preloadPath,
    contextIsolation: true,
    nodeIntegration: false,
    nodeIntegrationInWorker: false,
    sandbox: true,
    webSecurity: true,
    allowRunningInsecureContent: false,
    webviewTag: false,
    spellcheck: true,
  }
}

function isAllowedExternalUrl(url) {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && EXTERNAL_ALLOWLIST.includes(parsed.hostname)
  } catch {
    return false
  }
}

/**
 * True when a URL is the app's own page: the packaged index.html (file://) or
 * the Vite dev server origin when CARECONNECT_DEV_URL is set.
 */
function isAppUrl(url, { indexFileUrl, devUrl }) {
  if (!url) return false
  try {
    const target = new URL(url)
    if (devUrl) {
      const dev = new URL(devUrl)
      if (target.origin === dev.origin) return true
    }
    if (indexFileUrl) {
      const index = new URL(indexFileUrl)
      return target.protocol === 'file:' && target.pathname === index.pathname
    }
    return false
  } catch {
    return false
  }
}

/** IPC guard: only the main window's own top frame may call the main process. */
function isTrustedSender(event, { getWindow, indexFileUrl, devUrl }) {
  const win = getWindow()
  if (!win || win.isDestroyed()) return false
  if (event.sender !== win.webContents) return false
  const frameUrl = event.senderFrame ? event.senderFrame.url : event.sender.getURL()
  return isAppUrl(frameUrl, { indexFileUrl, devUrl })
}

/** Blocks navigation away from the app, pop-up windows and <webview>. */
function hardenWebContents(contents, { indexFileUrl, devUrl, openExternal }) {
  contents.on('will-navigate', (event, url) => {
    if (!isAppUrl(url, { indexFileUrl, devUrl })) event.preventDefault()
  })
  contents.on('will-attach-webview', (event) => event.preventDefault())
  contents.setWindowOpenHandler(({ url }) => {
    if (isAllowedExternalUrl(url)) openExternal(url)
    return { action: 'deny' }
  })
}

/** Denies every web permission request (camera, microphone, geolocation, ...). */
function lockDownSession(session) {
  session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false))
  session.setPermissionCheckHandler(() => false)
}

module.exports = {
  EXTERNAL_ALLOWLIST,
  secureWebPreferences,
  isAllowedExternalUrl,
  isAppUrl,
  isTrustedSender,
  hardenWebContents,
  lockDownSession,
}
