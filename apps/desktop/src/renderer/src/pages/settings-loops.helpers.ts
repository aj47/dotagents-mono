export function formatLoopIntervalDraft(minutes?: number): string {
  const normalizedMinutes = typeof minutes === "number" && Number.isFinite(minutes)
    ? Math.floor(minutes)
    : 0

  return normalizedMinutes >= 1 ? String(normalizedMinutes) : "1"
}

export function parseLoopIntervalDraft(draft: string): number | null {
  const trimmedDraft = draft.trim()
  if (!/^[0-9]+$/.test(trimmedDraft)) return null

  const parsed = Number(trimmedDraft)
  if (!Number.isInteger(parsed) || parsed < 1) return null

  return parsed
}

export function formatFailureSummary(message?: string): string {
  const compact = (message ?? "").replace(/\s+/g, " ").trim()
  if (!compact) return "The latest run failed."
  return compact.length > 180 ? `${compact.slice(0, 177).trimEnd()}...` : compact
}

export function getLoopFailureHeadline(loop: {
  autoPausedAt?: number
  consecutiveFailures?: number
}): string {
  if (loop.autoPausedAt) {
    return `Auto-paused after ${loop.consecutiveFailures ?? 0} consecutive failed automatic runs`
  }

  return "Latest failure"
}

export function getLoopEnabledLabel(loop: {
  enabled: boolean
  autoPausedAt?: number
}): string {
  if (loop.enabled) return "Enabled"
  return loop.autoPausedAt ? "Auto-paused" : "Disabled"
}
