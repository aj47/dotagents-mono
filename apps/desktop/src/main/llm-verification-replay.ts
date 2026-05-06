import type { AgentConversationState } from "@dotagents/shared/conversation-state"
import type { AgentUserResponseEvent } from "@dotagents/shared/agent-progress"
import { sanitizeMessageContentForDisplay } from "@dotagents/shared/message-display-utils"
import { collectRecentRealUserRequestIndices } from "@dotagents/shared/conversation-history-utils"
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

export const VERIFICATION_SYSTEM_PROMPT = `You are a strict conversation-state verifier for an agent run.

Classify the CURRENT state of the conversation using exactly one value:
- running: the agent still owes more work before the current run can stop.
- complete: the user already has the requested deliverable.
- needs_input: the assistant has reached a valid stopping point because it is explicitly waiting on user clarification, approval, credentials, or another user reply.
- blocked: the assistant has reached a valid stopping point because it clearly explained an external blocker, failure, or environment constraint that prevents further progress right now.

Rules:
- Judge based on what the user-facing assistant response actually delivers, not on tool success alone.
- If tools found information but the assistant did not present or synthesize it for the user, return running.
- If the assistant mainly says what it plans to do next, return running.
- If the assistant asks the user for something needed next, return needs_input.
- Use needs_input only when the requested work is at a legitimate stopping point and the missing user input is truly required before any remaining primary work can continue.
- If the assistant asks an optional preference, optional approval, or “if you want, I can do the final steps now” follow-up after failing to deliver the main requested artifact, return running.
- If the assistant reports that a requested artifact was not created yet (for example no PR was opened yet, no agent/profile was created yet, no file was produced yet) and then asks whether to continue, return running unless the user had explicitly asked the assistant to stop and ask first.
- If the assistant only gathered context, prepared, or summarized next steps but did not create the main requested artifact, return running even if it asks a style/preference question.
- If the assistant clearly says it cannot proceed because of a blocker outside its control, return blocked.
- If the user already has the final answer, requested artifact, or requested summary, return complete.
- If the current request is a short or referential follow-up, use the provided prior user context only to resolve references like "it", "this", or "the map"; do not replace the current request with an older background task.
- Empty, vague, or purely procedural replies should return running.

Return ONLY JSON with this schema:
{
  "conversationState": "running" | "complete" | "needs_input" | "blocked",
  "isComplete": boolean,
  "confidence": number,
  "missingItems": string[],
  "reason": string
}

Set isComplete=false only when conversationState=running. Set isComplete=true for complete, needs_input, or blocked.`

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

  if (latestUserFacingResponse?.trim()) {
    messages.push({
      role: "user",
      content: `Latest explicit user-facing response from the agent:\n${sanitizeMessageContentForDisplay(latestUserFacingResponse)}`,
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

  const sanitizedFinalAssistantText = sanitizeMessageContentForDisplay(fixture.finalAssistantText || "")
  if (sanitizedFinalAssistantText.trim() && sanitizedFinalAssistantText.trim() !== lastAddedAssistantContent?.trim()) {
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
