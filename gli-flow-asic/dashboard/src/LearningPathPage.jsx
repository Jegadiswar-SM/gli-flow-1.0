import { useState } from "react"
import { CheckCircle2, Play, FlaskConical } from "lucide-react"

const API_BASE = import.meta.env.VITE_API_URL || ""
const STEPS = [
  { id: "counter", title: "Counter", concept: "RTL describes hardware as clocked signals and combinational logic.", lesson: "RTL → synthesis → simulation" },
  { id: "gcd", title: "GCD", concept: "Synthesis turns RTL into a gate-level implementation, then floorplanning places its boundaries.", lesson: "Synthesis → floorplan → placement" },
  { id: "uart", title: "UART", concept: "Placement and routing connect cells; STA, DRC, and LVS check timing and physical correctness.", lesson: "Routing → STA → DRC → LVS" },
  { id: "user_rtl", title: "Your RTL", concept: "Apply the same flow to a design you understand, and treat simulated metrics as learning feedback.", lesson: "Simulation → interpretation → iteration" },
]

export default function LearningPathPage() {
  const [completed, setCompleted] = useState([])
  const [runs, setRuns] = useState([])
  const [showExperiments, setShowExperiments] = useState(false)
  const [parameters, setParameters] = useState({ clock_period_ns: 10, utilization: 35, rtl_width: 8 })
  const [busy, setBusy] = useState(null)
  const [message, setMessage] = useState("")

  async function runStep(step) {
    setBusy(step.id); setMessage("")
    try {
      const response = await fetch(`${API_BASE}/learning-path/run`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ step: step.id, mock: true, parameters }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || "The learning run could not start")
      setRuns(prev => [data, ...prev]); setCompleted(prev => [...new Set([...prev, step.id])])
    } catch (error) { setMessage(error.message) } finally { setBusy(null) }
  }

  return <main className="space-y-6" aria-labelledby="learning-title">
    <div><p className="text-xs uppercase tracking-widest text-[#92751A]">Guided, sandboxed practice</p><h1 id="learning-title" className="font-[Playfair_Display] text-[24px] text-abyss-ink">Learning path</h1><p className="text-sm text-[#52606D] mt-1">Four small runs teach the flow from counter to user RTL. Every metric here is simulated and labelled.</p></div>
    <section className="bg-white border border-stone-ridge rounded-lg p-5" aria-labelledby="experiment-title">
      <div className="flex items-center gap-2"><FlaskConical size={18} aria-hidden="true" /><h2 id="experiment-title" className="font-semibold">Sandbox experiments</h2></div>
      <div className="grid sm:grid-cols-3 gap-4 mt-4 text-sm">
        {[["clock_period_ns", "Clock period (ns)"], ["utilization", "Utilization (%)"], ["rtl_width", "RTL width (bits)"]].map(([key, label]) => <label key={key} className="flex flex-col gap-1">{label}<input aria-label={label} className="border border-stone-ridge rounded px-2 py-1 focus-visible:outline-2 focus-visible:outline-blue-600" type="number" value={parameters[key]} onChange={e => setParameters({...parameters, [key]: Number(e.target.value)})} /></label>)}
      </div>
    </section>
    <section className="grid gap-4" aria-label="Learning steps">
      {STEPS.map((step, index) => <article key={step.id} className="bg-white border border-stone-ridge rounded-lg p-5 flex flex-col md:flex-row md:items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center font-bold" aria-label={`Step ${index + 1}`}>{completed.includes(step.id) ? <CheckCircle2 size={20} aria-label="Completed" /> : index + 1}</div>
        <div className="flex-1"><h2 className="font-semibold text-abyss-ink">{step.title}</h2><p className="text-sm text-[#52606D] mt-1">{step.concept}</p><p className="text-xs text-[#92751A] mt-2">Concepts: {step.lesson}</p></div>
        <button type="button" onClick={() => runStep(step)} disabled={busy === step.id} className="inline-flex items-center justify-center gap-2 rounded bg-abyss-ink text-white px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-50"><Play size={14} aria-hidden="true" />{busy === step.id ? "Running…" : completed.includes(step.id) ? "Run again" : "Run mock step"}</button>
      </article>)}
    </section>
    {message && <p role="alert" className="text-sm text-[#991B1B]">{message}</p>}
    <section className="bg-white border border-stone-ridge rounded-lg p-5" aria-labelledby="experiment-runs-title">
      <div className="flex items-center justify-between gap-4"><h2 id="experiment-runs-title" className="font-semibold">Learning runs</h2><label className="text-sm flex items-center gap-2"><input type="checkbox" checked={showExperiments} onChange={e => setShowExperiments(e.target.checked)} /> Show experiments in history</label></div>
      {!showExperiments ? <p className="text-sm text-[#52606D] mt-3">Experiments are hidden from the main run history by default. Enable the toggle to review this session.</p> : runs.length === 0 ? <p className="text-sm text-[#52606D] mt-3">Run a step above to create your first experiment.</p> : <ul className="mt-3 space-y-2">{runs.map(run => <li key={run.run_id} className="text-sm flex justify-between border-t pt-2"><span>{run.step} · {run.run_id}</span><span className="text-xs text-[#92751A]">SIMULATED / EXPERIMENT</span></li>)}</ul>}
    </section>
  </main>
}
