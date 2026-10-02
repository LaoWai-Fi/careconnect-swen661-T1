'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { registerIpcHandlers, parseSession, cleanText, exportFileName, UNTRUSTED } = require('../../electron/ipc.cjs')
const { createCareStore } = require('../../electron/careStore.cjs')
const { CHANNELS } = require('../../electron/channels.cjs')
const { FakeIpcMain, FakeWindow, FakeWebContents, trustedEvent, tempDir } = require('./fakes.cjs')

function setup(overrides = {}) {
  const dir = tempDir()
  const ipcMain = new FakeIpcMain()
  const win = new FakeWindow()
  const dialog = { showSaveDialog: jest.fn(), showOpenDialog: jest.fn() }
  const notify = jest.fn(() => true)
  const onSession = jest.fn()
  const deps = {
    ipcMain,
    isTrusted: (event) => event.sender === win.webContents,
    store: createCareStore({ dir, fs: fs.promises }),
    dialog,
    fs: fs.promises,
    getWindow: () => win,
    documentsDir: dir,
    notify,
    appInfo: () => ({ name: 'CareConnect', version: '0.8.0', platform: 'win32', electron: '44' }),
    onSession,
    ...overrides,
  }
  const unregister = registerIpcHandlers(deps)
  const call = (channel, ...args) => ipcMain.invoke(channel, trustedEvent(win), ...args)
  return { dir, ipcMain, win, dialog, notify, onSession, unregister, call }
}

describe('IPC handlers', () => {
  test('save and load the care plan', async () => {
    const { call } = setup()
    await expect(call(CHANNELS.CARE_LOAD)).resolves.toEqual({ ok: true, data: null })
    expect((await call(CHANNELS.CARE_SAVE, { version: 1, x: 1 })).ok).toBe(true)
    await expect(call(CHANNELS.CARE_LOAD)).resolves.toEqual({ ok: true, data: { version: 1, x: 1 } })
    await expect(call(CHANNELS.CARE_CLEAR)).resolves.toEqual({ ok: true })
  })

  test('requests from an untrusted sender are rejected on every channel', async () => {
    const { ipcMain, onSession } = setup()
    const stranger = { sender: new FakeWebContents('https://evil.example') }
    for (const channel of [CHANNELS.CARE_LOAD, CHANNELS.CARE_SAVE, CHANNELS.CARE_EXPORT, CHANNELS.CARE_IMPORT, CHANNELS.CARE_CLEAR, CHANNELS.NOTIFY, CHANNELS.APP_INFO]) {
      await expect(ipcMain.invoke(channel, stranger, {})).resolves.toEqual(UNTRUSTED)
    }
    ipcMain.emit(CHANNELS.SESSION_UPDATE, stranger, { signedIn: true })
    expect(onSession).not.toHaveBeenCalled()
  })

  test('export writes the care plan to the file the user picks', async () => {
    const { call, dialog, dir, win } = setup()
    const target = path.join(dir, 'plan.json')
    dialog.showSaveDialog.mockResolvedValue({ canceled: false, filePath: target })
    await expect(call(CHANNELS.CARE_EXPORT, { version: 1, a: 1 })).resolves.toEqual({ ok: true, filePath: target })
    expect(JSON.parse(fs.readFileSync(target, 'utf8'))).toEqual({ version: 1, a: 1 })
    const [parent, options] = dialog.showSaveDialog.mock.calls[0]
    expect(parent).toBe(win)
    expect(options.defaultPath).toMatch(/careconnect-care-plan-\d{4}-\d{2}-\d{2}\.json$/)
    expect(options.filters[0].extensions).toEqual(['json'])
  })

  test('export reports cancel and rejects bad payloads without opening a dialog', async () => {
    const { call, dialog } = setup()
    dialog.showSaveDialog.mockResolvedValue({ canceled: true })
    await expect(call(CHANNELS.CARE_EXPORT, { version: 1 })).resolves.toEqual({ ok: false, canceled: true })
    dialog.showSaveDialog.mockClear()
    await expect(call(CHANNELS.CARE_EXPORT, 'nope')).resolves.toMatchObject({ ok: false })
    expect(dialog.showSaveDialog).not.toHaveBeenCalled()
  })

  test('import reads and parses the chosen file', async () => {
    const { call, dialog, dir } = setup()
    const source = path.join(dir, 'in.json')
    fs.writeFileSync(source, JSON.stringify({ version: 1, b: 2 }))
    dialog.showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [source] })
    await expect(call(CHANNELS.CARE_IMPORT)).resolves.toEqual({ ok: true, data: { version: 1, b: 2 }, filePath: source })
  })

  test('import handles cancel, invalid JSON, huge files and read errors', async () => {
    const { call, dialog, dir } = setup()
    dialog.showOpenDialog.mockResolvedValue({ canceled: true, filePaths: [] })
    await expect(call(CHANNELS.CARE_IMPORT)).resolves.toEqual({ ok: false, canceled: true })

    const bad = path.join(dir, 'bad.json')
    fs.writeFileSync(bad, 'not json')
    dialog.showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [bad] })
    await expect(call(CHANNELS.CARE_IMPORT)).resolves.toEqual({ ok: false, error: 'bad.json is not valid JSON' })

    dialog.showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [path.join(dir, 'missing.json')] })
    const missing = await call(CHANNELS.CARE_IMPORT)
    expect(missing.ok).toBe(false)
    expect(missing.error).toMatch(/ENOENT|no such file/)
  })

  test('import refuses files larger than 5 MB', async () => {
    const fakeFs = { stat: async () => ({ size: 6 * 1024 * 1024 }) }
    const { call, dialog } = setup({ fs: fakeFs })
    dialog.showOpenDialog.mockResolvedValue({ canceled: false, filePaths: ['/big.json'] })
    await expect(call(CHANNELS.CARE_IMPORT)).resolves.toEqual({ ok: false, error: 'File is larger than 5 MB' })
  })

  test('notify cleans text and refuses an empty title', async () => {
    const { call, notify } = setup()
    await expect(call(CHANNELS.NOTIFY, '  Check-in\nrecorded ', 'At 9:00')).resolves.toBe(true)
    expect(notify).toHaveBeenCalledWith('Check-in recorded', 'At 9:00')
    await expect(call(CHANNELS.NOTIFY, '', 'x')).resolves.toBe(false)
    await expect(call(CHANNELS.NOTIFY, 42)).resolves.toBe(false)
  })

  test('app info is returned to the renderer', async () => {
    const { call } = setup()
    await expect(call(CHANNELS.APP_INFO)).resolves.toMatchObject({ name: 'CareConnect', version: '0.8.0' })
  })

  test('session updates are sanitised before reaching the menu/tray', () => {
    const { ipcMain, win, onSession } = setup()
    ipcMain.emit(CHANNELS.SESSION_UPDATE, trustedEvent(win), { signedIn: true, userName: 'Jane', unread: 3, nextMedication: 'Metformin' })
    expect(onSession).toHaveBeenCalledWith({ signedIn: true, userName: 'Jane', unread: 3, nextMedication: 'Metformin' })
    ipcMain.emit(CHANNELS.SESSION_UPDATE, trustedEvent(win), null)
    expect(onSession).toHaveBeenCalledTimes(1)
  })

  test('unexpected handler errors become { ok: false } results', async () => {
    const store = { load: () => { throw new Error('boom') }, save: jest.fn(), clear: jest.fn() }
    const { call } = setup({ store })
    await expect(call(CHANNELS.CARE_LOAD)).resolves.toEqual({ ok: false, error: 'boom' })
    const throwsNothing = setup({ store: { load: () => { throw null }, save() {}, clear() {} } })
    await expect(throwsNothing.call(CHANNELS.CARE_LOAD)).resolves.toEqual({ ok: false, error: 'Unexpected error' })
  })

  test('unregister removes every handler and listener', () => {
    const { ipcMain, unregister } = setup()
    unregister()
    expect(ipcMain.handlers.size).toBe(0)
    expect(ipcMain.listenerCount(CHANNELS.SESSION_UPDATE)).toBe(0)
  })
})

describe('IPC helpers', () => {
  test('parseSession clamps and cleans values', () => {
    expect(parseSession(undefined)).toBeNull()
    expect(parseSession({ signedIn: 'yes', unread: -4, userName: 5 })).toEqual({ signedIn: false, userName: '', unread: 0, nextMedication: null })
    expect(parseSession({ signedIn: true, unread: 5000, userName: 'A'.repeat(200) }).unread).toBe(999)
    expect(parseSession({ signedIn: true, unread: 1, userName: 'A'.repeat(200) }).userName).toHaveLength(80)
  })

  test('cleanText strips control characters and trims', () => {
    expect(cleanText('a\tb\u0000c ')).toBe('a b c')
    expect(cleanText(null)).toBe('')
    expect(cleanText('abcdef', 3)).toBe('abc')
  })

  test('exportFileName uses the date', () => {
    expect(exportFileName(new Date('2026-10-02T12:00:00Z'))).toBe('careconnect-care-plan-2026-10-02.json')
  })
})
