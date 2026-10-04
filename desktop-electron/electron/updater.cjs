'use strict'

// Auto-update through electron-updater and GitHub Releases (see "publish" in
// package.json). It only runs in a packaged build, never during development or
// tests, and any failure (offline, no release published yet, unsigned build)
// is logged rather than shown as an error to the caregiver.

function setupAutoUpdates({ app, loadUpdater = () => require('electron-updater').autoUpdater, logger = console, env = process.env }) {
  if (!app.isPackaged || env.CARECONNECT_DISABLE_UPDATES === '1') return { enabled: false }
  let autoUpdater
  try {
    autoUpdater = loadUpdater()
  } catch (error) {
    logger.warn('[updates] electron-updater unavailable:', error.message)
    return { enabled: false }
  }
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.on('error', (error) => logger.warn('[updates]', error && error.message))
  const check = Promise.resolve()
    .then(() => autoUpdater.checkForUpdatesAndNotify())
    .catch((error) => logger.warn('[updates] check failed:', error && error.message))
  return { enabled: true, check }
}

module.exports = { setupAutoUpdates }
