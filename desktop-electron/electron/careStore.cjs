'use strict'

const path = require('node:path')

// Reads and writes the care plan JSON file in the app's userData folder.
// Writes go to a temporary file first and are then renamed over the real file,
// so a crash mid-write can never leave a half-written care plan behind.

const MAX_BYTES = 5 * 1024 * 1024
const FILE_NAME = 'care-data.json'

function createCareStore({ dir, fs }) {
  const file = path.join(dir, FILE_NAME)

  async function load() {
    let text
    try {
      const stat = await fs.stat(file)
      if (stat.size > MAX_BYTES) return { ok: false, error: 'Saved care plan is too large' }
      text = await fs.readFile(file, 'utf8')
    } catch (error) {
      if (error && error.code === 'ENOENT') return { ok: true, data: null }
      return { ok: false, error: 'Could not read saved care plan' }
    }
    try {
      return { ok: true, data: JSON.parse(text) }
    } catch {
      // Keep the unreadable file for inspection instead of silently losing it.
      await fs.rename(file, file + '.corrupt').catch(() => undefined)
      return { ok: false, error: 'Saved care plan was damaged and has been set aside' }
    }
  }

  async function save(data) {
    const check = validatePayload(data)
    if (!check.ok) return check
    const temp = file + '.tmp'
    try {
      await fs.mkdir(dir, { recursive: true })
      await fs.writeFile(temp, check.json, 'utf8')
      await fs.rename(temp, file)
      return { ok: true, savedAt: new Date().toISOString() }
    } catch {
      return { ok: false, error: 'Could not write the care plan to disk' }
    }
  }

  async function clear() {
    try {
      await fs.rm(file, { force: true })
      return { ok: true }
    } catch {
      return { ok: false, error: 'Could not remove saved care plan' }
    }
  }

  return { file, load, save, clear }
}

/** Accepts only plain JSON objects below the size limit. */
function validatePayload(data) {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { ok: false, error: 'Care plan must be an object' }
  }
  let json
  try {
    json = JSON.stringify(data, null, 2)
  } catch {
    return { ok: false, error: 'Care plan could not be converted to JSON' }
  }
  if (Buffer.byteLength(json, 'utf8') > MAX_BYTES) {
    return { ok: false, error: 'Care plan is too large' }
  }
  return { ok: true, json }
}

module.exports = { createCareStore, validatePayload, MAX_BYTES, FILE_NAME }
