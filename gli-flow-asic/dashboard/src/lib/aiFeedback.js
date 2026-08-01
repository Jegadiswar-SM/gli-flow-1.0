const STORAGE_KEY = "gli-flow-ai-ratings"

export function rateAISuggestion(suggestionId, rating) {
  const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
  current[suggestionId] = { rating, rated_at: new Date().toISOString() }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
  return current[suggestionId]
}

export function getAIRating(suggestionId) {
  const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
  return current[suggestionId] || null
}

export function buildAIRatingPayload(suggestionId, telemetryMode) {
  const rating = getAIRating(suggestionId)
  if (!rating || !["full", "atlas"].includes(telemetryMode)) return {}
  return { ai_rating: rating, ai_rating_notice: "This locally stored AI rating is included because telemetry upload is enabled." }
}
