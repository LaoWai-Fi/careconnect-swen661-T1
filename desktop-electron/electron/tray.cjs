'use strict'

// System tray (Windows notification area / macOS menu bar / Linux status area).
// Shows the next medication and unread count, and offers quick actions that
// open the main window on the right page.

function buildTrayMenuTemplate({ session, onShow, onCommand, onQuit }) {
  const signedIn = Boolean(session && session.signedIn)
  const go = (action) => () => {
    onShow()
    onCommand(action)
  }
  const unread = signedIn ? session.unread : 0
  return [
    { label: 'Open CareConnect', click: onShow },
    { type: 'separator' },
    {
      label: signedIn
        ? 'Next medication: ' + (session.nextMedication || 'all taken')
        : 'Sign in to see today’s plan',
      enabled: false,
    },
    { label: unread === 1 ? '1 unread message' : unread + ' unread messages', enabled: signedIn, click: go('messages') },
    { type: 'separator' },
    { label: 'Record check-in', enabled: signedIn, click: go('checkin') },
    { label: 'Medications', enabled: signedIn, click: go('medications') },
    { label: 'Appointments', enabled: signedIn, click: go('appointments') },
    { type: 'separator' },
    { label: 'Quit CareConnect', click: onQuit },
  ]
}

function tooltipFor(session) {
  if (!session || !session.signedIn) return 'CareConnect'
  if (session.unread > 0) return 'CareConnect, ' + session.unread + ' unread'
  return 'CareConnect'
}

function createTrayController({ Tray, Menu, icon, onShow, onCommand, onQuit }) {
  const tray = new Tray(icon)
  let session = { signedIn: false, userName: '', unread: 0, nextMedication: null }

  function refresh() {
    tray.setToolTip(tooltipFor(session))
    tray.setContextMenu(Menu.buildFromTemplate(buildTrayMenuTemplate({ session, onShow, onCommand, onQuit })))
  }

  tray.on('click', onShow)
  tray.on('double-click', onShow)
  refresh()

  return {
    tray,
    update(next) {
      session = next
      refresh()
    },
    destroy() {
      tray.destroy()
    },
  }
}

module.exports = { createTrayController, buildTrayMenuTemplate, tooltipFor }
