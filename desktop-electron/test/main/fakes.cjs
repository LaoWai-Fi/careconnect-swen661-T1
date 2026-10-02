'use strict'

// Lightweight stand-ins for Electron objects so main-process code can run
// under Jest without launching Electron.

const { EventEmitter } = require('node:events')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

class FakeIpcMain extends EventEmitter {
  constructor() {
    super()
    this.handlers = new Map()
  }
  handle(channel, fn) {
    if (this.handlers.has(channel)) throw new Error('Handler already registered: ' + channel)
    this.handlers.set(channel, fn)
  }
  removeHandler(channel) {
    this.handlers.delete(channel)
  }
  /** Simulates ipcRenderer.invoke arriving from a renderer. */
  invoke(channel, event, ...args) {
    const fn = this.handlers.get(channel)
    if (!fn) return Promise.reject(new Error('No handler for ' + channel))
    return Promise.resolve(fn(event, ...args))
  }
}

class FakeWebContents extends EventEmitter {
  constructor(url = 'file:///app/dist/index.html') {
    super()
    this.url = url
    this.sent = []
    this.windowOpenHandler = null
  }
  getURL() {
    return this.url
  }
  send(channel, ...args) {
    this.sent.push([channel, ...args])
  }
  setWindowOpenHandler(fn) {
    this.windowOpenHandler = fn
  }
}

class FakeWindow extends EventEmitter {
  constructor(options = {}) {
    super()
    this.options = options
    this.bounds = { x: options.x ?? 10, y: options.y ?? 10, width: options.width ?? 1440, height: options.height ?? 900 }
    this.maximized = false
    this.minimized = false
    this.destroyed = false
    this.visible = false
    this.focused = false
    this.title = options.title || ''
    this.webContents = new FakeWebContents()
    this.loaded = null
  }
  getBounds() { return { ...this.bounds } }
  getNormalBounds() { return { ...this.bounds } }
  setBounds(b) { this.bounds = { ...this.bounds, ...b }; this.emit('resize') }
  isMaximized() { return this.maximized }
  maximize() { this.maximized = true; this.emit('maximize') }
  unmaximize() { this.maximized = false; this.emit('unmaximize') }
  isMinimized() { return this.minimized }
  minimize() { this.minimized = true }
  restore() { this.minimized = false }
  isDestroyed() { return this.destroyed }
  show() { this.visible = true }
  focus() { this.focused = true }
  setTitle(t) { this.title = t }
  loadFile(file) { this.loaded = { file }; this.webContents.url = pathToFileURL(file).href; return Promise.resolve() }
  loadURL(url) { this.loaded = { url }; this.webContents.url = url; return Promise.resolve() }
  close() { this.emit('close'); this.destroyed = true; this.emit('closed') }
}

function trustedEvent(win) {
  return { sender: win.webContents, senderFrame: { url: win.webContents.getURL() } }
}

function tempDir(prefix = 'cc-test-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix))
}

const oneDisplay = { getAllDisplays: () => [{ workArea: { x: 0, y: 0, width: 1920, height: 1080 } }] }

class FakeTray extends EventEmitter {
  constructor(icon) {
    super()
    this.icon = icon
    this.tooltip = ''
    this.menu = null
    this.destroyed = false
  }
  setToolTip(t) { this.tooltip = t }
  setContextMenu(m) { this.menu = m }
  destroy() { this.destroyed = true }
}

/** A fake of the parts of the electron module that main.cjs uses. */
function createFakeElectron({ userData, packaged = false, singleInstance = true, notificationsSupported = true } = {}) {
  const windows = []
  const shown = []
  class BrowserWindow extends FakeWindow {
    constructor(options) {
      super(options)
      windows.push(this)
      this.on('closed', () => windows.splice(windows.indexOf(this), 1))
    }
    static getAllWindows() { return [...windows] }
  }
  class Notification extends EventEmitter {
    constructor(options) { super(); this.options = options }
    show() { shown.push(this) }
    static isSupported() { return notificationsSupported }
  }
  const app = Object.assign(new EventEmitter(), {
    isPackaged: packaged,
    paths: { userData, documents: userData },
    readyResolve: null,
    setPath: jest.fn(function (name, value) { app.paths[name] = value }),
    getPath: (name) => app.paths[name],
    setName: jest.fn(),
    setAppUserModelId: jest.fn(),
    requestSingleInstanceLock: jest.fn(() => singleInstance),
    quit: jest.fn(),
    getVersion: () => '0.8.0',
    disableHardwareAcceleration: jest.fn(),
    setBadgeCount: jest.fn(),
    whenReady: () => Promise.resolve(),
  })
  const menus = []
  const electron = {
    app,
    BrowserWindow,
    Notification,
    Tray: FakeTray,
    Menu: {
      buildFromTemplate: (template) => ({ template }),
      setApplicationMenu: (menu) => menus.push(menu),
    },
    ipcMain: new FakeIpcMain(),
    dialog: { showSaveDialog: jest.fn(), showOpenDialog: jest.fn(), showMessageBox: jest.fn().mockResolvedValue({ response: 0 }) },
    screen: oneDisplay,
    shell: { openExternal: jest.fn() },
    nativeImage: { createFromPath: (p) => ({ path: p }) },
    session: { defaultSession: { setPermissionRequestHandler: jest.fn(), setPermissionCheckHandler: jest.fn() } },
  }
  return { electron, windows, menus, shown, currentMenu: () => menus[menus.length - 1] }
}

module.exports = { FakeTray, createFakeElectron, FakeIpcMain, FakeWebContents, FakeWindow, trustedEvent, tempDir, oneDisplay }
