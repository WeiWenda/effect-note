const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI',{
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  openInFinder: (path) => ipcRenderer.invoke('openInFinder', path)
})
