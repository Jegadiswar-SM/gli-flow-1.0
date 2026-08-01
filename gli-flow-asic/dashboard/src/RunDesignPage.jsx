import { useEffect, useState } from "react"
import { Play, Terminal, BookOpen, FolderOpen } from "lucide-react"
import { isElectron } from "./lib/platform"

export default function RunDesignPage() {
  const API_BASE = import.meta.env.VITE_API_URL || ""
  const [designPath, setDesignPath] = useState("examples/counter")
  const [mock, setMock] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [run, setRun] = useState(null)
  const commands = [
    { label: "Run with mock mode", cmd: "gli-flow run examples/counter --mock", desc: "Quick test run using mock mode" },
    { label: "Run full flow", cmd: "gli-flow run examples/gcd", desc: "Full RTL-to-GDS run" },
    { label: "Run with threads", cmd: "gli-flow run examples/counter --threads 4", desc: "Run with four parallel workers" },
    { label: "Batch run", cmd: "gli-flow batch examples/counter examples/gcd", desc: "Execute multiple designs" },
  ]

  const runDesign = async () => {
    setBusy(true)
    setMessage("")
    try {
      const response = await fetch(`${API_BASE}/api/run`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ design_path: designPath.trim(), mock }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || "Run could not be started")
      setRun(data)
      setMessage(`Started ${data.run_id}`)
    } catch (error) {
      setMessage(error.message || "Run could not be started")
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (!run?.run_id || ["SUCCESS", "FAILED", "COMPLETED"].includes(run.status)) return undefined
    const timer = setInterval(() => {
      fetch(`${API_BASE}/runs/${encodeURIComponent(run.run_id)}`)
        .then(response => response.ok ? response.json() : null)
        .then(data => { if (data) setRun(data) })
        .catch(() => {})
    }, 1500)
    return () => clearInterval(timer)
  }, [API_BASE, run?.run_id, run?.status])

  return (
    <div className="space-y-6">
      <h1 className="font-[Playfair_Display] text-[20px] text-abyss-ink">Run Design</h1>

      <div className="bg-white border border-stone-ridge rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-meridian-gold flex items-center justify-center">
            <Play size={20} className="text-abyss-ink ml-0.5" />
          </div>
          <div>
            <h2 className="font-[Playfair_Display] text-[18px] text-abyss-ink">Execute an ASIC Design</h2>
            <p className="text-xs text-[#6B7280] font-[Work_Sans]">Run the GLI-FLOW RTL-to-GDS pipeline</p>
          </div>
        </div>

        <div className="mb-5">
          <label htmlFor="design-path" className="block text-xs font-semibold text-abyss-ink mb-1">Design folder</label>
          <div className="flex gap-2">
            <input id="design-path" value={designPath} onChange={event => setDesignPath(event.target.value)} placeholder="examples/counter or /path/to/design" className="flex-1 border border-stone-ridge rounded px-3 py-2 text-xs focus-visible:outline-2 focus-visible:outline-blue-600" />
            {isElectron && <button type="button" onClick={async () => { const selected = await window.gliFlowDesktop.selectDirectory(); if (selected) setDesignPath(selected) }} className="inline-flex items-center gap-1 rounded border border-stone-ridge px-3 py-2 text-xs hover:bg-[#FAFAF8] focus-visible:outline-2 focus-visible:outline-blue-600"><FolderOpen size={14} aria-hidden="true" />Browse…</button>}
          </div>
            <p className="text-[10px] text-[#6B7280] mt-1">{isElectron ? "Native folder access is available in the desktop shell." : "Enter a design path relative to the workspace or an approved absolute path."}</p>
          </div>

          <div className="flex items-center justify-between gap-3 mb-5">
            <label className="inline-flex items-center gap-2 text-xs text-abyss-ink">
              <input type="checkbox" checked={mock} onChange={event => setMock(event.target.checked)} />
              Mock mode (no EDA tools required)
            </label>
            <button type="button" onClick={runDesign} disabled={busy || !designPath.trim()} className="rounded bg-abyss-ink px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-blue-600">
              {busy ? "Starting…" : "Run design"}
            </button>
          </div>

          {message && <p role="status" className="mb-3 rounded border border-stone-ridge bg-[#FAFAF8] px-3 py-2 text-xs text-abyss-ink">{message}</p>}
          {run && <div className="mb-5 rounded border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-2 text-xs text-[#1E40AF]">Status: <strong>{run.status || "STARTING"}</strong>{run.current_stage ? ` · ${run.current_stage}` : ""}{run.progress != null ? ` · ${run.progress}%` : ""}</div>}

        <p className="text-xs text-[#6B7280] font-[Work_Sans] mb-5 leading-relaxed">
          Use the GLI-FLOW CLI to execute designs through the 29-stage RTL-to-GDS implementation pipeline.
          The pipeline uses OpenROAD, Yosys, KLayout, Magic, and Netgen for a complete ASIC implementation flow.
        </p>

        <div className="space-y-3">
          {commands.map((c, i) => (
            <div key={i} className="border border-stone-ridge rounded-lg p-4 hover:bg-[#FAFAF8] transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <Terminal size={14} className="text-[#6B7280]" />
                <span className="text-xs font-semibold text-abyss-ink">{c.label}</span>
              </div>
              <code className="block text-[11px] bg-[#F3F2ED] text-abyss-ink px-3 py-2 rounded font-mono mt-1">{c.cmd}</code>
              <p className="text-[10px] text-[#6B7280] mt-1">{c.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg">
          <div className="flex items-center gap-2">
            <BookOpen size={14} color="#3B82F6" />
            <span className="text-xs text-[#2563EB] font-medium">Tip: Use <code className="bg-white px-1 rounded text-[10px]">--mock</code> flag for quick testing without EDA tools</span>
          </div>
        </div>
      </div>
    </div>
  )
}
