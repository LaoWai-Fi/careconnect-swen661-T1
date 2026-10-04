'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { EventEmitter } = require('node:events')
const { CHANNELS } = require('../../electron/channels.cjs')

function loadPreload() {
  const exposed = {}
  const ipcRenderer = Object.assign(new EventEmitter(), {
    send: jest.fn(),
    invoke: jest.fn(async (channel, ...args) => ({ channel, args })),
  })
  jest.isolateModules(() => {
    jest.doMock('electron', () => ({
      contextBridge: { exposeInMainWorld: (key, value) => { exposed[key] = value } },
      ipcRenderer,
    }))
    require('../../electron/preload.cjs')
  })
  return { api: exposed.careConnect, ipcRenderer, exposedKeys: Object.keys(exposed) }
}

describe('preload bridge', () => {
  test('exposes exactly one frozen API object named careConnect', () => {
    const { api, exposedKeys } = loadPreload()
    expect(exposedKeys).toEqual(['careConnect'])
    expect(Object.isFrozen(api)).toBe(true)
    expect(Object.keys(api).sort()).toEqual([
      'clearCareData', 'exportCareData', 'getAppInfo', 'importCareData', 'loadCareData', 'notify',
      'onMenuCommand', 'platform', 'saveCareData', 'setSession',
    ])
  })

  test('does not leak ipcRenderer or Node objects', () => {
    const { api } = loadPreload()
    for (const value of Object.values(api)) {
      expect(value).not.toHaveProperty('send')
      expect(value).not.toHaveProperty('invoke')
    }
  })

  test('channel names match electron/channels.cjs', () => {
    const { CHANNELS: preloadChannels } = (() => {
      let mod
      jest.isolateModules(() => {
        jest.doMock('electron', () => ({ contextBridge: { exposeInMainWorld() {} }, ipcRenderer: new EventEmitter() }))
        mod = require('../../electron/preload.cjs')
      })
      return mod
    })()
    expect(preloadChannels).toEqual({ ...CHANNELS })
  })

  test('preload only requires electron (sandbox compatible)', () => {
    const source = fs.readFileSync(path.join(__dirname, '../../electron/preload.cjs'), 'utf8')
    const requires = [...source.matchAll(/require\(['"]([^'"]+)['"]\)/g)].map((m) => m[1])
    expect([...new Set(requires)]).toEqual(['electron'])
  })

  test('invoke-based methods use the right channels and arguments', async () => {
    const { api, ipcRenderer } = loadPreload()
    await api.loadCareData()
    await api.saveCareData({ a: 1 })
    await api.exportCareData({ b: 2 })
    await api.importCareData()
    await api.clearCareData()
    await api.notify('T', 'B')
    await api.getAppInfo()
    expect(ipcRenderer.invoke.mock.calls).toEqual([
      [CHANNELS.CARE_LOAD],
      [CHANNELS.CARE_SAVE, { a: 1 }],
      [CHANNELS.CARE_EXPORT, { b: 2 }],
      [CHANNELS.CARE_IMPORT],
      [CHANNELS.CARE_CLEAR],
      [CHANNELS.NOTIFY, 'T', 'B'],
      [CHANNELS.APP_INFO],
    ])
  })

  test('setSession sends a one-way message', () => {
    const { api, ipcRenderer } = loadPreload()
    api.setSession({ signedIn: true })
    expect(ipcRenderer.send).toHaveBeenCalledWith(CHANNELS.SESSION_UPDATE, { signedIn: true })
  })

  test('onMenuCommand delivers string actions and can unsubscribe', () => {
    const { api, ipcRenderer } = loadPreload()
    const listener = jest.fn()
    const off = api.onMenuCommand(listener)
    ipcRenderer.emit(CHANNELS.MENU_COMMAND, {}, 'messages')
    ipcRenderer.emit(CHANNELS.MENU_COMMAND, {}, { evil: true })
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith('messages')
    off()
    ipcRenderer.emit(CHANNELS.MENU_COMMAND, {}, 'dashboard')
    expect(listener).toHaveBeenCalledTimes(1)
    expect(ipcRenderer.listenerCount(CHANNELS.MENU_COMMAND)).toBe(0)
    expect(typeof api.onMenuCommand('not a function')).toBe('function')
  })
})
