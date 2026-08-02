const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("gliFlowDesktop", {
  selectDirectory: () => ipcRenderer.invoke("select-directory"),
  selectFiles: (options = {}) => ipcRenderer.invoke("select-files", options),
  platformInfo: () => ({ isElectron: true, platform: process.platform }),
  writeFile: (payload) => ipcRenderer.invoke("write-file", payload),
  createFile: (payload) => ipcRenderer.invoke("create-file", payload),
  renameFile: (payload) => ipcRenderer.invoke("rename-file", payload),
  deleteFile: (payload) => ipcRenderer.invoke("delete-file", payload),
})
