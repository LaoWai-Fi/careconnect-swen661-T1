'use strict'

const path = require('node:path')

// Remembers the main window's size, position and maximized state between
// launches. Saved bounds are checked against the connected displays so the
// window never reopens off-screen after a monitor is unplugged.

const DEFAULTS = Object.freeze({ width: 1440, height: 900, isMaximized: false })
const MIN = Object.freeze({ width: 900, height: 600 })
const FILE_NAME = 'window-state.json'

function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

/** Returns true when at least 100x100 px of the bounds is on some display. */
function isVisibleOnSomeDisplay(bounds, displays) {
  return displays.some(({ workArea: a }) => {
    const overlapX = Math.min(bounds.x + bounds.width, a.x + a.width) - Math.max(bounds.x, a.x)
    const overlapY = Math.min(bounds.y + bounds.height, a.y + a.height) - Math.max(bounds.y, a.y)
    return overlapX >= 100 && overlapY >= 100
  })
}

/** Cleans up whatever was on disk into safe BrowserWindow options. */
function sanitize(raw, displays) {
  const state = { ...DEFAULTS }
  if (!raw || typeof raw !== 'object') return state
  if (isNumber(raw.width) && isNumber(raw.height)) {
    state.width = Math.max(MIN.width, Math.round(raw.width))
    state.height = Math.max(MIN.height, Math.round(raw.height))
  }
  if (isNumber(raw.x) && isNumber(raw.y)) {
    const candidate = { x: Math.round(raw.x), y: Math.round(raw.y), width: state.width, height: state.height }
    if (isVisibleOnSomeDisplay(candidate, displays)) {
      state.x = candidate.x
      state.y = candidate.y
    }
  }
  state.isMaximized = raw.isMaximized === true
  return state
}

function createWindowStateStore({ dir, fs, screen, saveDelayMs = 300 }) {
  const file = path.join(dir, FILE_NAME)

  function load() {
    let raw = null
    try {
      raw = JSON.parse(fs.readFileSync(file, 'utf8'))
    } catch {
      raw = null
    }
    return sanitize(raw, screen.getAllDisplays())
  }

  function write(state) {
    try {
      fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(file, JSON.stringify(state, null, 2), 'utf8')
      return true
    } catch {
      return false
    }
  }

  function snapshot(win) {
    // getNormalBounds() gives the restored size even while maximized.
    const bounds = typeof win.getNormalBounds === 'function' ? win.getNormalBounds() : win.getBounds()
    return { ...bounds, isMaximized: win.isMaximized() }
  }

  /** Saves state on resize/move (debounced) and immediately on close. */
  function track(win) {
    let timer = null
    const scheduleSave = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        if (!win.isDestroyed()) write(snapshot(win))
      }, saveDelayMs)
    }
    const events = ['resize', 'move', 'maximize', 'unmaximize']
    events.forEach((name) => win.on(name, scheduleSave))
    win.on('close', () => {
      if (timer) clearTimeout(timer)
      timer = null
      write(snapshot(win))
    })
    return () => {
      if (timer) clearTimeout(timer)
      events.forEach((name) => win.removeListener(name, scheduleSave))
    }
  }

  return { file, load, write, track, snapshot }
}

module.exports = { createWindowStateStore, sanitize, isVisibleOnSomeDisplay, DEFAULTS, MIN, FILE_NAME }
