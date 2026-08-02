const { app, BrowserWindow, dialog, ipcMain, Menu } = require("electron")
const { spawn } = require("child_process")
const crypto = require("crypto")
const path = require("path")

const backendHost = "127.0.0.1"
const backendPort = Number(process.env.GLI_FLOW_BACKEND_PORT || 8000)
const backendUrl = `http://${backendHost}:${backendPort}`
const projectRoot = process.env.GLI_FLOW_PROJECT_ROOT || path.resolve(__dirname, "..")
const attachOnly = process.argv.includes("--attach-only")
let backendProcess = null
let desktopWriteToken = ""

function safeEnv(extra = {}) {
  return { ...process.env, LC_ALL: "C", LANG: "C", LANGUAGE: "C", PYTHONIOENCODING: "utf-8", DISPLAY: process.env.DISPLAY || ":0", ...extra }
}

async function fetchHealth() {
  try { const response = await fetch(`${backendUrl}/health`); return response.ok } catch (_) { return false }
}

async function waitForBackend(timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) { if (await fetchHealth()) return true; await new Promise(resolve => setTimeout(resolve, 500)) }
  return false
}

async function checkBuiltUi() {
  try {
    const response = await fetch(`${backendUrl}/`)
    const contentType = response.headers.get("content-type") || ""
    const body = await response.text()
    return response.ok && contentType.includes("text/html") && body.includes("<div id=\"root\">")
  } catch (_) { return false }
}

async function ensureBackend() {
  if (await fetchHealth()) {
    if (!(await checkBuiltUi())) throw new Error("Backend is reachable, but dashboard/dist is not built or is not being served. Run `npm run desktop:build` or `cd dashboard && npm run build`.")
    return
  }
  if (attachOnly) throw new Error(`No backend is listening at ${backendUrl}; --attach-only refused to spawn one.`)
  desktopWriteToken = crypto.randomBytes(32).toString("hex")
  const python = process.env.GLI_FLOW_PYTHON || process.env.PYTHON || "python3"
  backendProcess = spawn(python, ["-m", "uvicorn", "backend.server:app", "--host", backendHost, "--port", String(backendPort)], { cwd: projectRoot, env: safeEnv({ GLI_FLOW_DESKTOP_WRITE_TOKEN: desktopWriteToken }), stdio: "ignore" })
  backendProcess.on("error", error => console.error("GLI-FLOW backend failed:", error))
  if (!(await waitForBackend()) || !(await checkBuiltUi())) {
    if (backendProcess) backendProcess.kill()
    throw new Error(`Backend started but dashboard UI is unavailable at ${backendUrl}/. Build the dashboard before launching Electron.`)
  }
}

function installMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: "File", submenu: [{ role: "close" }] },
    { label: "Edit", submenu: [{ role: "undo" }, { role: "redo" }, { type: "separator" }, { role: "cut" }, { role: "copy" }, { role: "paste" }] },
    { label: "View", submenu: [{ role: "reload" }, { role: "toggledevtools" }, { type: "separator" }, { role: "resetzoom" }, { role: "zoomin" }, { role: "zoomout" }] },
    { role: "window", label: "Window" },
    { role: "help", label: "Help", submenu: [{ label: "GLI-FLOW documentation", click: () => require("electron").shell.openExternal("https://github.com/Jegadiswar-SM/gli-flow-asic") }] },
  ]))
}

async function createWindow() {
  await ensureBackend()
  installMenu()
  const window = new BrowserWindow({ width: 1600, height: 1000, minWidth: 1100, minHeight: 700, backgroundColor: "#F3F2ED", webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: true } })
  await window.loadURL(`${backendUrl}/`)
}

ipcMain.handle("select-directory", async () => { const result = await dialog.showOpenDialog({ properties: ["openDirectory"] }); return result.canceled ? null : result.filePaths[0] || null })
ipcMain.handle("select-files", async (_, options = {}) => { const result = await dialog.showOpenDialog({ properties: options.multiple === false ? ["openFile"] : ["openFile", "multiSelections"], filters: options.filters || [] }); return result.canceled ? [] : result.filePaths })
ipcMain.handle("write-file", async (_, payload) => {
  if (!desktopWriteToken) throw new Error("This Electron session is attached to an existing backend; file writes are disabled.")
  const response = await fetch(`${backendUrl}/api/fs/file`, { method: "POST", headers: { "content-type": "application/json", "x-gli-flow-desktop-token": desktopWriteToken }, body: JSON.stringify(payload) })
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || "File save failed")
  return data
})

async function desktopFileOperation(path, operation, payload = {}) {
  if (!desktopWriteToken) throw new Error("This Electron session is attached to an existing backend; file operations are disabled.")
  const response = await fetch(`${backendUrl}/api/fs/${operation}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-gli-flow-desktop-token": desktopWriteToken },
    body: JSON.stringify({ path, ...payload }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || `File ${operation} failed`)
  return data
}

ipcMain.handle("create-file", async (_, payload) => desktopFileOperation(payload.path, "create", { type: payload.type, content: payload.content || "" }))
ipcMain.handle("rename-file", async (_, payload) => desktopFileOperation(payload.path, "move", { new_path: payload.newPath }))
ipcMain.handle("delete-file", async (_, payload) => desktopFileOperation(payload.path, "delete"))

app.whenReady().then(createWindow).catch(error => { dialog.showErrorBox("GLI-FLOW Desktop could not start", error.message); app.quit() })
app.on("before-quit", () => { if (backendProcess && !backendProcess.killed) backendProcess.kill() })
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit() })
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
