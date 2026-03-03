export const DEFAULT_UNLIMITED_GUARDRAIL_ITERATION_BUDGET = 60
export const AGENT_STOP_NOTE =
  "(Agent mode was stopped by emergency kill switch)"

export interface AgentIterationLimits {
  loopMaxIterations: number
  guardrailBudget: number
}

interface ConversationMessageLike {
  role: string
  content?: string | null
}

export function resolveAgentIterationLimits(
  requestedMaxIterations: number,
): AgentIterationLimits {
  if (requestedMaxIterations === Number.POSITIVE_INFINITY) {
    return {
      loopMaxIterations: Number.POSITIVE_INFINITY,
      guardrailBudget: DEFAULT_UNLIMITED_GUARDRAIL_ITERATION_BUDGET,
    }
  }

  if (!Number.isFinite(requestedMaxIterations)) {
    return {
      loopMaxIterations: DEFAULT_UNLIMITED_GUARDRAIL_ITERATION_BUDGET,
      guardrailBudget: DEFAULT_UNLIMITED_GUARDRAIL_ITERATION_BUDGET,
    }
  }

  const normalizedMaxIterations = Math.max(
    1,
    Math.floor(requestedMaxIterations),
  )
  return {
    loopMaxIterations: normalizedMaxIterations,
    guardrailBudget: normalizedMaxIterations,
  }
}

export function appendAgentStopNote(content: string): string {
  const normalizedContent = typeof content === "string" ? content.trimEnd() : ""
  if (normalizedContent.includes(AGENT_STOP_NOTE)) {
    return normalizedContent
  }

  return normalizedContent.length > 0
    ? `${normalizedContent}\n\n${AGENT_STOP_NOTE}`
    : AGENT_STOP_NOTE
}

export function getLatestAssistantMessageContent(
  conversation?: ConversationMessageLike[],
): string | undefined {
  if (!Array.isArray(conversation)) return undefined

  for (let index = conversation.length - 1; index >= 0; index--) {
    const message = conversation[index]
    if (message?.role !== "assistant") continue
    if (typeof message.content !== "string") continue

    const trimmedContent = message.content.trim()
    if (trimmedContent.length > 0) {
      return message.content
    }
  }

  return undefined
}

export function getPreferredDelegationOutput(
  output: string | undefined,
  conversation?: ConversationMessageLike[],
): string {
  return (
    getLatestAssistantMessageContent(conversation) ??
    (typeof output === "string" ? output : "")
  )
}
