'use strict'

const path = require('node:path')
const { CHANNELS } = require('./channels.cjs')
const { validatePayload, MAX_BYTES } = require('./careStore.cjs')

// All main-process IPC handlers live here. Each handler:
//   1. rejects calls that do not come from the app's own window (isTrusted),
//   2. validates its arguments, and
//   3. returns a plain { ok, ... } object instead of throwing, so the renderer
//      can always show a useful message.

const UNTRUSTED = Object.freeze({ ok: false, error: 'Request rejected' })
const MAX_TEXT = 200

function cleanText(value, max = MAX_TEXT) {
  // Stripping control characters is the whole point of this regex.
  // eslint-disable-next-line no-control-regex
  return typeof value === 'string' ? value.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max) : ''
}

/** Sanitises the session summary the renderer sends for the menu and tray. */
function parseSession(info) {
  if (!info || typeof info !== 'object') return null
  const unread = Number.isInteger(info.unread) && info.unread >= 0 ? Math.min(info.unread, 999) : 0
  return {
    signedIn: info.signedIn === true,
    userName: cleanText(info.userName, 80),
    unread,
    nextMedication: info.nextMedication ? cleanText(info.nextMedication, 120) : null,
  }
}

function exportFileName(now = new Date()) {
  return 'careconnect-care-plan-' + now.toISOString().slice(0, 10) + '.json'
}

function registerIpcHandlers({
  ipcMain,
  isTrusted,
  store,
  dialog,
  fs,
  getWindow,
  documentsDir,
  notify,
  appInfo,
  onSession,
}) {
  const handle = (channel, fn) =>
    ipcMain.handle(channel, async (event, ...args) => {
      if (!isTrusted(event)) return UNTRUSTED
      try {
        return await fn(...args)
      } catch (error) {
        return { ok: false, error: error && error.message ? error.message : 'Unexpected error' }
      }
    })

  handle(CHANNELS.CARE_LOAD, () => store.load())
  handle(CHANNELS.CARE_SAVE, (data) => store.save(data))
  handle(CHANNELS.CARE_CLEAR, () => store.clear())

  handle(CHANNELS.CARE_EXPORT, async (data) => {
    const check = validatePayload(data)
    if (!check.ok) return check
    const result = await dialog.showSaveDialog(getWindow(), {
      title: 'Export care plan',
      defaultPath: path.join(documentsDir, exportFileName()),
      filters: [{ name: 'CareConnect care plan', extensions: ['json'] }],
    })
    if (result.canceled || !result.filePath) return { ok: false, canceled: true }
    await fs.writeFile(result.filePath, check.json, 'utf8')
    return { ok: true, filePath: result.filePath }
  })

  handle(CHANNELS.CARE_IMPORT, async () => {
    const result = await dialog.showOpenDialog(getWindow(), {
      title: 'Import care plan',
      defaultPath: documentsDir,
      properties: ['openFile'],
      filters: [{ name: 'CareConnect care plan', extensions: ['json'] }],
    })
    const filePath = result.filePaths && result.filePaths[0]
    if (result.canceled || !filePath) return { ok: false, canceled: true }
    const stat = await fs.stat(filePath)
    if (stat.size > MAX_BYTES) return { ok: false, error: 'File is larger than 5 MB' }
    const text = await fs.readFile(filePath, 'utf8')
    try {
      return { ok: true, data: JSON.parse(text), filePath }
    } catch {
      return { ok: false, error: path.basename(filePath) + ' is not valid JSON' }
    }
  })

  handle(CHANNELS.NOTIFY, (title, body) => {
    const cleanTitle = cleanText(title)
    if (!cleanTitle) return false
    return notify(cleanTitle, cleanText(body, 500))
  })

  handle(CHANNELS.APP_INFO, () => appInfo())

  const onSessionUpdate = (event, info) => {
    if (!isTrusted(event)) return
    const session = parseSession(info)
    if (session) onSession(session)
  }
  ipcMain.on(CHANNELS.SESSION_UPDATE, onSessionUpdate)

  return function unregister() {
    for (const channel of [
      CHANNELS.CARE_LOAD,
      CHANNELS.CARE_SAVE,
      CHANNELS.CARE_CLEAR,
      CHANNELS.CARE_EXPORT,
      CHANNELS.CARE_IMPORT,
      CHANNELS.NOTIFY,
      CHANNELS.APP_INFO,
    ]) {
      ipcMain.removeHandler(channel)
    }
    ipcMain.removeListener(CHANNELS.SESSION_UPDATE, onSessionUpdate)
  }
}

module.exports = { registerIpcHandlers, parseSession, cleanText, exportFileName, UNTRUSTED }
