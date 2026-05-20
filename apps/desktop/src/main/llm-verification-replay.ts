import type { AgentConversationState, AgentUserResponseEvent } from "@dotagents/shared"
import { sanitizeMessageContentForDisplay } from "@dotagents/shared"
import { collectRecentRealUserRequestIndices } from "./conversation-history-utils"
import { resolveLatestUserFacingResponse } from "./respond-to-user-utils"

type ToolCallLike = {
  name?: string
  arguments?: unknown
}

type ReplayConversationHistoryEntry = {
  role: "user" | "assistant" | "tool"
  content: string
  toolCalls?: ToolCallLike[]
  toolResults?: unknown[]
}

export type VerificationMessage = {
  role: "user" | "assistant" | "system"
  content: string
}

type ReplayExpectedResult = {
  conversationState?: AgentConversationState
  isComplete?: boolean
}

type ReplaySourceInfo = {
  langfuseTraceId?: string
  generationId?: string
  url?: string
}

type ReplayBaseFixture = {
  version: 1
  id: string
  description?: string
  source?: ReplaySourceInfo
  expected?: ReplayExpectedResult
}

export type ExactVerifierMessagesReplayFixture = ReplayBaseFixture & {
  mode: "exact_verifier_messages"
  messages: VerificationMessage[]
}

export type AgentStateReplayFixture = ReplayBaseFixture & {
  mode: "agent_state"
  transcript: string
  finalAssistantText?: string
  storedResponse?: string
  responseEvents?: AgentUserResponseEvent[]
  plannedToolCalls?: ToolCallLike[]
  verificationFailCount?: number
  verifyContextMaxItems?: number
  conversationHistory: ReplayConversationHistoryEntry[]
  sinceIndex?: number
}

export type ContinueReplayFixture = ExactVerifierMessagesReplayFixture | AgentStateReplayFixture

const AGENT_CONVERSATION_STATES = new Set<AgentConversationState>([
  "running",
  "complete",
  "needs_input",
  "blocked",
])

export const VERIFICATION_SYSTEM_PROMPT = `You are a strict verifier for the CURRENT agent run.

Choose exactly one conversationState:
- running: the agent still owes primary work.
- complete: the user-facing response already delivers the requested answer/artifact/summary.
- needs_input: stopping is valid because required clarification, approval, credentials, or another user reply is needed.
- blocked: stopping is valid because an external failure/environment constraint was clearly explained.

Rules:
- Judge user-facing output, not tool success by itself.
- Tool findings must be presented or synthesized for the user; plans, intent-only updates, empty/vague/procedural replies, or unfinished artifacts stay running.
- Optional preferences/approval after unfinished primary work stay running unless the user explicitly required stopping to ask first.
- For short/referential follow-ups, use prior user context only to resolve references; do not revive older tasks.

Return ONLY JSON:
{
  "conversationState": "running" | "complete" | "needs_input" | "blocked",
  "isComplete": boolean,
  "confidence": number,
  "missingItems": string[],
  "reason": string
}
Set isComplete=false only for running; true otherwise.`

const VERIFICATION_JSON_REQUEST_BASE = "Return JSON only. Remember: if the assistant is waiting on the user, use conversationState=needs_input; if it cannot continue because of a blocker, use conversationState=blocked; otherwise use running or complete. Do not treat optional preference/approval questions after unfinished work as needs_input; those should stay running."

function collectRelevantPriorUserRequests(
  conversationHistory: ReplayConversationHistoryEntry[],
  sinceIndex: number | undefined,
  transcript: string,
): string[] {
  const searchEnd = typeof sinceIndex === "number"
    ? Math.max(0, Math.min(sinceIndex, conversationHistory.length))
    : conversationHistory.length
  const currentRequest = sanitizeMessageContentForDisplay(transcript).trim()

  const candidates = collectRecentRealUserRequestIndices(conversationHistory, 2, searchEnd)
    .map((index) => sanitizeMessageContentForDisplay(conversationHistory[index]?.content || "").trim())
    .filter((request) => request.length > 0 && request !== currentRequest)

  return candidates.slice(-1)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

function assertValidVerificationMessage(message: unknown, source: string): asserts message is VerificationMessage {
  if (!isRecord(message)) throw new Error(`${source} must be an object`)
  if (message.role !== "user" && message.role !== "assistant" && message.role !== "system") {
    throw new Error(`${source} role must be user, assistant, or system`)
  }
  if (typeof message.content !== "string") {
    throw new Error(`${source} content must be a string`)
  }
}

function assertValidConversationHistoryEntry(
  entry: unknown,
  source: string,
): asserts entry is ReplayConversationHistoryEntry {
  if (!isRecord(entry)) throw new Error(`${source} must be an object`)
  if (entry.role !== "user" && entry.role !== "assistant" && entry.role !== "tool") {
    throw new Error(`${source} role must be user, assistant, or tool`)
  }
  if (typeof entry.content !== "string") {
    throw new Error(`${source} content must be a string`)
  }
  if (entry.toolCalls !== undefined && !Array.isArray(entry.toolCalls)) {
    throw new Error(`${source} toolCalls must be an array when present`)
  }
}

function assertValidExpectedResult(expected: unknown, source: string): void {
  if (expected === undefined) return
  if (!isRecord(expected)) throw new Error(`${source} expected must be an object when present`)
  if (expected.conversationState !== undefined && !AGENT_CONVERSATION_STATES.has(expected.conversationState as AgentConversationState)) {
    throw new Error(`${source} expected.conversationState must be a valid AgentConversationState`)
  }
  if (expected.isComplete !== undefined && typeof expected.isComplete !== "boolean") {
    throw new Error(`${source} expected.isComplete must be a boolean when present`)
  }
}

function buildVerificationJsonRequest(verificationFailCount = 0): string {
  if (verificationFailCount <= 0) return VERIFICATION_JSON_REQUEST_BASE
  return `${VERIFICATION_JSON_REQUEST_BASE}\n\nNote: This is verification attempt #${verificationFailCount + 1}. Do NOT lower the bar. If any requested work still remains, return conversationState=running and list the missingItems. Only use complete, needs_input, or blocked when the current run can legitimately stop now.`
}

export function buildVerificationMessagesFromAgentState(
  fixture: AgentStateReplayFixture,
): VerificationMessage[] {
  const maxItems = Math.max(1, fixture.verifyContextMaxItems ?? 20)
  const recent = fixture.conversationHistory.slice(-maxItems)
  const latestUserFacingResponse = resolveLatestUserFacingResponse({
    storedResponse: fixture.storedResponse,
    responseEvents: fixture.responseEvents,
    plannedToolCalls: fixture.plannedToolCalls,
    conversationHistory: fixture.conversationHistory,
    sinceIndex: fixture.sinceIndex,
  })
  const relevantPriorUserRequests = collectRelevantPriorUserRequests(
    fixture.conversationHistory,
    fixture.sinceIndex,
    fixture.transcript,
  )

  const messages: VerificationMessage[] = [
    { role: "system", content: VERIFICATION_SYSTEM_PROMPT },
    { role: "user", content: `Original request:\n${sanitizeMessageContentForDisplay(fixture.transcript)}` },
  ]

  if (relevantPriorUserRequests.length > 0) {
    messages.push({
      role: "user",
      content: `Relevant prior user context for resolving references only; these are not the active request unless the current request depends on them:\n${relevantPriorUserRequests.map((request) => `- ${request}`).join("\n")}`,
    })
  }

  const sanitizedLatestUserFacingResponse = latestUserFacingResponse?.trim()
    ? sanitizeMessageContentForDisplay(latestUserFacingResponse).trim()
    : ""
  if (sanitizedLatestUserFacingResponse) {
    messages.push({
      role: "user",
      content: `Latest explicit user-facing response from the agent:\n${sanitizedLatestUserFacingResponse}`,
    })
  }

  let lastAddedAssistantContent: string | null = null
  for (const entry of recent) {
    const rawContent = typeof entry.content === "string" ? entry.content : ""
    if (entry.role === "tool") {
      const text = sanitizeMessageContentForDisplay(rawContent.trim())
      messages.push({ role: "user", content: text || "[No tool output]" })
      continue
    }

    if (entry.role === "user") {
      const text = sanitizeMessageContentForDisplay(rawContent.trim())
      if (text) messages.push({ role: "user", content: text })
      continue
    }

    const content = sanitizeMessageContentForDisplay(rawContent)
    if (!content.trim()) {
      continue
    }
    messages.push({ role: "assistant", content })
    lastAddedAssistantContent = content
  }

  const sanitizedFinalAssistantText = sanitizeMessageContentForDisplay(fixture.finalAssistantText || "").trim()
  if (
    sanitizedFinalAssistantText &&
    sanitizedFinalAssistantText !== lastAddedAssistantContent?.trim() &&
    sanitizedFinalAssistantText !== sanitizedLatestUserFacingResponse
  ) {
    messages.push({ role: "assistant", content: sanitizedFinalAssistantText })
  }

  messages.push({ role: "user", content: buildVerificationJsonRequest(fixture.verificationFailCount ?? 0) })
  return messages
}

export function resolveContinueReplayMessages(fixture: ContinueReplayFixture): VerificationMessage[] {
  return fixture.mode === "exact_verifier_messages"
    ? fixture.messages
    : buildVerificationMessagesFromAgentState(fixture)
}

export function parseContinueReplayFixture(raw: unknown, source = "fixture"): ContinueReplayFixture {
  if (!raw || typeof raw !== "object") throw new Error(`${source} must be an object`)
  const fixture = raw as Record<string, unknown>
  if (fixture.version !== 1) throw new Error(`${source} must declare version: 1`)
  if (typeof fixture.id !== "string" || !fixture.id.trim()) throw new Error(`${source} must include a non-empty id`)
  if (fixture.mode !== "exact_verifier_messages" && fixture.mode !== "agent_state") {
    throw new Error(`${source} mode must be exact_verifier_messages or agent_state`)
  }

  assertValidExpectedResult(fixture.expected, source)

  if (fixture.mode === "exact_verifier_messages") {
    if (!Array.isArray(fixture.messages) || fixture.messages.length === 0) {
      throw new Error(`${source} exact_verifier_messages fixture must include a non-empty messages array`)
    }
    fixture.messages.forEach((message, index) => {
      assertValidVerificationMessage(message, `${source} messages[${index}]`)
    })
    return fixture as ExactVerifierMessagesReplayFixture
  }

  if (typeof fixture.transcript !== "string") throw new Error(`${source} agent_state fixture must include transcript`)
  if (!Array.isArray(fixture.conversationHistory)) {
    throw new Error(`${source} agent_state fixture must include conversationHistory array`)
  }
  fixture.conversationHistory.forEach((entry, index) => {
    assertValidConversationHistoryEntry(entry, `${source} conversationHistory[${index}]`)
  })
  return fixture as AgentStateReplayFixture
}
