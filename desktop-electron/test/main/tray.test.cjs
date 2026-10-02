'use strict'

const { EventEmitter } = require('node:events')
const { createTrayController, buildTrayMenuTemplate, tooltipFor } = require('../../electron/tray.cjs')

class FakeTray extends EventEmitter {
  constructor(icon) {
    super()
    this.icon = icon
    this.tooltip = ''
    this.menu = null
    this.destroyed = false
  }
  setToolTip(t) { this.tooltip = t }
  setContextMenu(m) { this.menu = m }
  destroy() { this.destroyed = true }
}
const FakeMenu = { buildFromTemplate: (template) => ({ template }) }

const signedIn = { signedIn: true, userName: 'Jane Roe', unread: 2, nextMedication: 'Metformin at 12:30 pm' }

describe('tray menu', () => {
  test('signed out: only open and quit are usable', () => {
    const template = buildTrayMenuTemplate({ session: null, onShow: jest.fn(), onCommand: jest.fn(), onQuit: jest.fn() })
    expect(template[2].label).toMatch(/Sign in/)
    expect(template.filter((i) => i.enabled === false).length).toBeGreaterThanOrEqual(4)
  })

  test('signed in: shows next medication and unread count', () => {
    const template = buildTrayMenuTemplate({ session: signedIn, onShow: jest.fn(), onCommand: jest.fn(), onQuit: jest.fn() })
    expect(template[2].label).toBe('Next medication: Metformin at 12:30 pm')
    expect(template[3].label).toBe('2 unread messages')
    const one = buildTrayMenuTemplate({ session: { ...signedIn, unread: 1, nextMedication: null }, onShow() {}, onCommand() {}, onQuit() {} })
    expect(one[3].label).toBe('1 unread message')
    expect(one[2].label).toBe('Next medication: all taken')
  })

  test('quick actions open the window and forward the command', () => {
    const onShow = jest.fn()
    const onCommand = jest.fn()
    const onQuit = jest.fn()
    const template = buildTrayMenuTemplate({ session: signedIn, onShow, onCommand, onQuit })
    template.find((i) => i.label === 'Record check-in').click()
    template.find((i) => i.label === '2 unread messages').click()
    template.find((i) => i.label === 'Quit CareConnect').click()
    expect(onShow).toHaveBeenCalledTimes(2)
    expect(onCommand.mock.calls).toEqual([['checkin'], ['messages']])
    expect(onQuit).toHaveBeenCalled()
  })

  test('tooltip reflects unread messages', () => {
    expect(tooltipFor(null)).toBe('CareConnect')
    expect(tooltipFor({ ...signedIn, unread: 0 })).toBe('CareConnect')
    expect(tooltipFor(signedIn)).toBe('CareConnect, 2 unread')
  })

  test('controller wires clicks, updates and destroy', () => {
    const onShow = jest.fn()
    const controller = createTrayController({ Tray: FakeTray, Menu: FakeMenu, icon: 'icon', onShow, onCommand: jest.fn(), onQuit: jest.fn() })
    expect(controller.tray.tooltip).toBe('CareConnect')
    controller.tray.emit('click')
    controller.tray.emit('double-click')
    expect(onShow).toHaveBeenCalledTimes(2)
    controller.update(signedIn)
    expect(controller.tray.tooltip).toBe('CareConnect, 2 unread')
    expect(controller.tray.menu.template[3].label).toBe('2 unread messages')
    controller.destroy()
    expect(controller.tray.destroyed).toBe(true)
  })
})
