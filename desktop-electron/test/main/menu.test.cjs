'use strict'

const { buildMenuTemplate, listShortcuts } = require('../../electron/menu.cjs')
const { MENU_ACTIONS } = require('../../electron/channels.cjs')

function build(overrides = {}) {
  const send = jest.fn()
  const onAbout = jest.fn()
  const onReportIssue = jest.fn()
  const template = buildMenuTemplate({ send, signedIn: true, isMac: false, isDev: false, onAbout, onReportIssue, ...overrides })
  return { template, send, onAbout, onReportIssue }
}

const strip = (label) => String(label).replace('&', '')
const find = (items, label) => items.find((item) => item.label && strip(item.label) === label)

describe('native menu template', () => {
  test('Windows/Linux menu bar has File, Edit, View and Help with Alt mnemonics', () => {
    const { template } = build()
    expect(template.map((m) => m.label)).toEqual(['&File', '&Edit', '&View', '&Help'])
  })

  test('macOS adds the app menu and Window menu', () => {
    const { template } = build({ isMac: true })
    expect(template[0].label).toBe('CareConnect')
    expect(template.some((m) => m.role === 'windowMenu')).toBe(true)
    const file = find(template, 'File').submenu
    expect(file.some((i) => i.role === 'close')).toBe(true)
    expect(find(file, 'Settings')).toBeUndefined()
  })

  test('every keyboard shortcut from the design is a menu accelerator', () => {
    const { template } = build()
    const accelerators = listShortcuts(template).map((row) => row.accelerator)
    for (const key of ['CmdOrCtrl+1', 'CmdOrCtrl+2', 'CmdOrCtrl+3', 'CmdOrCtrl+4', 'CmdOrCtrl+5', 'CmdOrCtrl+F',
      'CmdOrCtrl+,', 'CmdOrCtrl+=', 'CmdOrCtrl+-', 'CmdOrCtrl+0', 'CmdOrCtrl+N', 'CmdOrCtrl+S', 'CmdOrCtrl+P', 'F1',
      'CmdOrCtrl+E', 'CmdOrCtrl+O', 'CmdOrCtrl+Shift+L', 'CmdOrCtrl+Shift+H']) {
      expect(accelerators).toContain(key)
    }
    expect(new Set(accelerators).size).toBe(accelerators.length)
  })

  test('clicking a menu item forwards its command to the renderer', () => {
    const { template, send } = build()
    find(find(template, 'View').submenu, 'Medications').click()
    find(find(template, 'File').submenu, 'Export care plan…').click()
    find(find(template, 'Help').submenu, 'Keyboard shortcuts').click()
    find(find(template, 'Help').submenu, 'CareConnect help').click()
    expect(send.mock.calls.map((c) => c[0])).toEqual(['medications', 'export', 'shortcuts', 'help'])
  })

  test('all commands sent by the menu are known actions', () => {
    const { template, send } = build()
    const walk = (items) => items.forEach((item) => {
      if (item.submenu) walk(item.submenu)
      else if (typeof item.click === 'function' && !/About|Report/.test(item.label)) item.click()
    })
    walk(template)
    for (const [action] of send.mock.calls) expect(MENU_ACTIONS).toContain(action)
  })

  test('care-plan commands are disabled until the user signs in', () => {
    const { template } = build({ signedIn: false })
    const view = find(template, 'View').submenu
    expect(find(view, 'Overview').enabled).toBe(false)
    expect(find(find(template, 'File').submenu, 'Save care plan').enabled).toBe(false)
    // Help stays available.
    expect(find(find(template, 'Help').submenu, 'Keyboard shortcuts').enabled).toBeUndefined()
  })

  test('Edit menu uses native roles for clipboard actions', () => {
    const { template } = build()
    const roles = find(template, 'Edit').submenu.map((i) => i.role).filter(Boolean)
    expect(roles).toEqual(['undo', 'redo', 'cut', 'copy', 'paste', 'selectAll'])
  })

  test('developer tools only appear in development', () => {
    const roles = (t) => find(t, 'View').submenu.map((i) => i.role)
    expect(roles(build().template)).not.toContain('toggleDevTools')
    expect(roles(build({ isDev: true }).template)).toContain('toggleDevTools')
  })

  test('About and Report an issue call their handlers', () => {
    const { template, onAbout, onReportIssue } = build()
    const help = find(template, 'Help').submenu
    find(help, 'About CareConnect').click()
    find(help, 'Report an issue…').click()
    expect(onAbout).toHaveBeenCalled()
    expect(onReportIssue).toHaveBeenCalled()
  })
})
