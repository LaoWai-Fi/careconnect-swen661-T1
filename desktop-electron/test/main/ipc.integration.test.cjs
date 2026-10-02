'use strict'

// Integration test: the real preload bridge talking to the real main-process
// IPC handlers, menu and file store. Only the Electron transport is faked:
// ipcRenderer.invoke/send are routed into ipcMain as if they came from the
// main window, and webContents.send is routed back to ipcRenderer listeners.

const fs = require('node:fs')
const path = require('node:path')
const { EventEmitter } = require('node:events')
const { bootstrap } = require('../../electron/main.cjs')
const { CHANNELS } = require('../../electron/channels.cjs')
const { createFakeElectron, trustedEvent, tempDir } = require('./fakes.cjs')

async function connect() {
  const userData = tempDir()
  const fake = createFakeElectron({ userData })
  const ctx = bootstrap(fake.electron, { env: { CARECONNECT_USER_DATA: userData }, platform: 'win32', logger: { warn() {}, error() {} } })
  await ctx.ready
  const win = fake.windows[0]
  const { ipcMain } = fake.electron

  const ipcRenderer = Object.assign(new EventEmitter(), {
    invoke: (channel, ...args) => ipcMain.invoke(channel, trustedEvent(win), ...args),
    send: (channel, ...args) => ipcMain.emit(channel, trustedEvent(win), ...args),
  })
  // main -> renderer
  win.webContents.send = (channel, ...args) => ipcRenderer.emit(channel, {}, ...args)

  let api
  jest.isolateModules(() => {
    jest.doMock('electron', () => ({
      contextBridge: { exposeInMainWorld: (_key, value) => { api = value } },
      ipcRenderer,
    }))
    require('../../electron/preload.cjs')
  })
  return { api, ctx, fake, win, userData }
}

const label = (item) => String(item.label || item.role).replace('&', '')

describe('IPC integration: renderer bridge <-> main process', () => {
  test('save from the renderer writes care-data.json; load reads it back', async () => {
    const { api, userData } = await connect()
    const plan = { version: 1, ownerName: 'Jane Roe', medications: [] }
    const saved = await api.saveCareData(plan)
    expect(saved.ok).toBe(true)
    expect(JSON.parse(fs.readFileSync(path.join(userData, 'care-data.json'), 'utf8'))).toEqual(plan)
    await expect(api.loadCareData()).resolves.toEqual({ ok: true, data: plan })
  })

  test('signing in (setSession) enables the native menu; a menu click reaches the renderer', async () => {
    const { api, fake } = await connect()
    const received = []
    api.onMenuCommand((action) => received.push(action))

    api.setSession({ signedIn: true, userName: 'Jane Roe', unread: 1, nextMedication: null })
    const view = fake.currentMenu().template.find((m) => label(m) === 'View').submenu
    const overview = view.find((i) => label(i) === 'Overview')
    expect(overview.enabled).toBe(true)
    overview.click()
    view.find((i) => label(i) === 'Zoom in').click()
    expect(received).toEqual(['dashboard', 'zoomIn'])
  })

  test('tray quick actions travel the same path as menu commands', async () => {
    const { api, ctx } = await connect()
    const received = []
    api.onMenuCommand((action) => received.push(action))
    api.setSession({ signedIn: true, userName: 'Jane', unread: 0, nextMedication: 'Metformin at 12:30 pm' })
    const trayMenu = ctx.tray.tray.menu.template
    expect(trayMenu[2].label).toBe('Next medication: Metformin at 12:30 pm')
    trayMenu.find((i) => i.label === 'Record check-in').click()
    expect(received).toEqual(['checkin'])
  })

  test('export and import go through native dialogs', async () => {
    const { api, fake, userData } = await connect()
    const file = path.join(userData, 'exported.json')
    fake.electron.dialog.showSaveDialog.mockResolvedValue({ canceled: false, filePath: file })
    await expect(api.exportCareData({ version: 1, ownerName: 'A' })).resolves.toEqual({ ok: true, filePath: file })
    fake.electron.dialog.showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [file] })
    await expect(api.importCareData()).resolves.toEqual({ ok: true, data: { version: 1, ownerName: 'A' }, filePath: file })
  })

  test('notifications and app info round-trip', async () => {
    const { api, fake } = await connect()
    await expect(api.notify('Check-in recorded', 'At 9:00 AM')).resolves.toBe(true)
    expect(fake.shown).toHaveLength(1)
    await expect(api.getAppInfo()).resolves.toMatchObject({ name: 'CareConnect', version: '0.8.0', platform: 'win32' })
  })

  test('calls from a foreign page are refused by the main process', async () => {
    const { fake } = await connect()
    const foreign = { sender: { getURL: () => 'https://evil.example' }, senderFrame: { url: 'https://evil.example' } }
    await expect(fake.electron.ipcMain.invoke(CHANNELS.CARE_LOAD, foreign)).resolves.toEqual({ ok: false, error: 'Request rejected' })
  })
})
