export default function AISuggestionBadge({ runId, evidencePath = "" }) {
  return <span className="inline-flex items-center gap-1 text-[10px] rounded-full bg-[#F3E8FF] text-[#6B21A8] px-2 py-0.5" title={`AI-derived suggestion linked to ${runId}${evidencePath ? `/${evidencePath}` : ""}`} aria-label={`AI suggested, evidence from run ${runId}`}>AI suggested · evidence linked</span>
}
