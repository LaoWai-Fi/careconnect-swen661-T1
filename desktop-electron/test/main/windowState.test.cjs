'use strict'

const fs = require('node:fs')
const { createWindowStateStore, sanitize, isVisibleOnSomeDisplay, DEFAULTS } = require('../../electron/windowState.cjs')
const { FakeWindow, tempDir, oneDisplay } = require('./fakes.cjs')

const displays = oneDisplay.getAllDisplays()

describe('sanitize', () => {
  test('falls back to defaults for missing or invalid data', () => {
    expect(sanitize(null, displays)).toEqual(DEFAULTS)
    expect(sanitize('junk', displays)).toEqual(DEFAULTS)
    expect(sanitize({ width: 'wide' }, displays)).toEqual(DEFAULTS)
  })

  test('keeps a valid on-screen position and size', () => {
    expect(sanitize({ x: 100, y: 50, width: 1200, height: 800, isMaximized: true }, displays)).toEqual({
      x: 100, y: 50, width: 1200, height: 800, isMaximized: true,
    })
  })

  test('enforces the minimum window size', () => {
    const state = sanitize({ width: 200, height: 100 }, displays)
    expect(state.width).toBe(900)
    expect(state.height).toBe(600)
  })

  test('drops a position that is no longer on any display', () => {
    const state = sanitize({ x: 5000, y: 5000, width: 1200, height: 800 }, displays)
    expect(state.x).toBeUndefined()
    expect(state.y).toBeUndefined()
    expect(state.width).toBe(1200)
  })
})

test('isVisibleOnSomeDisplay needs a real overlap', () => {
  expect(isVisibleOnSomeDisplay({ x: 1880, y: 0, width: 800, height: 600 }, displays)).toBe(false)
  expect(isVisibleOnSomeDisplay({ x: 1700, y: 0, width: 800, height: 600 }, displays)).toBe(true)
})

describe('window state store (window management integration)', () => {
  let dir
  beforeEach(() => {
    jest.useFakeTimers()
    dir = tempDir()
  })
  afterEach(() => jest.useRealTimers())

  test('load returns defaults on first launch', () => {
    const store = createWindowStateStore({ dir, fs, screen: oneDisplay })
    expect(store.load()).toEqual(DEFAULTS)
  })

  test('resizing and moving saves bounds after a short delay', () => {
    const store = createWindowStateStore({ dir, fs, screen: oneDisplay, saveDelayMs: 200 })
    const win = new FakeWindow()
    store.track(win)
    win.setBounds({ x: 40, y: 60, width: 1000, height: 700 })
    win.emit('move')
    expect(fs.existsSync(store.file)).toBe(false)
    jest.advanceTimersByTime(250)
    expect(JSON.parse(fs.readFileSync(store.file, 'utf8'))).toEqual({ x: 40, y: 60, width: 1000, height: 700, isMaximized: false })
  })

  test('closing saves immediately, including maximized state, and the next launch restores it', () => {
    const store = createWindowStateStore({ dir, fs, screen: oneDisplay })
    const win = new FakeWindow()
    store.track(win)
    win.setBounds({ x: 120, y: 80, width: 1300, height: 850 })
    win.maximize()
    win.close()
    const reopened = createWindowStateStore({ dir, fs, screen: oneDisplay }).load()
    expect(reopened).toEqual({ x: 120, y: 80, width: 1300, height: 850, isMaximized: true })
  })

  test('a pending save is skipped once the window is destroyed', () => {
    const store = createWindowStateStore({ dir, fs, screen: oneDisplay })
    const win = new FakeWindow()
    store.track(win)
    win.emit('resize')
    win.destroyed = true
    jest.advanceTimersByTime(500)
    expect(fs.existsSync(store.file)).toBe(false)
  })

  test('untrack removes listeners', () => {
    const store = createWindowStateStore({ dir, fs, screen: oneDisplay })
    const win = new FakeWindow()
    const untrack = store.track(win)
    win.emit('resize')
    untrack()
    jest.advanceTimersByTime(500)
    expect(win.listenerCount('resize')).toBe(0)
    expect(fs.existsSync(store.file)).toBe(false)
  })

  test('write failures are reported, not thrown', () => {
    const brokenFs = { mkdirSync: () => { throw new Error('read-only') } }
    const store = createWindowStateStore({ dir, fs: brokenFs, screen: oneDisplay })
    expect(store.write({ width: 1 })).toBe(false)
  })

  test('snapshot falls back to getBounds when getNormalBounds is missing', () => {
    const store = createWindowStateStore({ dir, fs, screen: oneDisplay })
    const win = new FakeWindow()
    win.getNormalBounds = undefined
    expect(store.snapshot(win)).toEqual({ x: 10, y: 10, width: 1440, height: 900, isMaximized: false })
  })
})
