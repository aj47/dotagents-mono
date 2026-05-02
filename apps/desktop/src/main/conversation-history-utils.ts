/**
 * Utility functions for filtering and processing conversation history.
 * Dependency-light module for handling ephemeral messages.
 */

import { INTERNAL_COMPLETION_NUDGE_TEXT } from "../shared/runtime-tool-names"

/**
 * Message type with optional ephemeral flag for internal nudges.
 * Ephemeral messages are included in LLM context but excluded from:
 * - Persisted conversation history
 * - Progress UI display
 * - Returned conversation history
 */
export interface ConversationMessage {
  role: "user" | "assistant" | "tool"
  content: string
  toolCalls?: unknown[]
  toolResults?: unknown[]
  timestamp?: number
  ephemeral?: boolean
}

type WithEphemeralFlag = { ephemeral?: boolean }
type ConversationLike = { role: string; content?: string }

export const MAPPED_TOOL_RESULT_PREFIX_RE = /^\[((?=[^\]]*[a-z])[A-Za-z0-9._:/-]+)\]\s(?:ERROR:\s*)?/

const GENERATED_CONTEXT_SUMMARY_PREFIXES = [
  "[Earlier Context Summary:",
  "[Session Progress Summary]",
  "[Archived Background Summary",
] as const

const INTERNAL_NUDGE_EXACT_MATCHES = [
  INTERNAL_COMPLETION_NUDGE_TEXT,
] as const

const INTERNAL_NUDGE_PATTERNS = [
  "Please either take action using available tools",
  "You have relevant tools available for this request",
  "Your previous response was empty",
  "Previous request had empty response.",
  "Verifier indicates the task is not complete",
  "Please respond with a valid JSON object",
  "Use available tools directly via native function-calling",
  "Provide a complete final answer",
  "Your last response was not a final deliverable",
  "Your last response was empty or non-deliverable",
  "Continue and finish remaining work",
  "Continue only the current unresolved request described above",
  "Your previous response only described the next step instead of actually doing it.",
  "Your previous response contained text like \"[Calling tools: ...]\" instead of an actual tool call.",
] as const

export function isInternalNudgeContent(content?: string): boolean {
  const trimmed = typeof content === "string" ? content.trim() : ""
  if (!trimmed) return false

  if (INTERNAL_NUDGE_EXACT_MATCHES.includes(trimmed as (typeof INTERNAL_NUDGE_EXACT_MATCHES)[number])) {
    return true
  }

  return INTERNAL_NUDGE_PATTERNS.some((pattern) => trimmed.includes(pattern))
}

export function hasMappedToolResultPrefix(content?: string): boolean {
  return typeof content === "string" && MAPPED_TOOL_RESULT_PREFIX_RE.test(content.trimStart())
}

export function isGeneratedContextSummaryContent(content?: string): boolean {
  const trimmed = typeof content === "string" ? content.trimStart() : ""
  return GENERATED_CONTEXT_SUMMARY_PREFIXES.some((prefix) => trimmed.startsWith(prefix))
}

export function isRealUserRequestContent(content?: string): boolean {
  const trimmed = typeof content === "string" ? content.trimStart() : ""
  if (!trimmed) return false
  if (hasMappedToolResultPrefix(trimmed)) return false
  if (trimmed.startsWith("TOOL FAILED:")) return false
  if (isGeneratedContextSummaryContent(trimmed)) return false
  if (isInternalNudgeContent(trimmed)) return false
  return true
}

export function collectRecentRealUserRequestIndices<T extends ConversationLike>(
  messages: T[],
  limit = 2,
  beforeIndex = messages.length,
  maxContentChars = Number.POSITIVE_INFINITY,
): number[] {
  const indices: number[] = []
  const end = Math.max(0, Math.min(beforeIndex, messages.length))

  for (let index = end - 1; index >= 0 && indices.length < limit; index--) {
    const message = messages[index]
    if (
      message?.role === "user"
      && (message.content?.length ?? 0) <= maxContentChars
      && isRealUserRequestContent(message.content)
    ) {
      indices.push(index)
    }
  }

  return indices.reverse()
}

/**
 * Filter out ephemeral messages from conversation history.
 * Returns a new array without the ephemeral flag exposed.
 */
export function filterEphemeralMessages<T extends WithEphemeralFlag>(
  history: T[],
): Array<Omit<T, "ephemeral">> {
  return history
    .filter((msg) => !msg.ephemeral)
    .map((msg) => {
      const { ephemeral: _ephemeral, ...rest } = msg
      return rest as Omit<T, "ephemeral">
    })
}
