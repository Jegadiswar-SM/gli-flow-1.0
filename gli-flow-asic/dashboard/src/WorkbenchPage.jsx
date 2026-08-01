import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Editor from "@monaco-editor/react"
import { DockviewReact } from "dockview-react"
import "dockview-react/dist/styles/dockview.css"
import { Code2, FolderTree, Play, Save, TerminalSquare } from "lucide-react"
import { isElectron } from "./lib/platform"
import { GLI_THEME } from "./lib/theme"

const API_BASE = import.meta.env.VITE_API_URL || ""

function TreeNode({ node, onOpen }) {
  const [open, setOpen] = useState(node.type === "directory")
  if (node.type === "file") return <button type="button" className="block w-full text-left px-2 py-1 text-[11px] hover:bg-[#E8EEF8] focus-visible:outline-2 focus-visible:outline-blue-600" onClick={() => onOpen(node.path)}><Code2 size={12} className="inline mr-1 text-[#2563EB]" aria-hidden="true" />{node.name}</button>
  return <div><button type="button" className="block w-full text-left px-2 py-1 text-[11px] font-medium hover:bg-[#E8EEF8] focus-visible:outline-2 focus-visible:outline-blue-600" onClick={() => setOpen(value => !value)}><FolderTree size={12} className="inline mr-1 text-[#92751A]" aria-hidden="true" />{open ? "▾" : "▸"} {node.name}</button>{open && <div className="pl-3 border-l border-[#D1D5DB] ml-3">{node.children?.map(child => <TreeNode key={child.path} node={child} onOpen={onOpen} />)}</div>}</div>
}

function FileTreePanel({ tree, onOpen, onRefresh }) {
  const [includeAll, setIncludeAll] = useState(false)
  return <div className="h-full overflow-auto bg-[#FAFAF8] text-abyss-ink"><div className="flex items-center justify-between p-2 border-b border-stone-ridge"><span className="text-[11px] font-semibold">Design files</span><label className="text-[9px] flex items-center gap-1"><input type="checkbox" checked={includeAll} onChange={event => { setIncludeAll(event.target.checked); onRefresh(event.target.checked) }} /> all</label></div><div className="p-2">{tree?.children?.length ? tree.children.map(node => <TreeNode key={node.path} node={node} onOpen={onOpen} />) : <p className="text-[11px] text-[#6B7280]">Choose a design folder to browse RTL.</p>}</div></div>
}

function EditorPanel({ file, onChange, onSave, dirty }) {
  const editorRef = useRef(null)
  const configure = useCallback((monaco) => {
    monaco.languages.register({ id: "verilog" })
    monaco.languages.setMonarchTokensProvider("verilog", { tokenizer: { root: [[/\/\/.*$/, "comment"], [/\/\*/, "comment", "@comment"], [/[0-9]+('[bodhBODH][0-9a-fA-F_xXzZ?]+)/, "number"], [/[a-zA-Z_][\w$]*/, { cases: { "@keywords": "keyword", "@default": "identifier" } }], [/[{}()[\];,.]/, "delimiter"], [/".*?"/, "string"]], comment: [[/[^*]+/, "comment"], [/\*\//, "comment", "@pop"], [/[*]/, "comment"]] }, keywords: ["module", "endmodule", "input", "output", "inout", "wire", "reg", "logic", "always", "always_ff", "always_comb", "assign", "begin", "end", "if", "else", "case", "endcase", "parameter", "localparam", "posedge", "negedge", "generate", "genvar", "for"] })
    monaco.editor.defineTheme("gli-flow-eda", { base: "vs-dark", inherit: true, rules: [{ token: "keyword", foreground: GLI_THEME.gold.slice(1) }, { token: "comment", foreground: "7C8A9E" }, { token: "number", foreground: "86EFAC" }, { token: "string", foreground: "93C5FD" }, { token: "identifier", foreground: "E2E8F0" }], colors: { "editor.background": GLI_THEME.ink, "editor.foreground": "E2E8F0", "editorCursor.foreground": GLI_THEME.gold, "editor.lineHighlightBackground": "1E293B" } })
  }, [])
  return <div className="h-full flex flex-col bg-[#0F172A]">{file ? <><div className="h-8 flex items-center justify-between px-3 bg-[#1E293B] text-[11px] text-white"><span>{file.path.split(/[\\/]/).pop()} {dirty && <span className="text-[#D4AF37]">●</span>}</span><button type="button" onClick={onSave} disabled={!dirty} className="inline-flex items-center gap-1 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-[#D4AF37]"><Save size={12} aria-hidden="true" />Save</button></div><Editor height="100%" theme="gli-flow-eda" language="verilog" value={file.content} onChange={value => onChange(value || "")} beforeMount={configure} onMount={editor => { editorRef.current = editor }} options={{ minimap: { enabled: false }, fontSize: 13, automaticLayout: true, wordWrap: "off", padding: { top: 10 } }} /></> : <div className="h-full flex items-center justify-center text-sm text-[#94A3B8]">Open a Verilog/SystemVerilog file from the tree.</div>}</div>
}

function LogPanel({ run, logs }) {
  return <div className="h-full bg-[#0B1220] text-[#CBD5E1] font-mono text-[11px] p-3 overflow-auto"><div className="flex items-center gap-2 text-[#D4AF37] mb-2"><TerminalSquare size={13} aria-hidden="true" />Run output</div>{run ? <><p>{run.run_id} · {run.current_stage} · {run.progress || 0}%</p>{logs.length ? logs.map((line, index) => <p key={index} className="text-[#94A3B8]">{line}</p>) : <p className="text-[#64748B]">Waiting for live stage output…</p>}</> : <p className="text-[#64748B]">Start a run to attach live status here.</p>}</div>
}

function MetricsPanel({ run }) {
  return <div className="h-full bg-[#FAFAF8] p-3 text-[11px] text-abyss-ink"><h3 className="font-semibold border-b border-stone-ridge pb-2 mb-2">Properties & metrics</h3>{run ? <dl className="space-y-2">{[["Status", run.status], ["Stage", run.current_stage], ["WNS", run.wns ?? "—"], ["Utilization", run.utilization == null ? "—" : `${run.utilization}%`], ["QoR", run.qor_score ?? "—"]].map(([label, value]) => <div key={label} className="flex justify-between gap-2"><dt className="text-[#6B7280]">{label}</dt><dd className="font-medium">{value}</dd></div>)}</dl> : <p className="text-[#6B7280]">Run metrics appear here.</p>}</div>
}

export default function WorkbenchPage() {
  const [designPath, setDesignPath] = useState("examples/counter")
  const [tree, setTree] = useState(null)
  const [file, setFile] = useState(null)
  const [dirty, setDirty] = useState(false)
  const [run, setRun] = useState(null)
  const [logs, setLogs] = useState([])
  const [message, setMessage] = useState("")
  const fetchTree = useCallback((includeAll = false) => fetch(`${API_BASE}/api/fs/tree?path=${encodeURIComponent(designPath)}&include_all=${includeAll}`).then(response => response.json()).then(setTree).catch(error => setMessage(error.message)), [designPath])
  useEffect(() => { fetchTree() }, [fetchTree])
  useEffect(() => { if (!run?.run_id) return undefined; const id = setInterval(() => fetch(`${API_BASE}/runs/${encodeURIComponent(run.run_id)}`).then(response => response.ok ? response.json() : null).then(data => { if (data) setRun(data); if (data?.current_stage) setLogs(previous => [...previous.slice(-40), `${new Date().toLocaleTimeString()}  ${data.current_stage}  ${data.progress || 0}%`]) }).catch(() => {}), 1500); return () => clearInterval(id) }, [run?.run_id])
  const openFile = path => fetch(`${API_BASE}/api/fs/file?path=${encodeURIComponent(path)}`).then(response => response.json()).then(data => { setFile(data); setDirty(false) }).catch(error => setMessage(error.message))
  const saveFile = useCallback(async () => { if (!file || !dirty) return; try { if (!isElectron) throw new Error("Browser mode is read-only; open the desktop shell to save RTL."); await window.gliFlowDesktop.writeFile({ path: file.path, content: file.content }); setDirty(false); setMessage("Saved") } catch (error) { setMessage(error.message) } }, [file, dirty])
  const runDesign = async () => { setMessage(""); const response = await fetch(`${API_BASE}/api/run`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ design_path: designPath, mock: true }) }); const data = await response.json(); if (!response.ok) setMessage(data.detail || "Run failed to start"); else { setRun(data); setMessage(`Started ${data.run_id}`) } }
  const components = useMemo(() => ({ files: () => <FileTreePanel tree={tree} onOpen={openFile} onRefresh={fetchTree} />, editor: () => <EditorPanel file={file} dirty={dirty} onChange={content => { setFile(previous => ({ ...previous, content })); setDirty(true) }} onSave={saveFile} />, logs: () => <LogPanel run={run} logs={logs} />, metrics: () => <MetricsPanel run={run} /> }), [tree, file, dirty, run, logs, fetchTree, saveFile])
  return <main className="h-[calc(100vh-120px)] min-h-[620px] flex flex-col gap-3" aria-labelledby="workbench-title"><div className="flex flex-wrap items-center gap-2"><div className="flex-1"><h1 id="workbench-title" className="font-[Playfair_Display] text-[20px] text-abyss-ink">RTL Workbench</h1><p className="text-[11px] text-[#6B7280]">Docked design files, editor, live run output, and metrics.</p></div><input value={designPath} onChange={event => setDesignPath(event.target.value)} aria-label="Design folder path" className="border border-stone-ridge rounded px-2 py-1 text-xs w-64 focus-visible:outline-2 focus-visible:outline-blue-600" /><button type="button" onClick={() => fetchTree()} className="rounded border px-2 py-1 text-xs focus-visible:outline-2 focus-visible:outline-blue-600">Load</button><button type="button" onClick={runDesign} className="inline-flex items-center gap-1 rounded bg-abyss-ink text-white px-3 py-1 text-xs focus-visible:outline-2 focus-visible:outline-blue-600"><Play size={12} aria-hidden="true" />Run this design</button></div>{message && <p role="status" className="text-xs text-[#2563EB]">{message}</p>}<div className="flex-1 min-h-0"><DockviewReact className="dockview-theme-dark h-full" components={components} onReady={event => { event.api.addPanel({ id: "files", component: "files", title: "Design Files", position: { direction: "left" } }); event.api.addPanel({ id: "editor", component: "editor", title: "RTL Editor", position: { direction: "right" } }); event.api.addPanel({ id: "logs", component: "logs", title: "Run Output", position: { direction: "below", referencePanel: "editor" } }); event.api.addPanel({ id: "metrics", component: "metrics", title: "Metrics", position: { direction: "right", referencePanel: "editor" } }) }} /></div></main>
}
