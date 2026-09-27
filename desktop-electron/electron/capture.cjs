const { app, BrowserWindow, session } = require('electron')
const fs = require('node:fs/promises')
const path = require('node:path')

const evidenceDir = path.resolve(__dirname, '..', '..', 'docs', 'week7', 'evidence')
const result = { checkedAt: new Date().toISOString(), viewport: '1440 × 900', checks: [] }

app.setPath('userData', path.join(__dirname, '..', '.electron-smoke-user-data'))
app.disableHardwareAcceleration()

async function waitFor(win, expression, description) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (await win.webContents.executeJavaScript(expression)) {
      result.checks.push({ description, passed: true })
      return
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error(`Timed out: ${description}`)
}

async function clickText(win, selector, text) {
  const clicked = await win.webContents.executeJavaScript(`(() => {
    const element = [...document.querySelectorAll(${JSON.stringify(selector)})]
      .find(node => node.textContent.trim().includes(${JSON.stringify(text)}))
    if (!element) return false
    element.click()
    return true
  })()`)
  if (!clicked) throw new Error(`Could not find ${text}`)
}

async function screenshot(win, name) {
  await new Promise((resolve) => setTimeout(resolve, 400))
  await new Promise((resolve) => {
    win.webContents.once('paint', resolve)
    win.webContents.invalidate()
  })
  const image = await win.webContents.capturePage()
  await fs.writeFile(path.join(evidenceDir, name), image.toPNG())
}

async function key(win, keyCode, modifiers = []) {
  win.webContents.sendInputEvent({ type: 'keyDown', keyCode, modifiers })
  win.webContents.sendInputEvent({ type: 'keyUp', keyCode, modifiers })
}

app.whenReady().then(async () => {
  let exitCode = 0
  await session.defaultSession.clearStorageData({ storages: ['localstorage'] })
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    show: false,
    backgroundColor: '#f0f4f7',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      offscreen: true,
      backgroundThrottling: false,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  try {
    await fs.mkdir(evidenceDir, { recursive: true })
    await win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
    await waitFor(win, "!!document.querySelector('.welcome-window')", 'Desktop welcome screen renders')
    await screenshot(win, '01-welcome-1440x900.png')

    await clickText(win, 'button', 'Sign in to your workspace')
    await waitFor(win, "!!document.querySelector('input[type=email]')", 'Sign-in form renders')
    await win.webContents.executeJavaScript(`(() => {
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
      const email = document.querySelector('input[type=email]')
      const password = document.querySelector('input[type=password]')
      set.call(email, 'demo@example.com')
      email.dispatchEvent(new Event('input', { bubbles: true }))
      set.call(password, 'demo-only')
      password.dispatchEvent(new Event('input', { bubbles: true }))
      document.querySelector('form').requestSubmit()
    })()`)
    await waitFor(win, "!!document.querySelector('.desktop-workspace')", 'Care workspace opens after demo sign-in')
    await waitFor(win, "!!document.querySelector('[role=menubar]') && !!document.querySelector('[role=toolbar]')", 'Menu bar and toolbar render')
    await screenshot(win, '02-overview-1440x900.png')

    await clickText(win, '.desktop-sidebar button', 'Medications')
    await waitFor(win, "!!document.querySelector('[aria-current=page]') && document.querySelector('[aria-current=page]').textContent.includes('Medications')", 'Medication workspace navigation works')
    await screenshot(win, '03-medications-1440x900.png')

    await clickText(win, '.desktop-sidebar button', 'Messages')
    await waitFor(win, "document.querySelector('[aria-current=page]')?.textContent.includes('Messages')", 'Message workspace navigation works')
    await screenshot(win, '04-messages-1440x900.png')

    await key(win, '2', ['control'])
    await waitFor(win, "document.querySelector('[aria-current=page]')?.textContent.includes('Medications')", 'Ctrl+2 keyboard navigation opens medications')
    await key(win, '5', ['control'])
    await waitFor(win, "document.querySelector('[aria-current=page]')?.textContent.includes('Messages')", 'Ctrl+5 keyboard navigation opens messages')
    await key(win, 's', ['control'])
    await waitFor(win, "localStorage.getItem('cc-saved-view') === 'messages'", 'Ctrl+S saves the current workspace view')
    await key(win, 'F1')
    await waitFor(win, "!!document.querySelector('.shortcuts-dialog')", 'F1 opens keyboard shortcut reference')
    await clickText(win, '.shortcuts-dialog button', 'Done')
    await key(win, 'h', ['alt'])
    await waitFor(win, "!!document.querySelector('[data-menu-name=Help][data-open-menu]')", 'Alt+H opens the Help menu')
    await key(win, 'Escape')
    await waitFor(win, "!document.querySelector('[data-open-menu]')", 'Escape closes the Help menu')
    await clickText(win, '.desktop-menubar button', 'Help')
    await clickText(win, '[role=menuitem]', 'Keyboard shortcuts')
    await waitFor(win, "!!document.querySelector('.shortcuts-dialog')", 'Keyboard shortcut reference opens from Help menu')
    await screenshot(win, '05-shortcuts-1440x900.png')

    await clickText(win, '.shortcuts-dialog button', 'Done')
    await win.webContents.executeJavaScript("document.querySelector('button[aria-label=\"Open settings\"]').click()")
    await waitFor(win, "!!document.querySelector('[aria-labelledby=preferences-title]')", 'Desktop settings open')
    await clickText(win, '.settings-nav button', 'Accessibility')
    await win.webContents.executeJavaScript("document.querySelector('[role=switch]').click()")
    await waitFor(win, "document.documentElement.classList.contains('high-contrast')", 'High-contrast mode can be enabled')
    await win.webContents.executeJavaScript("document.querySelector('[role=switch]').click()")
    await clickText(win, '.settings-nav button', 'General')
    await clickText(win, '[aria-labelledby=preferences-title] button', 'light')
    await waitFor(win, "localStorage.getItem('cc-theme') === 'light' && !document.documentElement.classList.contains('dark')", 'Light theme can be selected')
    await clickText(win, '[aria-labelledby=preferences-title] button', 'Done')
    await clickText(win, '.desktop-sidebar button', 'Overview')
    await waitFor(win, "document.querySelector('[aria-current=page]')?.textContent.includes('Overview')", 'Overview opens in light theme')
    await screenshot(win, '06-overview-light-1440x900.png')

    await fs.writeFile(path.join(evidenceDir, 'electron-smoke-results.json'), JSON.stringify(result, null, 2) + '\n')
    console.log(`Electron smoke test passed: ${result.checks.length} checks; screenshots saved to ${evidenceDir}`)
  } catch (error) {
    console.error(error)
    exitCode = 1
  } finally {
    if (!win.isDestroyed()) win.close()
    app.exit(exitCode)
  }
})
