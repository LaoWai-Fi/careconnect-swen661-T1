'use strict'

// Native application menu (File, Edit, View, Help).
//
// buildMenuTemplate() is a pure function so it can be unit tested without
// Electron. Items that act on the care plan are sent to the renderer as
// "menu commands" over IPC; standard editing items use Electron roles so the
// operating system provides native cut/copy/paste behaviour and screen reader
// support. On Windows and Linux the & in a label marks the Alt mnemonic
// (Alt+F opens File, and so on).

const NAV_ITEMS = [
  { label: '&Overview', action: 'dashboard', accelerator: 'CmdOrCtrl+1' },
  { label: '&Medications', action: 'medications', accelerator: 'CmdOrCtrl+2' },
  { label: '&Appointments', action: 'appointments', accelerator: 'CmdOrCtrl+3' },
  { label: 'Ac&tivity', action: 'activity', accelerator: 'CmdOrCtrl+4' },
  { label: 'M&essages', action: 'messages', accelerator: 'CmdOrCtrl+5' },
]

/**
 * @param {object} options
 * @param {(action: string) => void} options.send  forwards a command to the renderer
 * @param {boolean} options.signedIn  enables care-plan items only after sign-in
 * @param {boolean} options.isMac
 * @param {boolean} options.isDev  adds Reload / Developer Tools
 * @param {() => void} options.onAbout
 * @param {() => void} options.onReportIssue
 * @param {string} options.appName
 */
function buildMenuTemplate({ send, signedIn, isMac, isDev, onAbout, onReportIssue, appName = 'CareConnect' }) {
  const cmd = (label, action, accelerator, extra = {}) => ({
    label,
    accelerator,
    enabled: signedIn,
    click: () => send(action),
    ...extra,
  })

  const template = []

  if (isMac) {
    template.push({
      label: appName,
      submenu: [
        { label: 'About ' + appName, click: onAbout },
        { type: 'separator' },
        cmd('Settings…', 'settings', 'CmdOrCtrl+,'),
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    })
  }

  template.push({
    label: '&File',
    submenu: [
      cmd('&New message', 'compose', 'CmdOrCtrl+N'),
      { type: 'separator' },
      cmd('&Save care plan', 'save', 'CmdOrCtrl+S'),
      cmd('&Export care plan…', 'export', 'CmdOrCtrl+E'),
      cmd('&Import care plan…', 'import', 'CmdOrCtrl+O'),
      { type: 'separator' },
      cmd('&Print…', 'print', 'CmdOrCtrl+P'),
      ...(isMac ? [] : [{ type: 'separator' }, cmd('Se&ttings', 'settings', 'CmdOrCtrl+,')]),
      { type: 'separator' },
      cmd('Sign &out', 'signout'),
      ...(isMac ? [{ type: 'separator' }, { role: 'close' }] : [{ type: 'separator' }, { role: 'quit', label: 'E&xit' }]),
    ],
  })

  template.push({
    label: '&Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'selectAll' },
      { type: 'separator' },
      cmd('&Find in CareConnect', 'search', 'CmdOrCtrl+F'),
    ],
  })

  template.push({
    label: '&View',
    submenu: [
      ...NAV_ITEMS.map((item) => cmd(item.label, item.action, item.accelerator)),
      { type: 'separator' },
      cmd('Zoom &in', 'zoomIn', 'CmdOrCtrl+='),
      cmd('Zoom o&ut', 'zoomOut', 'CmdOrCtrl+-'),
      cmd('Actual &size', 'zoomReset', 'CmdOrCtrl+0'),
      { type: 'separator' },
      cmd('&Left-hand mode', 'toggleHandMode', 'CmdOrCtrl+Shift+L'),
      cmd('&High contrast', 'highContrast', 'CmdOrCtrl+Shift+H'),
      { type: 'separator' },
      { role: 'togglefullscreen' },
      ...(isDev ? [{ type: 'separator' }, { role: 'reload' }, { role: 'toggleDevTools' }] : []),
    ],
  })

  if (isMac) {
    template.push({ role: 'windowMenu' })
  }

  template.push({
    label: '&Help',
    submenu: [
      { label: '&Keyboard shortcuts', accelerator: 'F1', click: () => send('shortcuts') },
      { label: 'CareConnect &help', click: () => send('help') },
      { type: 'separator' },
      { label: '&Report an issue…', click: onReportIssue },
      ...(isMac ? [] : [{ type: 'separator' }, { label: '&About ' + appName, click: onAbout }]),
    ],
  })

  return template
}

/** Flattens a template into the menu items that carry an action, for tests and docs. */
function listShortcuts(template) {
  const rows = []
  const walk = (items, menu) => {
    for (const item of items) {
      if (item.submenu) walk(item.submenu, item.label || item.role)
      else if (item.accelerator) rows.push({ menu: String(menu).replace('&', ''), label: String(item.label).replace('&', ''), accelerator: item.accelerator })
    }
  }
  walk(template, '')
  return rows
}

module.exports = { buildMenuTemplate, listShortcuts, NAV_ITEMS }
