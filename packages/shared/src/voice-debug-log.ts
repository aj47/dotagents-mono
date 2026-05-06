import type { HandsFreeDebugEventType } from "./types"

export type VoiceDebugEntry = {
  id: string
  at: number
  type: HandsFreeDebugEventType
  summary: string
  detail?: Record<string, unknown>
}

export type VoiceDebugLog = (
  type: HandsFreeDebugEventType,
  summary: string,
  detail?: Record<string, unknown>,
) => void

export const MAX_VOICE_DEBUG_EVENTS = 20

export function formatVoiceDebugEntry(entry: VoiceDebugEntry): string {
  const timestamp = new Date(entry.at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
  return `${timestamp} · ${entry.summary}`
}

export function prependVoiceDebugEntry(
  events: readonly VoiceDebugEntry[],
  entry: VoiceDebugEntry,
  limit = MAX_VOICE_DEBUG_EVENTS,
): VoiceDebugEntry[] {
  const normalizedLimit = Math.max(0, Math.floor(limit))
  return [entry, ...events].slice(0, normalizedLimit)
}
