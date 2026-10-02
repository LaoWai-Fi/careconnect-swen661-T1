'use strict'

const fs = require('node:fs')
const path = require('node:path')
const { createCareStore, validatePayload, MAX_BYTES } = require('../../electron/careStore.cjs')
const { tempDir } = require('./fakes.cjs')

describe('careStore (file system persistence)', () => {
  let dir
  let store
  beforeEach(() => {
    dir = tempDir()
    store = createCareStore({ dir, fs: fs.promises })
  })

  test('load returns null data when nothing has been saved yet', async () => {
    await expect(store.load()).resolves.toEqual({ ok: true, data: null })
  })

  test('save then load round-trips the care plan', async () => {
    const data = { version: 1, medications: [{ id: 'm1' }] }
    const saved = await store.save(data)
    expect(saved.ok).toBe(true)
    expect(saved.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    await expect(store.load()).resolves.toEqual({ ok: true, data })
    expect(fs.existsSync(store.file + '.tmp')).toBe(false)
  })

  test('save creates the folder when it does not exist', async () => {
    const nested = createCareStore({ dir: path.join(dir, 'a', 'b'), fs: fs.promises })
    expect((await nested.save({ version: 1 })).ok).toBe(true)
  })

  test('a damaged file is set aside instead of crashing', async () => {
    fs.writeFileSync(store.file, '{ not json')
    const result = await store.load()
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/damaged/)
    expect(fs.existsSync(store.file + '.corrupt')).toBe(true)
  })

  test('refuses to read a file over the size limit', async () => {
    const fakeFs = { stat: async () => ({ size: MAX_BYTES + 1 }) }
    const big = createCareStore({ dir, fs: fakeFs })
    await expect(big.load()).resolves.toEqual({ ok: false, error: 'Saved care plan is too large' })
  })

  test('reports read errors other than a missing file', async () => {
    const fakeFs = { stat: async () => { const e = new Error('nope'); e.code = 'EACCES'; throw e } }
    const locked = createCareStore({ dir, fs: fakeFs })
    await expect(locked.load()).resolves.toEqual({ ok: false, error: 'Could not read saved care plan' })
  })

  test('reports write errors', async () => {
    const fakeFs = { mkdir: async () => { throw new Error('disk full') } }
    const broken = createCareStore({ dir, fs: fakeFs })
    await expect(broken.save({ version: 1 })).resolves.toEqual({ ok: false, error: 'Could not write the care plan to disk' })
  })

  test('clear removes the saved file', async () => {
    await store.save({ version: 1 })
    await expect(store.clear()).resolves.toEqual({ ok: true })
    expect(fs.existsSync(store.file)).toBe(false)
    const broken = createCareStore({ dir, fs: { rm: async () => { throw new Error('x') } } })
    await expect(broken.clear()).resolves.toEqual({ ok: false, error: 'Could not remove saved care plan' })
  })

  test('save rejects non-object payloads', async () => {
    await expect(store.save(null)).resolves.toMatchObject({ ok: false })
    await expect(store.save([1, 2])).resolves.toMatchObject({ ok: false })
    await expect(store.save('text')).resolves.toMatchObject({ ok: false })
  })
})

describe('validatePayload', () => {
  test('accepts a plain object and returns its JSON', () => {
    const result = validatePayload({ a: 1 })
    expect(result.ok).toBe(true)
    expect(JSON.parse(result.json)).toEqual({ a: 1 })
  })

  test('rejects circular structures', () => {
    const loop = {}
    loop.self = loop
    expect(validatePayload(loop)).toEqual({ ok: false, error: 'Care plan could not be converted to JSON' })
  })

  test('rejects payloads over 5 MB', () => {
    expect(validatePayload({ big: 'x'.repeat(MAX_BYTES) })).toEqual({ ok: false, error: 'Care plan is too large' })
  })
})
