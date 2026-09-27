const { app, BrowserWindow, ipcMain, Menu } = require('electron')
const path = require('node:path')

let mainWindow

app.setPath('userData', path.join(__dirname, '..', '.electron-user-data'))
app.disableHardwareAcceleration()

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#f0f4f7',
    title: 'CareConnect Desktop',
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  Menu.setApplicationMenu(null)
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const current = mainWindow.webContents.getURL()
    if (!current) return
    const source = new URL(current)
    const destination = new URL(url)
    if (destination.protocol !== source.protocol || destination.host !== source.host || destination.pathname !== source.pathname) event.preventDefault()
  })

  if (process.env.CARECONNECT_DEV_URL) {
    mainWindow.loadURL(process.env.CARECONNECT_DEV_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

function fromMainWindow(event) {
  return mainWindow && !mainWindow.isDestroyed() && event.sender === mainWindow.webContents
}

ipcMain.on('window-control', (event, action) => {
  if (!fromMainWindow(event)) return
  if (action === 'minimize') mainWindow.minimize()
  if (action === 'maximize') {
    if (mainWindow.isMaximized()) mainWindow.unmaximize()
    else mainWindow.maximize()
  }
  if (action === 'close') mainWindow.close()
})

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
