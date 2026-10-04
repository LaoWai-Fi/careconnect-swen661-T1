'use strict'

// Preload script: the only bridge between the sandboxed React renderer and the
// main process. It runs with contextIsolation and sandbox enabled, so it can
// only require('electron'). It exposes a small, explicit API on
// window.careConnect; the renderer never gets ipcRenderer itself.
//
// Channel names are duplicated from channels.cjs because a sandboxed preload
// cannot require local files. test/main/preload.test.cjs keeps them in sync.

const { contextBridge, ipcRenderer } = require('electron')

const CHANNELS = {
  MENU_COMMAND: 'menu:command',
  SESSION_UPDATE: 'session:update',
  CARE_LOAD: 'care:load',
  CARE_SAVE: 'care:save',
  CARE_EXPORT: 'care:export',
  CARE_IMPORT: 'care:import',
  CARE_CLEAR: 'care:clear',
  NOTIFY: 'app:notify',
  APP_INFO: 'app:info',
}

const api = {
  platform: process.platform,

  /** Subscribe to native menu / tray commands. Returns an unsubscribe function. */
  onMenuCommand(listener) {
    if (typeof listener !== 'function') return () => undefined
    const wrapped = (_event, action) => {
      if (typeof action === 'string') listener(action)
    }
    ipcRenderer.on(CHANNELS.MENU_COMMAND, wrapped)
    return () => ipcRenderer.removeListener(CHANNELS.MENU_COMMAND, wrapped)
  },

  setSession(info) {
    ipcRenderer.send(CHANNELS.SESSION_UPDATE, info)
  },

  loadCareData: () => ipcRenderer.invoke(CHANNELS.CARE_LOAD),
  saveCareData: (data) => ipcRenderer.invoke(CHANNELS.CARE_SAVE, data),
  exportCareData: (data) => ipcRenderer.invoke(CHANNELS.CARE_EXPORT, data),
  importCareData: () => ipcRenderer.invoke(CHANNELS.CARE_IMPORT),
  clearCareData: () => ipcRenderer.invoke(CHANNELS.CARE_CLEAR),
  notify: (title, body) => ipcRenderer.invoke(CHANNELS.NOTIFY, title, body),
  getAppInfo: () => ipcRenderer.invoke(CHANNELS.APP_INFO),
}

contextBridge.exposeInMainWorld('careConnect', Object.freeze(api))

// Exported for unit tests (module exists in Node and in Electron's sandboxed preload wrapper).
if (typeof module !== 'undefined') module.exports = { api, CHANNELS }
