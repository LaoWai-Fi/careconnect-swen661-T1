'use strict'

const security = require('../../electron/security.cjs')
const { FakeWindow, FakeWebContents, trustedEvent } = require('./fakes.cjs')

const indexFileUrl = 'file:///app/dist/index.html'

describe('security hardening', () => {
  test('webPreferences enable isolation and sandbox and disable Node', () => {
    const prefs = security.secureWebPreferences('/app/electron/preload.cjs')
    expect(prefs).toMatchObject({
      preload: '/app/electron/preload.cjs',
      contextIsolation: true,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      webviewTag: false,
    })
  })

  test('isAppUrl accepts only the packaged page or the dev server', () => {
    expect(security.isAppUrl('file:///app/dist/index.html#x', { indexFileUrl })).toBe(true)
    expect(security.isAppUrl('file:///etc/passwd', { indexFileUrl })).toBe(false)
    expect(security.isAppUrl('https://evil.example', { indexFileUrl })).toBe(false)
    expect(security.isAppUrl('http://127.0.0.1:5173/', { indexFileUrl, devUrl: 'http://127.0.0.1:5173' })).toBe(true)
    expect(security.isAppUrl('', { indexFileUrl })).toBe(false)
    expect(security.isAppUrl('not a url', { indexFileUrl })).toBe(false)
    expect(security.isAppUrl('file:///app/dist/index.html', {})).toBe(false)
  })

  test('external links are limited to an allowlist over https', () => {
    expect(security.isAllowedExternalUrl('https://github.com/LaoWai-Fi')).toBe(true)
    expect(security.isAllowedExternalUrl('http://github.com')).toBe(false)
    expect(security.isAllowedExternalUrl('https://example.com')).toBe(false)
    expect(security.isAllowedExternalUrl('::')).toBe(false)
  })

  test('isTrustedSender rejects other windows, other frames and closed windows', () => {
    const win = new FakeWindow()
    const getWindow = () => win
    expect(security.isTrustedSender(trustedEvent(win), { getWindow, indexFileUrl })).toBe(true)
    expect(security.isTrustedSender({ sender: new FakeWebContents(), senderFrame: { url: indexFileUrl } }, { getWindow, indexFileUrl })).toBe(false)
    expect(security.isTrustedSender({ sender: win.webContents, senderFrame: { url: 'https://evil.example' } }, { getWindow, indexFileUrl })).toBe(false)
    expect(security.isTrustedSender({ sender: win.webContents }, { getWindow, indexFileUrl })).toBe(true)
    win.destroyed = true
    expect(security.isTrustedSender(trustedEvent(win), { getWindow, indexFileUrl })).toBe(false)
    expect(security.isTrustedSender(trustedEvent(win), { getWindow: () => null, indexFileUrl })).toBe(false)
  })

  test('hardenWebContents blocks navigation, webviews and pop-ups', () => {
    const contents = new FakeWebContents()
    const openExternal = jest.fn()
    security.hardenWebContents(contents, { indexFileUrl, openExternal })

    const nav = { preventDefault: jest.fn() }
    contents.emit('will-navigate', nav, 'https://evil.example')
    expect(nav.preventDefault).toHaveBeenCalled()
    const ok = { preventDefault: jest.fn() }
    contents.emit('will-navigate', ok, indexFileUrl)
    expect(ok.preventDefault).not.toHaveBeenCalled()

    const webview = { preventDefault: jest.fn() }
    contents.emit('will-attach-webview', webview)
    expect(webview.preventDefault).toHaveBeenCalled()

    expect(contents.windowOpenHandler({ url: 'https://www.nvaccess.org/' })).toEqual({ action: 'deny' })
    expect(openExternal).toHaveBeenCalledWith('https://www.nvaccess.org/')
    expect(contents.windowOpenHandler({ url: 'https://evil.example/' })).toEqual({ action: 'deny' })
    expect(openExternal).toHaveBeenCalledTimes(1)
  })

  test('lockDownSession denies every permission', () => {
    const session = { setPermissionRequestHandler: jest.fn(), setPermissionCheckHandler: jest.fn() }
    security.lockDownSession(session)
    const callback = jest.fn()
    session.setPermissionRequestHandler.mock.calls[0][0](null, 'media', callback)
    expect(callback).toHaveBeenCalledWith(false)
    expect(session.setPermissionCheckHandler.mock.calls[0][0]()).toBe(false)
  })
})
