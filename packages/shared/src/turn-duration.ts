/**
 * Per-turn and cumulative agent-turn duration accounting for conversation views.
 *
 * Durations are derived from existing message timestamps so they persist
 * automatically across reloads without schema changes.
 *
 * A "turn" starts at a user message and ends at the latest non-user message
 * before the next user message, or the current time while in progress.
 */

/** Minimal message shape required for turn-duration accounting. */
export interface TurnDurationMessage {
  role: "user" | "assistant" | "tool"
  timestamp: number
  /** Optional flag used for live in-progress thinking placeholders. */
  isThinking?: boolean
}

export interface TurnDurationEntry {
  /** Duration in milliseconds from the user message to the turn end. */
  durationMs: number
  /** True when the turn is still in progress and the duration is ticking live. */
  isLive: boolean
}

export interface TurnDurationsResult {
  /** Per-turn duration keyed by the index of the user message that started the turn. */
  byUserIndex: Map<number, TurnDurationEntry>
  /** Per-turn duration keyed by the timestamp of the user message that started the turn. */
  byUserTimestamp: Map<number, TurnDurationEntry>
  /** Sum of all turn durations, including the currently live turn if any. */
  totalMs: number
  /** True when at least one turn is still in progress. */
  hasLive: boolean
}

/**
 * Compute per-turn and total agent-turn durations for a flat message list.
 *
 * @param messages Ordered conversation messages from oldest to newest.
 * @param isComplete Whether the session is currently idle with no agent run in flight.
 * @param nowMs Current wall-clock time, used for the live in-progress turn.
 */
export function computeTurnDurations(
  messages: TurnDurationMessage[],
  isComplete: boolean,
  nowMs: number,
): TurnDurationsResult {
  const byUserIndex = new Map<number, TurnDurationEntry>()
  const byUserTimestamp = new Map<number, TurnDurationEntry>()
  let totalMs = 0
  let hasLive = false

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    if (msg.role !== "user") continue

    let endTs: number | null = null
    let nextUserIndex = -1
    for (let j = i + 1; j < messages.length; j++) {
      if (messages[j].role === "user") {
        nextUserIndex = j
        break
      }
      if (!messages[j].isThinking) {
        endTs = messages[j].timestamp
      }
    }

    let entry: TurnDurationEntry
    if (nextUserIndex === -1) {
      const isLive = !isComplete
      const effectiveEnd = isLive ? nowMs : (endTs ?? msg.timestamp)
      const durationMs = Math.max(0, effectiveEnd - msg.timestamp)
      entry = { durationMs, isLive }
      if (isLive) hasLive = true
    } else {
      const finalEnd = endTs ?? messages[nextUserIndex].timestamp
      const durationMs = Math.max(0, finalEnd - msg.timestamp)
      entry = { durationMs, isLive: false }
    }
    byUserIndex.set(i, entry)
    byUserTimestamp.set(msg.timestamp, entry)
    totalMs += entry.durationMs
  }

  return { byUserIndex, byUserTimestamp, totalMs, hasLive }
}

/**
 * Format a millisecond duration as a compact human-readable string.
 * Examples: 800ms -> "1s", 12s -> "12s", 75s -> "1m 15s", 3700s -> "1h 1m".
 */
export function formatTurnDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "0s"
  const totalSeconds = Math.max(1, Math.round(ms / 1000))
  if (totalSeconds < 60) return `${totalSeconds}s`
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes < 60) {
    return seconds === 0 ? `${minutes}m` : `${minutes}m ${seconds}s`
  }
  const hours = Math.floor(minutes / 60)
  const remMinutes = minutes % 60
  return remMinutes === 0 ? `${hours}h` : `${hours}h ${remMinutes}m`
}
