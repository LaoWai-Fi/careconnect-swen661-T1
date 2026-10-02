'use strict'

// Electron main process: the composition root.
//
// The main process owns everything that touches the operating system (windows,
// native menu, tray, notifications, file system, auto-update). The React UI
// runs in a sandboxed renderer and reaches the main process only through the
// preload bridge and the IPC handlers in ipc.cjs.
//
// bootstrap() takes the electron module as a parameter so the Jest tests can
// start the whole main process against a fake Electron.

const path = require('node:path')
const fs = require('node:fs')
const { pathToFileURL } = require('node:url')
const { CHANNELS, MENU_ACTIONS } = require('./channels.cjs')
const { buildMenuTemplate } = require('./menu.cjs')
const { createWindowStateStore } = require('./windowState.cjs')
const { createCareStore } = require('./careStore.cjs')
const { registerIpcHandlers } = require('./ipc.cjs')
const { createTrayController } = require('./tray.cjs')
const { setupAutoUpdates } = require('./updater.cjs')
const security = require('./security.cjs')

const APP_ID = 'edu.umgc.swen661.careconnect'
const APP_NAME = 'CareConnect'
const ISSUES_URL = 'https://github.com/LaoWai-Fi/careconnect-swen661-T1/issues'

function bootstrap(electron, { env = process.env, platform = process.platform, logger = console } = {}) {
  const { app, BrowserWindow, Menu, Tray, Notification, ipcMain, dialog, screen, shell, nativeImage, session } = electron

  const isMac = platform === 'darwin'
  const devUrl = env.CARECONNECT_DEV_URL || ''
  const isDev = !app.isPackaged || Boolean(devUrl)
  const indexFile = path.join(__dirname, '..', 'dist', 'index.html')
  const indexFileUrl = pathToFileURL(indexFile).href
  const preloadPath = path.join(__dirname, 'preload.cjs')
  const assetsDir = path.join(__dirname, '..', 'assets')

  const ctx = { mainWindow: null, tray: null, session: { signedIn: false, userName: '', unread: 0, nextMedication: null }, quitting: false }

  // Tests and the e2e smoke run use their own profile folder.
  if (env.CARECONNECT_USER_DATA) app.setPath('userData', env.CARECONNECT_USER_DATA)
  if (env.CARECONNECT_DISABLE_GPU === '1') app.disableHardwareAcceleration()
  app.setName(APP_NAME)
  if (platform === 'win32') app.setAppUserModelId(APP_ID) // required for Windows toast notifications
  if (isMac) {
    // Backs the native "About CareConnect" item in the macOS app menu.
    app.setAboutPanelOptions({
      applicationName: APP_NAME,
      applicationVersion: app.getVersion(),
      copyright: 'Copyright 2026 SWEN 661 Team 1',
      credits: 'SWEN 661 Team 1. Sample data only; CareConnect cannot place emergency calls.',
    })
  }

  // Only one CareConnect window: a second launch focuses the first one.
  if (!app.requestSingleInstanceLock()) {
    app.quit()
    return ctx
  }

  const getWindow = () => ctx.mainWindow

  function showWindow() {
    const win = getWindow()
    if (!win || win.isDestroyed()) {
      createWindow()
      return
    }
    if (win.isMinimized()) win.restore()
    win.show()
    win.focus()
  }

  function sendCommand(action) {
    const win = getWindow()
    if (!MENU_ACTIONS.includes(action) || !win || win.isDestroyed()) return false
    win.webContents.send(CHANNELS.MENU_COMMAND, action)
    return true
  }

  function showAbout() {
    const info = appInfo()
    return dialog.showMessageBox(getWindow(), {
      type: 'info',
      title: 'About ' + APP_NAME,
      message: APP_NAME + ' ' + info.version,
      detail:
        'Caregiver coordination desktop app (SWEN 661 Team 1).\nElectron ' + info.electron + ' on ' + info.platform +
        '.\n\nSample data only. CareConnect cannot place emergency calls.',
      buttons: ['OK'],
    })
  }

  function appInfo() {
    return {
      name: APP_NAME,
      version: app.getVersion(),
      platform,
      electron: process.versions.electron || 'unknown',
    }
  }

  function refreshMenu() {
    const template = buildMenuTemplate({
      send: sendCommand,
      signedIn: ctx.session.signedIn,
      isMac,
      isDev,
      onAbout: showAbout,
      onReportIssue: () => shell.openExternal(ISSUES_URL),
      appName: APP_NAME,
    })
    Menu.setApplicationMenu(Menu.buildFromTemplate(template))
  }

  function notify(title, body) {
    if (!Notification.isSupported()) return false
    const note = new Notification({ title, body, silent: false })
    note.on('click', showWindow)
    note.show()
    return true
  }

  function onSession(next) {
    ctx.session = next
    refreshMenu()
    if (ctx.tray) ctx.tray.update(next)
    const win = getWindow()
    if (win && !win.isDestroyed()) {
      // The title is read by screen readers and shown on the taskbar.
      win.setTitle(next.signedIn && next.unread > 0 ? APP_NAME + ' (' + next.unread + ' unread)' : APP_NAME)
    }
    if (typeof app.setBadgeCount === 'function') app.setBadgeCount(next.signedIn ? next.unread : 0)
  }

  function createWindow() {
    const windowState = createWindowStateStore({ dir: app.getPath('userData'), fs, screen })
    const saved = windowState.load()
    const iconPath = path.join(assetsDir, 'icon.png')
    const win = new BrowserWindow({
      x: saved.x,
      y: saved.y,
      width: saved.width,
      height: saved.height,
      minWidth: 900,
      minHeight: 600,
      show: false,
      title: APP_NAME,
      backgroundColor: '#f0f4f7',
      icon: fs.existsSync(iconPath) ? iconPath : undefined,
      autoHideMenuBar: false,
      webPreferences: security.secureWebPreferences(preloadPath),
    })
    ctx.mainWindow = win
    if (saved.isMaximized) win.maximize()
    windowState.track(win)

    security.hardenWebContents(win.webContents, { indexFileUrl, devUrl, openExternal: (url) => shell.openExternal(url) })
    win.on('page-title-updated', (event) => event.preventDefault())
    win.once('ready-to-show', () => {
      if (env.CARECONNECT_HIDDEN !== '1') win.show()
    })
    win.webContents.on('render-process-gone', (_event, details) => {
      logger.error('[main] renderer exited:', details && details.reason)
    })
    win.on('closed', () => {
      if (ctx.mainWindow === win) ctx.mainWindow = null
    })

    const load = devUrl ? win.loadURL(devUrl) : win.loadFile(indexFile)
    Promise.resolve(load).catch((error) => logger.error('[main] failed to load UI:', error && error.message))
    return win
  }

  function createTray() {
    const trayIcon = path.join(assetsDir, isMac ? 'trayTemplate.png' : 'tray.png')
    if (!fs.existsSync(trayIcon) || env.CARECONNECT_NO_TRAY === '1') return null
    try {
      return createTrayController({
        Tray,
        Menu,
        icon: nativeImage.createFromPath(trayIcon),
        onShow: showWindow,
        onCommand: sendCommand,
        onQuit: () => {
          ctx.quitting = true
          app.quit()
        },
      })
    } catch (error) {
      logger.warn('[main] tray unavailable:', error.message)
      return null
    }
  }

  app.on('second-instance', showWindow)
  app.on('web-contents-created', (_event, contents) => {
    contents.on('will-attach-webview', (event) => event.preventDefault())
  })
  app.on('window-all-closed', () => {
    if (!isMac) app.quit()
  })
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
  app.on('before-quit', () => {
    ctx.quitting = true
  })

  ctx.ready = app.whenReady().then(() => {
    security.lockDownSession(session.defaultSession)
    const store = createCareStore({ dir: app.getPath('userData'), fs: fs.promises })
    ctx.unregisterIpc = registerIpcHandlers({
      ipcMain,
      isTrusted: (event) => security.isTrustedSender(event, { getWindow, indexFileUrl, devUrl }),
      store,
      dialog,
      fs: fs.promises,
      getWindow,
      documentsDir: app.getPath('documents'),
      notify,
      appInfo,
      onSession,
    })
    refreshMenu()
    createWindow()
    ctx.tray = createTray()
    ctx.updates = setupAutoUpdates({ app, logger, env })
  })

  ctx.sendCommand = sendCommand
  ctx.showWindow = showWindow
  ctx.onSession = onSession
  ctx.notify = notify
  ctx.refreshMenu = refreshMenu
  return ctx
}

module.exports = { bootstrap, APP_ID, APP_NAME }

// Start automatically when Electron runs this file. (Electron does not set
// require.main for the entry script, so check for the Electron runtime instead;
// under Jest process.versions.electron is undefined and nothing starts.)
if (process.versions.electron) {
  bootstrap(require('electron'))
}
