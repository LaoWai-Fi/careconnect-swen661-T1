'use strict'

const { EventEmitter } = require('node:events')
const { setupAutoUpdates } = require('../../electron/updater.cjs')

const quietLogger = { warn: jest.fn() }

test('auto-update is off in development', () => {
  expect(setupAutoUpdates({ app: { isPackaged: false }, logger: quietLogger, env: {} })).toEqual({ enabled: false })
})

test('auto-update can be disabled with an environment variable', () => {
  expect(setupAutoUpdates({ app: { isPackaged: true }, logger: quietLogger, env: { CARECONNECT_DISABLE_UPDATES: '1' } })).toEqual({ enabled: false })
})

test('packaged builds check GitHub Releases for updates', async () => {
  const updater = Object.assign(new EventEmitter(), { checkForUpdatesAndNotify: jest.fn().mockResolvedValue(null) })
  const result = setupAutoUpdates({ app: { isPackaged: true }, loadUpdater: () => updater, logger: quietLogger, env: {} })
  await result.check
  expect(result.enabled).toBe(true)
  expect(updater.autoDownload).toBe(true)
  expect(updater.checkForUpdatesAndNotify).toHaveBeenCalled()
  updater.emit('error', new Error('offline'))
  expect(quietLogger.warn).toHaveBeenCalledWith('[updates]', 'offline')
})

test('update failures are logged, not thrown', async () => {
  const logger = { warn: jest.fn() }
  const updater = Object.assign(new EventEmitter(), { checkForUpdatesAndNotify: jest.fn().mockRejectedValue(new Error('no release')) })
  const result = setupAutoUpdates({ app: { isPackaged: true }, loadUpdater: () => updater, logger, env: {} })
  await result.check
  expect(logger.warn).toHaveBeenCalledWith('[updates] check failed:', 'no release')
})

test('a missing electron-updater module disables updates', () => {
  const logger = { warn: jest.fn() }
  const result = setupAutoUpdates({ app: { isPackaged: true }, loadUpdater: () => { throw new Error('not found') }, logger, env: {} })
  expect(result).toEqual({ enabled: false })
})
