import { test, expect, _electron as electron, type ElectronApplication, type Page } from '@playwright/test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const evidenceDir = path.resolve(appDir, '../docs/week8/evidence')
fs.mkdirSync(evidenceDir, { recursive: true })

const strip = (label: string) => label.replace(/&/g, '')

async function launch(userData: string) {
  const app = await electron.launch({
    args: ['.', '--no-sandbox'],
    cwd: appDir,
    env: {
      ...process.env,
      CARECONNECT_USER_DATA: userData,
      CARECONNECT_NO_TRAY: '1',
      CARECONNECT_DISABLE_UPDATES: '1',
      CARECONNECT_DISABLE_GPU: '1',
    },
  })
  const page = await app.firstWindow()
  await page.waitForLoadState('domcontentloaded')
  return { app, page }
}

// The accelerators are registered by the native menu, which xvfb cannot drive with
// real key presses reliably, so menu commands are exercised by calling the menu
// item's click() in the main process (same code path the accelerator triggers).
function clickMenuItem(app: ElectronApplication, label: string) {
  return app.evaluate(({ Menu }, wanted) => {
    const find = (items: Electron.MenuItem[]): Electron.MenuItem | undefined => {
      for (const item of items) {
        // "Settings" is "Settings…" in the macOS app menu.
        if (item.label.replace(/&/g, '').replace(/…$/, '') === wanted) return item
        if (item.submenu) {
          const hit = find(item.submenu.items)
          if (hit) return hit
        }
      }
      return undefined
    }
    const item = find(Menu.getApplicationMenu()!.items)
    if (!item) throw new Error('Menu item not found: ' + wanted)
    item.click()
  }, label)
}

function menuItemEnabled(app: ElectronApplication, top: string, label: string) {
  return app.evaluate(({ Menu }, [t, l]) => {
    const strip = (s: string) => s.replace(/&/g, '')
    const topItem = Menu.getApplicationMenu()!.items.find((i) => strip(i.label) === t)
    return topItem!.submenu!.items.find((i) => strip(i.label) === l)!.enabled
  }, [top, label])
}

async function signIn(page: Page) {
  await page.getByRole('button', { name: 'Sign in to your workspace' }).click()
  await page.getByLabel('Email address').fill('caregiver@example.com')
  await page.getByLabel('Password').fill('asdf')
  await page.getByRole('button', { name: /Sign in$/ }).click()
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible()
}

let userData: string
let app: ElectronApplication | undefined

test.beforeEach(() => {
  userData = fs.mkdtempSync(path.join(os.tmpdir(), 'careconnect-e2e-'))
})

test.afterEach(async () => {
  await app?.close().catch(() => undefined)
  app = undefined
  fs.rmSync(userData, { recursive: true, force: true })
})

test('window opens with landing page and native menu', async () => {
  const launched = await launch(userData)
  app = launched.app
  const { page } = launched

  await expect(page).toHaveTitle(/^CareConnect/)
  await expect(page.getByRole('button', { name: 'Sign in to your workspace' })).toBeVisible()
  // The welcome content must fill the window, not collapse into a thin strip.
  const mainHeight = await page.locator('.welcome-main').evaluate((el) => el.getBoundingClientRect().height)
  expect(mainHeight).toBeGreaterThan(300)

  const labels = await app.evaluate(({ Menu }) => Menu.getApplicationMenu()!.items.map((i) => i.label))
  expect(labels.map(strip)).toEqual(expect.arrayContaining(['File', 'Edit', 'View', 'Help']))
  expect(await menuItemEnabled(app, 'View', 'Overview')).toBe(false)

  await page.screenshot({ path: path.join(evidenceDir, '01-landing.png') })
})

test('security: isolated, sandboxed renderer with a narrow bridge', async () => {
  const launched = await launch(userData)
  app = launched.app
  const { page } = launched

  const prefs = await app.evaluate(({ BrowserWindow }) => {
    const p = BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences()!
    return { contextIsolation: p.contextIsolation, nodeIntegration: p.nodeIntegration, sandbox: p.sandbox }
  })
  expect(prefs).toEqual({ contextIsolation: true, nodeIntegration: false, sandbox: true })

  expect(await page.evaluate(() => typeof (window as unknown as { require?: unknown }).require)).toBe('undefined')
  expect(
    await page.evaluate(
      () => typeof (window as unknown as { careConnect: { saveCareData: unknown } }).careConnect.saveCareData,
    ),
  ).toBe('function')
})

test('sign in, menu enables, menu navigation reaches Medications', async () => {
  const launched = await launch(userData)
  app = launched.app
  const { page } = launched

  await signIn(page)
  await expect.poll(() => menuItemEnabled(app!, 'View', 'Overview')).toBe(true)
  await page.screenshot({ path: path.join(evidenceDir, '02-dashboard.png') })

  await clickMenuItem(app, 'Medications')
  await expect(page.getByRole('heading', { name: /Manage medications/ })).toBeVisible()
  await page.screenshot({ path: path.join(evidenceDir, '03-medications.png') })

  await clickMenuItem(app, 'Settings')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.screenshot({ path: path.join(evidenceDir, '04-settings-dialog.png') })
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()

  await clickMenuItem(app, 'Keyboard shortcuts')
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.screenshot({ path: path.join(evidenceDir, '05-keyboard-shortcuts.png') })
})

test('autosave writes care-data.json to the user data folder', async () => {
  const launched = await launch(userData)
  app = launched.app
  const { page } = launched

  await signIn(page)
  await clickMenuItem(app, 'Medications')
  await expect(page.getByRole('heading', { name: /Manage medications/ })).toBeVisible()
  await page.getByRole('button', { name: /: mark as taken$/ }).first().click()

  const file = path.join(userData, 'care-data.json')
  await expect
    .poll(() => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''), { timeout: 15_000 })
    .toMatch(/"taken":\s*true/)
})

test('window bounds and care plan persist across relaunch', async () => {
  const first = await launch(userData)
  await signIn(first.page)
  await clickMenuItem(first.app, 'Medications')
  await first.page.getByRole('button', { name: /: mark as taken$/ }).first().click()
  const file = path.join(userData, 'care-data.json')
  await expect.poll(() => fs.existsSync(file) && fs.readFileSync(file, 'utf8')).toMatch(/"taken":\s*true/)

  // Pick a size that fits the screen: macOS caps a window at the display size, and
  // CI runners can have a small virtual display (macos-latest arm64 is 1024 px wide).
  const target = await first.app.evaluate(({ BrowserWindow, screen }) => {
    const area = screen.getPrimaryDisplay().workArea
    const wanted = {
      x: area.x + 20,
      y: area.y + 20,
      width: Math.max(900, Math.min(1100, area.width - 40)),
      height: Math.max(600, Math.min(720, area.height - 40)),
    }
    const win = BrowserWindow.getAllWindows()[0]
    win.setBounds(wanted)
    return win.getBounds()
  })
  // Window state saves are debounced; give them time before closing.
  await first.page.waitForTimeout(800)
  await first.app.close()

  const second = await launch(userData)
  app = second.app
  const bounds = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].getBounds())
  expect(Math.abs(bounds.width - target.width)).toBeLessThanOrEqual(20)
  expect(Math.abs(bounds.height - target.height)).toBeLessThanOrEqual(20)

  await signIn(second.page)
  await clickMenuItem(app, 'Medications')
  await expect(second.page.getByRole('button', { name: /: mark as not taken$/ }).first()).toBeVisible()
})
