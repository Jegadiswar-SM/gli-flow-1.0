import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Editor, { loader } from "@monaco-editor/react"
import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js"
import EditorWorker from "../node_modules/monaco-editor/esm/vs/editor/editor.worker.js?worker"
import { DockviewReact } from "dockview-react"
import "dockview-react/dist/styles/dockview.css"
import {
  Code2, FolderPlus, FolderTree, MoreVertical, Play, Search,
  TerminalSquare, X, FilePlus2, Trash2, Pencil, PanelTop,
} from "lucide-react"
import { isElectron } from "./lib/platform"
import { GLI_THEME } from "./lib/theme"

const API_BASE = import.meta.env.VITE_API_URL || ""

loader.config({ monaco })
globalThis.MonacoEnvironment = { getWorker: () => new EditorWorker() }

function useDebouncedValue(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}

function baseName(path) {
  return path.split(/[\\\\/]/).filter(Boolean).pop() || path
}

function parentPath(path) {
  const parts = path.split(/[\\\\/]/).filter(Boolean)
  parts.pop()
  return parts.join("/") || "."
}

function isDirty(file) {
  return Boolean(file && file.content !== file.savedContent)
}

function parseOutline(content) {
  const entries = []
  const lines = content.split("\\n")
  lines.forEach((line, index) => {
    const moduleMatch = line.match(/^\\s*module\\s+([A-Za-z_$][\\w$]*)/)
    const alwaysMatch = line.match(/^\\s*(always(?:_ff|_comb)?\\b)/)
    const assignMatch = line.match(/^\\s*(assign\\b)/)
    if (moduleMatch) entries.push({ label: moduleMatch[1], kind: "module", line: index + 1 })
    else if (alwaysMatch) entries.push({ label: alwaysMatch[1], kind: "always", line: index + 1 })
    else if (assignMatch) entries.push({ label: "assign", kind: "assign", line: index + 1 })
  })
  return entries
}

function TreeNode({ node, onOpen, onContext, onJump, focusPath }) {
  const [open, setOpen] = useState(node.type === "directory")
  const nodeRef = useRef(null)
  useEffect(() => {
    if (focusPath && node.type === "directory" && focusPath.startsWith(node.path)) setOpen(true)
    if (focusPath === node.path) nodeRef.current?.scrollIntoView({ block: "nearest" })
  }, [focusPath, node.path, node.type])
  const menuButton = <button type="button" aria-label={'More actions for ' + node.name} title="More actions" onClick={event => { event.stopPropagation(); onContext(event, node) }} className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 p-0.5 rounded hover:bg-[#DCE7F7]"><MoreVertical size={12} aria-hidden="true" /></button>
  if (node.type === "file") {
    return <div ref={nodeRef} className="group flex items-center w-full">
      <button type="button" className="flex-1 min-w-0 text-left px-2 py-1 text-[11px] truncate hover:bg-[#E8EEF8] focus-visible:outline-2 focus-visible:outline-blue-600" onClick={() => onOpen(node.path)} onContextMenu={event => { event.preventDefault(); onContext(event, node) }}>
        <Code2 size={12} className="inline mr-1 text-[#2563EB]" aria-hidden="true" />{node.name}
      </button>{menuButton}
    </div>
  }
  return <div ref={nodeRef}>
    <div className="group flex items-center w-full">
      <button type="button" className="flex-1 min-w-0 text-left px-2 py-1 text-[11px] font-medium truncate hover:bg-[#E8EEF8] focus-visible:outline-2 focus-visible:outline-blue-600" onClick={() => setOpen(value => !value)} onContextMenu={event => { event.preventDefault(); onContext(event, node) }}>
        <FolderTree size={12} className="inline mr-1 text-[#92751A]" aria-hidden="true" />{open ? "▾" : "▸"} {node.name}
      </button>{menuButton}
    </div>
    {open && <div className="pl-3 border-l border-[#D1D5DB] ml-3">{node.children?.map(child => <TreeNode key={child.path} node={child} onOpen={onOpen} onContext={onContext} onJump={onJump} focusPath={focusPath} />)}</div>}
  </div>
}

function FileTreePanel({ params }) {
  const { tree, onOpen, onRefresh, onCreate, onRename, onDelete, focusPath, includeAll } = params
  const [menu, setMenu] = useState(null)
  const showMenu = (event, node) => setMenu({ x: event.clientX, y: event.clientY, node })
  const createAt = type => { const path = menu?.node?.type === "directory" ? menu.node.path : parentPath(menu?.node?.path || tree?.root || "."); setMenu(null); onCreate(path, type) }
  return <div className="h-full overflow-auto bg-[#FAFAF8] text-abyss-ink" onClick={() => setMenu(null)}>
    <div className="flex items-center justify-between p-2 border-b border-stone-ridge">
      <span className="text-[11px] font-semibold">Design files</span>
      <div className="flex items-center gap-1">
        {isElectron && <><button type="button" title="New file" aria-label="New file" onClick={() => onCreate(tree?.root || ".", "file")} className="p-1 rounded hover:bg-[#E8EEF8]"><FilePlus2 size={13} /></button><button type="button" title="New folder" aria-label="New folder" onClick={() => onCreate(tree?.root || ".", "directory")} className="p-1 rounded hover:bg-[#E8EEF8]"><FolderPlus size={13} /></button></>}
        <label className="text-[9px] flex items-center gap-1"><input type="checkbox" checked={includeAll} onChange={event => onRefresh(event.target.checked)} /> all</label>
      </div>
    </div>
    <div className="p-2" onContextMenu={event => { event.preventDefault(); showMenu(event, { path: tree?.root || ".", type: "directory", name: "design root" }) }}>
      {tree?.children?.length ? tree.children.map(node => <TreeNode key={node.path} node={node} onOpen={onOpen} onContext={showMenu} onJump={() => {}} focusPath={focusPath} />) : <p className="text-[11px] text-[#6B7280]">Choose a design folder to browse RTL.</p>}
    </div>
    {menu && isElectron && <div className="fixed z-50 min-w-36 rounded border border-stone-ridge bg-white shadow-lg p-1 text-[11px]" style={{ left: menu.x, top: menu.y }} onClick={event => event.stopPropagation()}>
      {menu.node.type === "directory" && <><button type="button" className="block w-full text-left px-2 py-1 hover:bg-[#E8EEF8]" onClick={() => createAt("file")}><FilePlus2 size={12} className="inline mr-1" />New File</button><button type="button" className="block w-full text-left px-2 py-1 hover:bg-[#E8EEF8]" onClick={() => createAt("directory")}><FolderPlus size={12} className="inline mr-1" />New Folder</button></>}
      {menu.node.path !== tree?.root && <><button type="button" className="block w-full text-left px-2 py-1 hover:bg-[#E8EEF8]" onClick={() => { setMenu(null); onRename(menu.node) }}><Pencil size={12} className="inline mr-1" />Rename</button><button type="button" className="block w-full text-left px-2 py-1 text-red-700 hover:bg-red-50" onClick={() => { setMenu(null); onDelete(menu.node) }}><Trash2 size={12} className="inline mr-1" />Delete</button></>}
    </div>}
  </div>
}

function Breadcrumbs({ path, onJump }) {
  if (!path) return null
  const parts = path.split(/[\\\\/]/).filter(Boolean)
  return <nav aria-label="File path" className="flex items-center gap-1 px-3 py-1 text-[10px] bg-[#111827] text-[#CBD5E1] overflow-auto whitespace-nowrap">
      {parts.map((part, index) => { const target = parts.slice(0, index + 1).join("/"); return <span key={target} className="flex items-center gap-1"><button type="button" className="hover:text-white hover:underline" onClick={() => onJump(target)}>{part}</button>{index < parts.length - 1 && <span>/</span>}</span> })}
  </nav>
}

function EditorPanel({ params }) {
  const { activeFile, tabs, onSelect, onClose, onChange, onSave, onCommandPalette, onRevealLine, minimapEnabled, onToggleMinimap, onJump } = params
  const editorRef = useRef(null)
  const callbacks = useRef({ onSave, onCommandPalette, onToggleMinimap })
  const [position, setPosition] = useState({ line: 1, column: 1 })
  useEffect(() => { callbacks.current = { onSave, onCommandPalette, onToggleMinimap } }, [onSave, onCommandPalette, onToggleMinimap])
  const configure = useCallback(monacoApi => {
    monacoApi.languages.register({ id: "verilog" })
    monacoApi.languages.setMonarchTokensProvider("verilog", { tokenizer: { root: [[/\/\/.*$/, "comment"], [/\/\*/, "comment", "@comment"], [/[0-9]+('[bodhBODH][0-9a-fA-F_xXzZ?]+)/, "number"], [/[a-zA-Z_][\w$]*/, { cases: { "@keywords": "keyword", "@default": "identifier" } }], [/[{}()[\];,.]/, "delimiter"], [/".*?"/, "string"]], comment: [[/[^*]+/, "comment"], [/\*\//, "comment", "@pop"], [/[*]/, "comment"]] }, keywords: ["module", "endmodule", "input", "output", "inout", "wire", "reg", "logic", "always", "always_ff", "always_comb", "assign", "begin", "end", "if", "else", "case", "endcase", "parameter", "localparam", "posedge", "negedge", "generate", "genvar", "for"] })
    monacoApi.editor.defineTheme("gli-flow-eda", { base: "vs-dark", inherit: true, rules: [{ token: "keyword", foreground: GLI_THEME.gold.slice(1) }, { token: "comment", foreground: "7C8A9E" }, { token: "number", foreground: "86EFAC" }, { token: "string", foreground: "93C5FD" }, { token: "identifier", foreground: "E2E8F0" }], colors: { "editor.background": GLI_THEME.ink, "editor.foreground": "E2E8F0", "editorCursor.foreground": GLI_THEME.gold, "editor.lineHighlightBackground": "1E293B" } })
  }, [])
  const outline = useMemo(() => parseOutline(activeFile?.content || ""), [activeFile?.content])
  useEffect(() => { if (params.revealLine && editorRef.current) { editorRef.current.revealLineInCenter(params.revealLine); editorRef.current.setPosition({ lineNumber: params.revealLine, column: 1 }) } }, [params.revealLine, activeFile?.path])
  const registerAction = (editor, monacoApi, id, label, keybindings, command) => editor.addAction({ id, label, keybindings, run: () => command(editor, monacoApi) })
  const handleMount = (editor, monacoApi) => {
    editorRef.current = editor
    editor.onDidChangeCursorPosition(event => setPosition({ line: event.position.lineNumber, column: event.position.column }))
    registerAction(editor, monacoApi, "gli-flow-save", "Save RTL", [monacoApi.KeyMod.CtrlCmd | monacoApi.KeyCode.KeyS], () => callbacks.current.onSave())
    registerAction(editor, monacoApi, "gli-flow-palette", "Command Palette", [monacoApi.KeyMod.CtrlCmd | monacoApi.KeyMod.Shift | monacoApi.KeyCode.KeyP], () => callbacks.current.onCommandPalette())
    registerAction(editor, monacoApi, "gli-flow-minimap", "Toggle Minimap", [], () => callbacks.current.onToggleMinimap())
    registerAction(editor, monacoApi, "gli-flow-comment", "Toggle Line Comment", [monacoApi.KeyMod.CtrlCmd | monacoApi.KeyCode.Slash], (instance) => instance.trigger("keyboard", "editor.action.commentLine", null))
    registerAction(editor, monacoApi, "gli-flow-duplicate", "Duplicate Line", [monacoApi.KeyMod.Shift | monacoApi.KeyMod.Alt | monacoApi.KeyCode.DownArrow], (instance) => instance.trigger("keyboard", "editor.action.duplicateSelection", null))
    registerAction(editor, monacoApi, "gli-flow-move-up", "Move Line Up", [monacoApi.KeyMod.Alt | monacoApi.KeyCode.UpArrow], (instance) => instance.trigger("keyboard", "editor.action.moveLinesUpAction", null))
    registerAction(editor, monacoApi, "gli-flow-move-down", "Move Line Down", [monacoApi.KeyMod.Alt | monacoApi.KeyCode.DownArrow], (instance) => instance.trigger("keyboard", "editor.action.moveLinesDownAction", null))
    registerAction(editor, monacoApi, "gli-flow-find", "Find", [monacoApi.KeyMod.CtrlCmd | monacoApi.KeyCode.KeyF], (instance) => instance.trigger("keyboard", "actions.find", null))
    registerAction(editor, monacoApi, "gli-flow-replace", "Find and Replace", [monacoApi.KeyMod.CtrlCmd | monacoApi.KeyCode.KeyH], (instance) => instance.trigger("keyboard", "editor.action.startFindReplaceAction", null))
  }
  return <div className="h-full flex flex-col bg-[#0F172A]">
    <Breadcrumbs path={activeFile?.path} onJump={onJump} />
    <div className="h-9 flex items-center overflow-x-auto bg-[#1E293B] text-[11px] text-white border-b border-[#334155]">
      {tabs.map(tab => <div key={tab.path} className={'group flex items-center gap-1 h-full border-r border-[#334155] ' + (tab.path === activeFile?.path ? "bg-[#0F172A]" : "bg-[#1E293B]")}><button type="button" className="max-w-44 truncate px-3 py-1 hover:bg-[#263449]" onClick={() => onSelect(tab.path)}>{isDirty(tab) && <span className="text-[#D4AF37] mr-1" aria-label="Unsaved changes">●</span>}{baseName(tab.path)}</button><button type="button" aria-label={'Close ' + baseName(tab.path)} title="Close tab" onClick={() => onClose(tab.path)} className="p-1 rounded hover:bg-[#475569] opacity-70 group-hover:opacity-100"><X size={12} /></button></div>)}
      {!tabs.length && <span className="px-3 text-[#94A3B8]">No files open</span>}
      <button type="button" title="Toggle minimap" aria-label="Toggle minimap" onClick={onToggleMinimap} className="ml-auto mr-2 p-1 rounded hover:bg-[#334155]"><PanelTop size={13} /></button>
    </div>
    <div className="flex-1 min-h-0 flex flex-col">
      {activeFile ? <><div className="h-24 shrink-0 border-b border-[#334155] bg-[#111827] px-3 py-1 overflow-auto"><div className="text-[10px] uppercase tracking-wide text-[#94A3B8] mb-1">Outline</div>{outline.length ? <div className="flex flex-wrap gap-1">{outline.map(entry => <button type="button" key={entry.kind + entry.line} onClick={() => onRevealLine(entry.line)} className="rounded px-2 py-1 text-[10px] bg-[#1E293B] text-[#CBD5E1] hover:bg-[#334155]">{entry.kind} · {entry.label} · {entry.line}</button>)}</div> : <span className="text-[10px] text-[#64748B]">No module, always, or assign declarations found.</span>}</div><Editor height="100%" theme="gli-flow-eda" language="verilog" value={activeFile.content} onChange={value => onChange(activeFile.path, value || "")} beforeMount={configure} onMount={handleMount} options={{ minimap: { enabled: minimapEnabled }, fontSize: 13, automaticLayout: true, wordWrap: "off", padding: { top: 10 }, multiCursorModifier: "alt", bracketPairColorization: { enabled: true }, renderLineHighlight: "line", renderWhitespace: "selection", smoothScrolling: true, cursorBlinking: "smooth" }} /></> : <div className="flex-1 flex items-center justify-center text-sm text-[#94A3B8]">Open a Verilog/SystemVerilog file from the tree.</div>}
    </div>
    <div className="h-6 shrink-0 flex items-center justify-end gap-4 px-3 bg-[#1E293B] text-[10px] text-[#CBD5E1]"><span>Ln {position.line}, Col {position.column}</span><span>Verilog</span><span>UTF-8</span></div>
  </div>
}

function LogPanel({ params }) {
  const { run, logs } = params
  return <div className="h-full bg-[#0B1220] text-[#CBD5E1] font-mono text-[11px] p-3 overflow-auto"><div className="flex items-center gap-2 text-[#D4AF37] mb-2"><TerminalSquare size={13} aria-hidden="true" />Run output</div>{run ? <><p>{run.run_id} · {run.current_stage} · {run.progress || 0}%</p>{logs.length ? logs.map((line, index) => <p key={index} className="text-[#94A3B8]">{line}</p>) : <p className="text-[#64748B]">Waiting for live stage output…</p>}</> : <p className="text-[#64748B]">Start a run to attach live status here.</p>}</div>
}

function MetricsPanel({ params }) {
  const { run } = params
  return <div className="h-full bg-[#FAFAF8] p-3 text-[11px] text-abyss-ink"><h3 className="font-semibold border-b border-stone-ridge pb-2 mb-2">Properties & metrics</h3>{run ? <dl className="space-y-2">{[["Status", run.status], ["Stage", run.current_stage], ["WNS", run.wns ?? "—"], ["Utilization", run.utilization == null ? "—" : run.utilization + "%"], ["QoR", run.qor_score ?? "—"]].map(([label, value]) => <div key={label} className="flex justify-between gap-2"><dt className="text-[#6B7280]">{label}</dt><dd className="font-medium">{value}</dd></div>)}</dl> : <p className="text-[#6B7280]">Run metrics appear here.</p>}</div>
}

function CommandPalette({ open, onClose, actions }) {
  const [query, setQuery] = useState("")
  const [index, setIndex] = useState(0)
  useEffect(() => { if (open) { setQuery(""); setIndex(0) } }, [open])
  if (!open) return null
  const filtered = actions.filter(action => action.label.toLowerCase().includes(query.toLowerCase()))
  const selected = filtered[index] || filtered[0]
  const execute = () => { if (selected) { selected.run(); onClose() } }
  return <div className="fixed inset-0 z-[70] bg-black/30 flex items-start justify-center pt-20" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <div role="dialog" aria-label="Command Palette" className="w-[min(600px,90vw)] bg-white rounded-lg shadow-2xl overflow-hidden border border-stone-ridge">
      <input autoFocus value={query} onChange={event => { setQuery(event.target.value); setIndex(0) }} onKeyDown={event => { if (event.key === "Escape") onClose(); if (event.key === "ArrowDown") { event.preventDefault(); setIndex(value => Math.min(value + 1, filtered.length - 1)) } if (event.key === "ArrowUp") { event.preventDefault(); setIndex(value => Math.max(value - 1, 0)) } if (event.key === "Enter") execute() }} placeholder="Type a command…" className="w-full px-4 py-3 text-sm outline-none border-b border-stone-ridge" />
      <div className="max-h-80 overflow-auto">{filtered.map((action, actionIndex) => <button type="button" key={action.label} className={'w-full text-left px-4 py-2 text-xs ' + (actionIndex === index ? "bg-[#E8EEF8]" : "hover:bg-[#FAFAF8]")} onClick={() => { action.run(); onClose() }}>{action.label}</button>)}{!filtered.length && <p className="px-4 py-4 text-xs text-[#6B7280]">No matching commands.</p>}</div>
    </div>
  </div>
}

function SearchPanel({ open, query, results, onQuery, onSelect, onClose }) {
  if (!open) return null
  return <div className="absolute z-40 top-16 right-4 w-[min(620px,90vw)] bg-white border border-stone-ridge rounded shadow-xl p-3"><div className="flex gap-2"><Search size={14} className="mt-2 text-[#6B7280]" /><input autoFocus value={query} onChange={event => onQuery(event.target.value)} onKeyDown={event => { if (event.key === "Escape") onClose() }} placeholder="Search in files…" className="flex-1 border-b border-stone-ridge px-1 py-1 text-xs outline-none" /><button type="button" onClick={onClose} aria-label="Close search"><X size={14} /></button></div><div className="max-h-72 overflow-auto mt-2">{results.map(result => <button type="button" key={result.path + result.line} onClick={() => onSelect(result)} className="block w-full text-left px-2 py-1.5 hover:bg-[#E8EEF8] text-[10px]"><span className="font-semibold">{baseName(result.path)}:{result.line}</span><span className="block text-[#6B7280] truncate">{result.text}</span></button>)}{query.length > 1 && !results.length && <p className="text-[10px] text-[#6B7280] p-2">No matches.</p>}</div></div>
}

export default function WorkbenchPage() {
  const [designPath, setDesignPath] = useState("examples/counter")
  const debouncedDesignPath = useDebouncedValue(designPath)
  const [tree, setTree] = useState(null)
  const [openFiles, setOpenFiles] = useState({})
  const [activePath, setActivePath] = useState("")
  const [run, setRun] = useState(null)
  const [logs, setLogs] = useState([])
  const [message, setMessage] = useState("")
  const [focusPath, setFocusPath] = useState("")
  const [revealLine, setRevealLine] = useState(0)
  const [minimapEnabled, setMinimapEnabled] = useState(true)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [includeAll, setIncludeAll] = useState(false)
  const panelsRef = useRef({})
  const dirtyRef = useRef({})
  const fetchTree = useCallback((all = includeAll) => fetch(API_BASE + "/api/fs/tree?path=" + encodeURIComponent(debouncedDesignPath) + "&include_all=" + all).then(response => response.ok ? response.json() : response.json().then(data => Promise.reject(new Error(data.detail || "Unable to load tree")))).then(setTree).catch(error => setMessage(error.message)), [debouncedDesignPath, includeAll])
  useEffect(() => { fetchTree() }, [fetchTree])
  const refreshTree = useCallback(all => { setIncludeAll(all); fetchTree(all) }, [fetchTree])
  useEffect(() => { dirtyRef.current = Object.fromEntries(Object.entries(openFiles).map(([path, file]) => [path, isDirty(file)])) }, [openFiles])
  useEffect(() => { const handleBeforeUnload = event => { if (Object.values(dirtyRef.current).some(Boolean)) { event.preventDefault(); event.returnValue = "" } }; window.addEventListener("beforeunload", handleBeforeUnload); return () => window.removeEventListener("beforeunload", handleBeforeUnload) }, [])
  useEffect(() => { if (!run?.run_id) return undefined; const id = setInterval(() => fetch(API_BASE + "/runs/" + encodeURIComponent(run.run_id)).then(response => response.ok ? response.json() : null).then(data => { if (data) setRun(data); if (data?.current_stage) setLogs(previous => [...previous.slice(-40), new Date().toLocaleTimeString() + "  " + data.current_stage + "  " + (data.progress || 0) + "%"]) }).catch(() => {}), 1500); return () => clearInterval(id) }, [run?.run_id])
  const openFile = useCallback(path => {
    if (openFiles[path]) { setActivePath(path); return Promise.resolve() }
    return fetch(API_BASE + "/api/fs/file?path=" + encodeURIComponent(path)).then(response => response.ok ? response.json() : response.json().then(data => Promise.reject(new Error(data.detail || "Unable to open file")))).then(data => { setOpenFiles(previous => ({ ...previous, [data.path]: { ...data, savedContent: data.content } })); setActivePath(data.path); setRevealLine(0) }).catch(error => setMessage(error.message))
  }, [openFiles])
  const changeFile = useCallback((path, content) => setOpenFiles(previous => previous[path] ? { ...previous, [path]: { ...previous[path], content } } : previous), [])
  const saveFile = useCallback(async path => {
    const targetPath = path || activePath
    const file = openFiles[targetPath]
    if (!file || !isDirty(file)) return true
    try {
      if (!isElectron) throw new Error("Browser mode is read-only; open the desktop shell to save RTL.")
      await window.gliFlowDesktop.writeFile({ path: file.path, content: file.content })
      setOpenFiles(previous => previous[targetPath] ? { ...previous, [targetPath]: { ...previous[targetPath], savedContent: previous[targetPath].content } } : previous)
      setMessage("Saved " + baseName(targetPath))
      return true
    } catch (error) { setMessage(error.message); return false }
  }, [activePath, openFiles])
  const saveAll = useCallback(async () => { let ok = true; for (const path of Object.keys(openFiles)) if (isDirty(openFiles[path])) ok = await saveFile(path) && ok; return ok }, [openFiles, saveFile])
  const closeTab = useCallback(async path => {
    const file = openFiles[path]
    if (!file) return
    if (isDirty(file)) {
      const save = window.confirm(baseName(path) + " has unsaved changes. Press OK to save before closing, or Cancel to discard them.")
      if (save && !(await saveFile(path))) return
    }
    setOpenFiles(previous => { const next = { ...previous }; delete next[path]; return next })
    if (activePath === path) {
      const remaining = Object.keys(openFiles).filter(item => item !== path)
      setActivePath(remaining[remaining.length - 1] || "")
    }
  }, [activePath, openFiles, saveFile])
  const closeAll = useCallback(async () => { for (const path of Object.keys(openFiles)) await closeTab(path) }, [openFiles, closeTab])
  const createEntry = useCallback(async (base, type) => {
    if (!isElectron) { setMessage("Browser mode is read-only; open the desktop shell for file operations."); return }
    const name = window.prompt(type === "directory" ? "New folder name" : "New file name")
    if (!name) return
    const path = base.replace(/[\\\\/]$/, "") + "/" + name
    try { await window.gliFlowDesktop.createFile({ path, type }); setMessage("Created " + name); fetchTree() } catch (error) { setMessage(error.message) }
  }, [fetchTree])
  const renameEntry = useCallback(async node => {
    const name = window.prompt("Rename " + node.name, node.name)
    if (!name || name === node.name) return
    try {
      const newPath = parentPath(node.path) + "/" + name
      await window.gliFlowDesktop.renameFile({ path: node.path, newPath })
      if (openFiles[node.path]) { setOpenFiles(previous => { const next = { ...previous, [newPath]: { ...previous[node.path], path: newPath } }; delete next[node.path]; return next }); setActivePath(current => current === node.path ? newPath : current) }
      fetchTree(); setMessage("Renamed " + node.name)
    } catch (error) { setMessage(error.message) }
  }, [fetchTree, openFiles])
  const deleteEntry = useCallback(async node => {
    if (!window.confirm("Delete " + node.name + "? This cannot be undone.")) return
    try { await window.gliFlowDesktop.deleteFile({ path: node.path }); if (openFiles[node.path]) { setOpenFiles(previous => { const next = { ...previous }; delete next[node.path]; return next }); if (activePath === node.path) setActivePath("") } fetchTree(); setMessage("Deleted " + node.name) } catch (error) { setMessage(error.message) }
  }, [activePath, fetchTree, openFiles])
  const runDesign = useCallback(async () => { setMessage(""); const response = await fetch(API_BASE + "/api/run", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ design_path: designPath, mock: true }) }); const data = await response.json(); if (!response.ok) setMessage(data.detail || "Run failed to start"); else { setRun(data); setMessage("Started " + data.run_id) } }, [designPath])
  const activeFile = openFiles[activePath] || null
  const focusTreePath = path => { setFocusPath(path); setMessage("Tree focused on " + baseName(path)) }
  const searchFiles = useCallback(query => { setSearchQuery(query); if (query.trim().length < 2) { setSearchResults([]); return } fetch(API_BASE + "/api/fs/search?path=" + encodeURIComponent(designPath) + "&q=" + encodeURIComponent(query.trim())).then(response => response.ok ? response.json() : response.json().then(data => Promise.reject(new Error(data.detail || "Search failed")))).then(data => setSearchResults(data.results || [])).catch(error => setMessage(error.message)) }, [designPath])
  const selectSearchResult = result => { openFile(result.path).then(() => { setRevealLine(result.line); setSearchOpen(false) }) }
  const actionList = useMemo(() => [
    { label: "Save", run: () => saveFile() },
    { label: "Save All", run: () => saveAll() },
    { label: "Close Tab", run: () => closeTab(activePath) },
    { label: "Close All Tabs", run: () => closeAll() },
    { label: "Run This Design", run: () => runDesign() },
    { label: "New File", run: () => createEntry(tree?.root || designPath, "file") },
    { label: "New Folder", run: () => createEntry(tree?.root || designPath, "directory") },
    { label: "Toggle Minimap", run: () => setMinimapEnabled(value => !value) },
    { label: "Search in Files", run: () => setSearchOpen(true) },
  ], [activePath, closeAll, closeTab, createEntry, designPath, runDesign, saveAll, saveFile, tree?.root])
  const panelParams = useMemo(() => ({
    files: { tree, onOpen: openFile, onRefresh: refreshTree, onCreate: createEntry, onRename: renameEntry, onDelete: deleteEntry, focusPath: focusPath, includeAll },
    editor: { activeFile, tabs: Object.values(openFiles), onSelect: setActivePath, onClose: closeTab, onChange: changeFile, onSave: () => saveFile(), onCommandPalette: () => setPaletteOpen(true), onRevealLine: setRevealLine, revealLine, minimapEnabled, onToggleMinimap: () => setMinimapEnabled(value => !value), onJump: focusTreePath },
    logs: { run, logs },
    metrics: { run },
  }), [activeFile, changeFile, closeTab, createEntry, deleteEntry, focusPath, includeAll, openFile, openFiles, refreshTree, renameEntry, run, logs, saveFile, revealLine, minimapEnabled, tree])
  const components = useMemo(() => ({ files: props => <FileTreePanel {...props} />, editor: props => <EditorPanel {...props} />, logs: props => <LogPanel {...props} />, metrics: props => <MetricsPanel {...props} /> }), [])
  useEffect(() => { Object.entries(panelParams).forEach(([id, params]) => panelsRef.current[id]?.api.updateParameters(params)) }, [panelParams])
  const handleReady = useCallback(event => { const addPanel = (id, title, position) => { const panel = event.api.addPanel({ id, component: id, title, position, params: panelParams[id] }); panelsRef.current[id] = panel }; addPanel("files", "Design Files", { direction: "left" }); addPanel("editor", "RTL Editor", { direction: "right" }); addPanel("logs", "Run Output", { direction: "below", referencePanel: "editor" }); addPanel("metrics", "Metrics", { direction: "right", referencePanel: "editor" }) }, [panelParams])
  return <main className="relative h-[calc(100vh-120px)] min-h-[620px] flex flex-col gap-3" aria-labelledby="workbench-title">
    <div className="flex flex-wrap items-center gap-2"><div className="flex-1"><h1 id="workbench-title" className="font-[Playfair_Display] text-[20px] text-abyss-ink">RTL Workbench</h1><p className="text-[11px] text-[#6B7280]">VS Code-like tabs, Monaco editing, outline navigation, live run output, and metrics.</p></div><input value={designPath} onChange={event => setDesignPath(event.target.value)} aria-label="Design folder path" className="border border-stone-ridge rounded px-2 py-1 text-xs w-64 focus-visible:outline-2 focus-visible:outline-blue-600" /><button type="button" onClick={() => fetchTree()} className="rounded border px-2 py-1 text-xs focus-visible:outline-2 focus-visible:outline-blue-600">Load</button><button type="button" onClick={() => setSearchOpen(value => !value)} title="Search in files" aria-label="Search in files" className="rounded border p-1.5 focus-visible:outline-2 focus-visible:outline-blue-600"><Search size={14} /></button><button type="button" onClick={() => setPaletteOpen(true)} title="Command palette (Ctrl+Shift+P)" aria-label="Open command palette" className="rounded border p-1.5 focus-visible:outline-2 focus-visible:outline-blue-600"><PanelTop size={14} /></button><button type="button" onClick={runDesign} className="inline-flex items-center gap-1 rounded bg-abyss-ink text-white px-3 py-1 text-xs focus-visible:outline-2 focus-visible:outline-blue-600"><Play size={12} aria-hidden="true" />Run this design</button></div>
    {message && <p role="status" className="text-xs text-[#2563EB]">{message}</p>}
    <div className="flex-1 min-h-0"><DockviewReact className="dockview-theme-dark h-full" components={components} onReady={handleReady} /></div>
    <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} actions={actionList} />
    <SearchPanel open={searchOpen} query={searchQuery} results={searchResults} onQuery={searchFiles} onSelect={selectSearchResult} onClose={() => setSearchOpen(false)} />
  </main>
}
