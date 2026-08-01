const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("gliFlowDesktop", {
  selectDirectory: () => ipcRenderer.invoke("select-directory"),
  selectFiles: (options = {}) => ipcRenderer.invoke("select-files", options),
  platformInfo: () => ({ isElectron: true, platform: process.platform }),
  writeFile: (payload) => ipcRenderer.invoke("write-file", payload),
})
