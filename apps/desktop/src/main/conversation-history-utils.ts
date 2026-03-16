/**
 * Utility functions for filtering and processing conversation history.
 * Dependency-light module for handling ephemeral messages.
 */

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
  "Your previous response only described the next step instead of actually doing it.",
  "Your previous response contained text like \"[Calling tools: ...]\" instead of an actual tool call.",
] as const

export function isInternalNudgeContent(content?: string): boolean {
  const trimmed = typeof content === "string" ? content.trim() : ""
  if (!trimmed) return false

  return INTERNAL_NUDGE_PATTERNS.some((pattern) => trimmed.includes(pattern))
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

/**
 * Check if a message is ephemeral.
 */
export function isEphemeralMessage<T extends WithEphemeralFlag>(
  msg: T,
): msg is T & { ephemeral: true } {
  return msg.ephemeral === true
}
