'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { bootstrap, APP_ID } = require('../../electron/main.cjs')
const { CHANNELS } = require('../../electron/channels.cjs')
const { createFakeElectron, trustedEvent, tempDir } = require('./fakes.cjs')

const quiet = { log() {}, warn: jest.fn(), error: jest.fn() }

async function start(options = {}) {
  const userData = tempDir()
  const fake = createFakeElectron({ userData, ...options.fake })
  const ctx = bootstrap(fake.electron, {
    env: { CARECONNECT_USER_DATA: userData, ...options.env },
    platform: options.platform || 'win32',
    logger: quiet,
  })
  await ctx.ready
  return { ...fake, ctx, userData, win: fake.windows[0] }
}

const label = (item) => String(item.label || item.role).replace('&', '')
const menuItem = (menu, top, name) =>
  menu.template.find((m) => label(m) === top).submenu.find((i) => label(i) === name)

describe('main process bootstrap', () => {
  test('creates one secure window that loads the built renderer', async () => {
    const { win, electron } = await start()
    expect(win.options.webPreferences).toMatchObject({ contextIsolation: true, nodeIntegration: false, sandbox: true })
    expect(win.options.webPreferences.preload).toMatch(/preload\.cjs$/)
    expect(win.loaded.file).toMatch(/dist[\\/]index\.html$/)
    expect(win.options.minWidth).toBe(900)
    expect(electron.app.setAppUserModelId).toHaveBeenCalledWith(APP_ID)
    expect(electron.session.defaultSession.setPermissionRequestHandler).toHaveBeenCalled()
  })

  test('shows the window when ready unless running hidden', async () => {
    const { win } = await start()
    win.emit('ready-to-show')
    expect(win.visible).toBe(true)
    const hidden = await start({ env: { CARECONNECT_HIDDEN: '1' } })
    hidden.win.emit('ready-to-show')
    expect(hidden.win.visible).toBe(false)
  })

  test('loads the Vite dev server when CARECONNECT_DEV_URL is set', async () => {
    const { win, currentMenu } = await start({ env: { CARECONNECT_DEV_URL: 'http://127.0.0.1:5173' } })
    expect(win.loaded.url).toBe('http://127.0.0.1:5173')
    const viewRoles = currentMenu().template.find((m) => label(m) === 'View').submenu.map((i) => i.role)
    expect(viewRoles).toContain('toggleDevTools')
  })

  test('sets a native application menu with care items disabled before sign-in', async () => {
    const { currentMenu } = await start()
    expect(currentMenu().template.map(label)).toEqual(['File', 'Edit', 'View', 'Help'])
    expect(menuItem(currentMenu(), 'View', 'Overview').enabled).toBe(false)
  })

  test('a second instance quits and focuses the first window instead', async () => {
    const blocked = createFakeElectron({ userData: tempDir(), singleInstance: false })
    bootstrap(blocked.electron, { env: {}, platform: 'win32', logger: quiet })
    expect(blocked.electron.app.quit).toHaveBeenCalled()

    const { electron, win } = await start()
    win.minimize()
    electron.app.emit('second-instance')
    expect(win.minimized).toBe(false)
    expect(win.focused).toBe(true)
  })

  test('creates a system tray when an icon is available, and the tray quit item quits', async () => {
    const { ctx, electron } = await start()
    expect(ctx.tray).not.toBeNull()
    ctx.tray.tray.menu.template.find((i) => i.label === 'Quit CareConnect').click()
    expect(electron.app.quit).toHaveBeenCalled()
    const noTray = await start({ env: { CARECONNECT_NO_TRAY: '1' } })
    expect(noTray.ctx.tray).toBeNull()
  })

  test('session updates refresh the menu, title, tray and badge', async () => {
    const { electron, win, ctx, currentMenu } = await start()
    electron.ipcMain.emit(CHANNELS.SESSION_UPDATE, trustedEvent(win), { signedIn: true, userName: 'Jane Roe', unread: 2, nextMedication: 'Metformin at 12:30 pm' })
    expect(menuItem(currentMenu(), 'View', 'Overview').enabled).toBe(true)
    expect(win.title).toBe('CareConnect (2 unread)')
    expect(ctx.tray.tray.tooltip).toBe('CareConnect, 2 unread')
    expect(electron.app.setBadgeCount).toHaveBeenLastCalledWith(2)
    ctx.onSession({ signedIn: false, userName: '', unread: 0, nextMedication: null })
    expect(win.title).toBe('CareConnect')
  })

  test('menu clicks are forwarded to the renderer, unknown actions are dropped', async () => {
    const { win, ctx, currentMenu } = await start()
    ctx.onSession({ signedIn: true, userName: 'A', unread: 0, nextMedication: null })
    menuItem(currentMenu(), 'View', 'Messages').click()
    expect(win.webContents.sent).toContainEqual([CHANNELS.MENU_COMMAND, 'messages'])
    expect(ctx.sendCommand('rm -rf')).toBe(false)
  })

  test('Help > About shows a native dialog and Report an issue opens GitHub', async () => {
    const { electron, currentMenu } = await start()
    await menuItem(currentMenu(), 'Help', 'About CareConnect').click()
    expect(electron.dialog.showMessageBox).toHaveBeenCalled()
    expect(electron.dialog.showMessageBox.mock.calls[0][1].message).toMatch(/CareConnect 0\.8\.0/)
    menuItem(currentMenu(), 'Help', 'Report an issue…').click()
    expect(electron.shell.openExternal).toHaveBeenCalledWith(expect.stringMatching(/^https:\/\/github\.com\//))
  })

  test('notifications show natively and clicking one focuses the app', async () => {
    const { ctx, shown, win } = await start()
    expect(ctx.notify('Check-in recorded', 'At 9:00')).toBe(true)
    expect(shown[0].options).toMatchObject({ title: 'Check-in recorded', body: 'At 9:00' })
    shown[0].emit('click')
    expect(win.focused).toBe(true)
    const unsupported = await start({ fake: { notificationsSupported: false } })
    expect(unsupported.ctx.notify('x', 'y')).toBe(false)
  })

  test('window state is saved on close and restored on the next launch', async () => {
    const first = await start()
    first.win.setBounds({ x: 50, y: 40, width: 1200, height: 760 })
    first.win.close()
    expect(first.ctx.mainWindow).toBeNull()
    const saved = JSON.parse(fs.readFileSync(path.join(first.userData, 'window-state.json'), 'utf8'))
    expect(saved).toMatchObject({ x: 50, y: 40, width: 1200, height: 760 })

    const second = createFakeElectron({ userData: first.userData })
    const ctx = bootstrap(second.electron, { env: { CARECONNECT_USER_DATA: first.userData }, platform: 'win32', logger: quiet })
    await ctx.ready
    expect(second.windows[0].options).toMatchObject({ x: 50, y: 40, width: 1200, height: 760 })
  })

  test('restores a maximized window maximized', async () => {
    const userData = tempDir()
    fs.writeFileSync(path.join(userData, 'window-state.json'), JSON.stringify({ width: 1000, height: 700, isMaximized: true }))
    const fake = createFakeElectron({ userData })
    await bootstrap(fake.electron, { env: { CARECONNECT_USER_DATA: userData }, platform: 'win32', logger: quiet }).ready
    expect(fake.windows[0].maximized).toBe(true)
  })

  test('app lifecycle: quit when all windows close (not on macOS), re-create on activate', async () => {
    const win32 = await start()
    win32.electron.app.emit('window-all-closed')
    expect(win32.electron.app.quit).toHaveBeenCalled()

    const mac = await start({ platform: 'darwin' })
    mac.win.close()
    mac.electron.app.emit('window-all-closed')
    expect(mac.electron.app.quit).not.toHaveBeenCalled()
    mac.electron.app.emit('activate')
    expect(mac.windows).toHaveLength(1)
    expect(mac.currentMenu().template[0].label).toBe('CareConnect')
  })

  test('showWindow re-creates the window if it was closed', async () => {
    const { win, ctx, windows } = await start()
    win.close()
    ctx.showWindow()
    expect(windows).toHaveLength(1)
    expect(ctx.mainWindow).not.toBe(win)
  })

  test('honours the GPU switch and blocks webviews in any web contents', async () => {
    const { electron } = await start({ env: { CARECONNECT_DISABLE_GPU: '1' } })
    expect(electron.app.disableHardwareAcceleration).toHaveBeenCalled()
    const { EventEmitter } = require('node:events')
    const contents = new EventEmitter()
    electron.app.emit('web-contents-created', {}, contents)
    const event = { preventDefault: jest.fn() }
    contents.emit('will-attach-webview', event)
    expect(event.preventDefault).toHaveBeenCalled()
    electron.app.emit('before-quit')
  })

  test('logs renderer crashes and failed page loads', async () => {
    const { win } = await start()
    win.webContents.emit('render-process-gone', {}, { reason: 'crashed' })
    expect(quiet.error).toHaveBeenCalledWith('[main] renderer exited:', 'crashed')
    const failing = createFakeElectron({ userData: tempDir() })
    failing.electron.BrowserWindow.prototype.loadFile = () => Promise.reject(new Error('missing dist'))
    await bootstrap(failing.electron, { env: {}, platform: 'linux', logger: quiet }).ready
    await new Promise((r) => setImmediate(r))
    expect(quiet.error).toHaveBeenCalledWith('[main] failed to load UI:', 'missing dist')
  })
})
