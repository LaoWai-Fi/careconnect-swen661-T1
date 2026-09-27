const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('careConnectWindow', {
  minimize: () => ipcRenderer.send('window-control', 'minimize'),
  maximize: () => ipcRenderer.send('window-control', 'maximize'),
  close: () => ipcRenderer.send('window-control', 'close'),
})
