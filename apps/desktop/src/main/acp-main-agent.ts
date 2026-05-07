/**
 * ACP Main Agent Handler
 *
 * Routes transcripts to an ACP agent instead of the LLM API when ACP mode is enabled.
 * This allows using agents like Claude Code as the "brain" for DotAgents.
 */

import {
  acpService,
  ACPContentBlock,
  ACPToolCallStatus,
  ACPToolCallUpdate,
  type ACPGetOrCreateSessionStage,
} from "./acp-service"
import {
  getSessionForConversation,
  getMainAcpxSessionName,
  registerKnownAppSessionId,
  setSessionForConversation,
  setAcpToAppSessionMapping,
  updateConversationRuntimeSessionId,
} from "./acp-session-state"
import { emitAgentProgress } from "./emit-agent-progress"
import { AgentProgressUpdate, AgentProgressStep, SessionProfileSnapshot, ACPConfigOption, ToolCall, ToolResult } from "../shared/types"
import { getBranchMessageIndexMap } from "@shared/conversation-progress"
import { MARK_WORK_COMPLETE_TOOL, RESPOND_TO_USER_TOOL } from "../shared/runtime-tool-names"
import { logApp } from "./debug"
import { conversationService } from "./conversation-service"
import { buildProfileContext } from "./agent-run-utils"
import { extractRespondToUserContentFromArgs } from "./respond-to-user-utils"
import { resolveMessageTimestamps, type AgentConversationState, type AgentUserResponseEvent } from "@dotagents/shared"
import {
  createAgentTrace,
  createToolSpan,
  endAgentTrace,
  endToolSpan,
  flushLangfuse,
  isTracingEnabled,
} from "./langfuse-service"

type ConversationHistoryMessage = NonNullable<AgentProgressUpdate["conversationHistory"]>[number]

const ACP_RUNTIME_TOOL_PROMPT_CONTEXT = [
  `Plain assistant text is valid user-facing output for ordinary chat, simple questions, and final answers.`,
  `If "${RESPOND_TO_USER_TOOL}" is available, use it when explicit voice/messaging delivery semantics or attachments are needed; do not duplicate the same answer in plain text.`,
  `When the task is fully complete and "${MARK_WORK_COMPLETE_TOOL}" is available, first provide the final user-facing answer in plain assistant text or via "${RESPOND_TO_USER_TOOL}". Only then call "${MARK_WORK_COMPLETE_TOOL}" when an explicit internal completion signal is useful, with a concise internal completion summary. Do not send a second recap unless the user explicitly asked for one.`,
].join("\n")

const ACP_SETUP_STAGE_META: Record<ACPGetOrCreateSessionStage, { stepId: string; title: (agentName: string) => string }> = {
  launching: {
    stepId: "acp-launching",
    title: (agentName) => `Starting ${agentName}...`,
  },
  initializing: {
    stepId: "acp-initializing",
    title: (agentName) => `Initializing ${agentName}...`,
  },
  creating_session: {
    stepId: "acp-session",
    title: (agentName) => `Preparing ${agentName} session...`,
  },
}

export interface ACPMainAgentOptions {
  /** Name of the ACP agent to use */
  agentName: string
  /** DotAgents conversation ID */
  conversationId: string
  /** Force creating a new session even if one exists */
  forceNewSession?: boolean
  /** Session ID for progress tracking (from agentSessionTracker) */
  sessionId: string
  /** Session run ID for stale-update filtering when session IDs are reused */
  runId: number
  /** Callback for progress updates */
  onProgress?: (update: AgentProgressUpdate) => void
  /** Profile snapshot used for ACP context parity + tool filtering parity */
  profileSnapshot?: SessionProfileSnapshot
}

export interface ACPMainAgentResult {
  /** Whether the request succeeded */
  success: boolean
  /** The agent's response text */
  response?: string
  /** The ACP session ID (for future prompts) */
  acpSessionId?: string
  /** Why the agent stopped */
  stopReason?: string
  /** Error message if failed */
  error?: string
}

function getConfigOptionByCategory(
  configOptions: ACPConfigOption[] | undefined,
  category: string,
): ACPConfigOption | undefined {
  return configOptions?.find((option) => option.category === category)
    || configOptions?.find((option) => option.id === category)
}

function getCurrentConfigOptionLabel(option: ACPConfigOption | undefined): string | undefined {
  if (!option) return undefined
  const values = Array.isArray(option.options) ? option.options : []
  return values.find((value) => value.value === option.currentValue)?.name || option.currentValue
}

function getConfigOptionChoices(option: ACPConfigOption | undefined): Array<{ id: string; name: string; description?: string }> | undefined {
  if (!option) return undefined
  const values = Array.isArray(option.options) ? option.options : []
  return values.map((value) => ({
    id: value.value,
    name: value.name,
    description: value.description,
  }))
}

function summarizeAcpContentBlock(block: ACPContentBlock): { title: string; description?: string; type: AgentProgressStep["type"] } | undefined {
  if (block.type === "tool_result") {
    const description = typeof block.result === "string"
      ? block.result
      : block.result
        ? JSON.stringify(block.result)
        : undefined
    return { title: "Tool result", description: description?.slice(0, 200), type: "tool_result" }
  }

  if (block.type === "image") {
    return { title: "Image output", description: block.mimeType || "image", type: "tool_result" }
  }

  if (block.type === "audio") {
    return { title: "Audio output", description: block.mimeType || "audio", type: "tool_result" }
  }

  if (block.type === "resource") {
    return {
      title: "Embedded resource",
      description: block.resource?.uri || block.uri || block.mimeType,
      type: "tool_result",
    }
  }

  if (block.type === "resource_link") {
    return {
      title: block.title || block.name || "Resource link",
      description: block.uri || block.description,
      type: "tool_result",
    }
  }

  return undefined
}

function stringifyAcpValue(value: unknown): string | undefined {
  if (typeof value === "string") return value
  if (value == null) return undefined
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function formatAcpToolResult(result: unknown): ToolResult {
  if (result && typeof result === "object") {
    const maybeError = "error" in result && typeof result.error === "string" ? result.error : undefined
    const maybeIsError = "isError" in result && result.isError === true
    const maybeContent = "content" in result ? stringifyAcpValue(result.content) : undefined
    return {
      success: !maybeError && !maybeIsError,
      content: maybeContent || stringifyAcpValue(result) || "Tool completed",
      error: maybeError,
    }
  }

  return {
    success: true,
    content: stringifyAcpValue(result) || "Tool completed",
  }
}

function formatAcpBlockAsAssistantMessage(block: ACPContentBlock): string | undefined {
  if (block.type === "image") {
    if (block.uri) {
      return `![${block.title || "Image output"}](${block.uri})`
    }
    return `Image output${block.mimeType ? ` (${block.mimeType})` : ""}`
  }

  if (block.type === "audio") {
    return block.uri
      ? `Audio output: ${block.uri}`
      : `Audio output${block.mimeType ? ` (${block.mimeType})` : ""}`
  }

  if (block.type === "resource") {
    if (block.resource?.text) return block.resource.text
    const resourceUri = block.resource?.uri || block.uri
    return resourceUri
      ? `Resource: ${resourceUri}`
      : `Embedded resource${block.mimeType ? ` (${block.mimeType})` : ""}`
  }

  if (block.type === "resource_link") {
    const label = block.title || block.name || "Resource link"
    if (block.uri) {
      return block.description
        ? `[${label}](${block.uri})\n\n${block.description}`
        : `[${label}](${block.uri})`
    }
    return [label, block.description].filter(Boolean).join("\n\n") || label
  }

  return undefined
}

function normalizeAcpToolName(name: string | undefined): string | undefined {
  if (!name) return undefined

  const trimmed = name.trim()
  if (!trimmed) return undefined

  const withoutToolPrefix = trimmed.replace(/^tool:\s*/i, "")
  const normalized = withoutToolPrefix
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")

  const matchesRuntimeToolAlias = (toolName: string) =>
    normalized === toolName ||
    normalized.startsWith(`${toolName}_`) ||
    normalized.endsWith(`_${toolName}`)

  if (matchesRuntimeToolAlias(RESPOND_TO_USER_TOOL)) return RESPOND_TO_USER_TOOL
  if (matchesRuntimeToolAlias(MARK_WORK_COMPLETE_TOOL)) return MARK_WORK_COMPLETE_TOOL

  return withoutToolPrefix
}

function deriveAcpUserResponseState(conversationHistory: ConversationHistoryMessage[], options?: {
  sinceIndex?: number
  sessionId?: string
  runId?: number
}): {
  responseEvents: AgentUserResponseEvent[]
  userResponse?: string
  userResponseHistory?: string[]
} {
  const responseEvents: AgentUserResponseEvent[] = []
  const sinceIndex = Math.max(0, options?.sinceIndex ?? 0)
  const resolvedSessionId = options?.sessionId ?? "acp-session"
  const scopedConversationHistory = conversationHistory.slice(sinceIndex)
  const resolvedTimestamps = resolveMessageTimestamps(scopedConversationHistory)

  for (let localMessageIndex = 0; localMessageIndex < scopedConversationHistory.length; localMessageIndex += 1) {
    const messageIndex = sinceIndex + localMessageIndex
    const message = scopedConversationHistory[localMessageIndex]
    if (message.role !== "assistant" || !message.toolCalls?.length) continue

    for (let toolCallIndex = 0; toolCallIndex < message.toolCalls.length; toolCallIndex += 1) {
      const toolCall = message.toolCalls[toolCallIndex]
      if (normalizeAcpToolName(toolCall.name) !== RESPOND_TO_USER_TOOL) continue
      const content = extractRespondToUserContentFromArgs(toolCall.arguments)
      if (!content) continue
      responseEvents.push({
        id: `acp-${resolvedSessionId}-${options?.runId ?? "run"}-${messageIndex}-${toolCallIndex}-${responseEvents.length + 1}`,
        sessionId: resolvedSessionId,
        runId: options?.runId,
        ordinal: responseEvents.length + 1,
        text: content,
        timestamp: resolvedTimestamps[localMessageIndex],
      })
    }
  }

  const userResponse = responseEvents[responseEvents.length - 1]?.text
  return {
    responseEvents,
    userResponse,
    userResponseHistory: responseEvents.length > 1 ? responseEvents.slice(0, -1).map((event) => event.text) : undefined,
  }
}

function normalizeToolArguments(input: unknown): ToolCall["arguments"] {
  if (input && typeof input === "object" && !Array.isArray(input)) {
    return input as ToolCall["arguments"]
  }
  if (input === undefined) return {}
  return { input }
}

function formatAcpToolCallName(toolCall: ACPToolCallUpdate): string {
  const rawInput = toolCall.rawInput
  if (rawInput && typeof rawInput === "object" && !Array.isArray(rawInput)) {
    const maybeName = (rawInput as Record<string, unknown>).name
    if (typeof maybeName === "string" && maybeName.trim().length > 0) {
      return normalizeAcpToolName(maybeName) || maybeName
    }
  }

  const title = toolCall.title?.trim()
  if (!title) return "Tool call"
  return normalizeAcpToolName(title) || title
}

function formatAcpToolCallResultText(toolCall: ACPToolCallUpdate): string {
  const outputText = stringifyAcpValue(toolCall.rawOutput)
  if (outputText) return outputText

  const contentText = toolCall.content
    ?.map((item) => {
      if (item.type === "text") return item.text
      if (item.type === "diff") return item.path ? `Updated ${item.path}` : "Applied diff"
      if (item.type === "terminal") return item.terminalId ? `Terminal ${item.terminalId}` : "Terminal output"
      if (item.type === "location") {
        const linePart = typeof item.line === "number" ? `:${item.line}` : ""
        const columnPart = typeof item.column === "number" ? `:${item.column}` : ""
        return item.path ? `Location ${item.path}${linePart}${columnPart}` : "Location"
      }
      return undefined
    })
    .filter((value): value is string => !!value && value.trim().length > 0)
    .join("\n")

  if (contentText) return contentText
  return toolCall.status === "failed" ? "Tool failed" : "Tool completed"
}

function formatAcpToolCallResult(toolCall: ACPToolCallUpdate): ToolResult {
  const content = formatAcpToolCallResultText(toolCall)
  return {
    success: toolCall.status !== "failed",
    content,
    error: toolCall.status === "failed" ? content : undefined,
  }
}

function isCompletedToolCallStatus(status: ACPToolCallStatus | undefined): status is "completed" | "failed" {
  return status === "completed" || status === "failed"
}

/**
 * Process a transcript using an ACP agent as the main agent.
 * This bypasses the normal LLM API call and routes directly to the ACP agent.
 */
export async function processTranscriptWithACPAgent(
  transcript: string,
  options: ACPMainAgentOptions
): Promise<ACPMainAgentResult> {
  const { agentName, conversationId, forceNewSession, sessionId, runId, onProgress, profileSnapshot } = options

  logApp(`[ACP Main] Processing transcript with agent ${agentName} for conversation ${conversationId}`)

  // Track accumulated text across all session updates for streaming display
  let accumulatedText = ""
  let sawAssistantTextBlock = false
  let lastAssistantTextMessageIndex: number | undefined
  const trackedToolCalls = new Map<string, { assistantIndex: number; resultIndex?: number; spanId?: string; spanEnded?: boolean }>()
  let fallbackToolCallIdCounter = 0
  const tracingEnabled = isTracingEnabled()
  let traceOutput = ""
  let traceError: string | undefined
  let traceStopReason: string | undefined
  let traceAcpSessionId: string | undefined

  if (tracingEnabled) {
    createAgentTrace(sessionId, {
      name: "ACP Agent Session",
      sessionId: conversationId,
      input: transcript,
      metadata: {
        agentName,
        forceNewSession: forceNewSession === true,
        profileId: profileSnapshot?.profileId,
        profileName: profileSnapshot?.profileName,
      },
      tags: profileSnapshot?.profileName ? [`profile:${profileSnapshot.profileName}`, "acp"] : ["acp"],
    })
  }

  // Counter for generating unique step IDs to avoid collisions in tight loops
  let stepIdCounter = 0
  const generateStepId = (prefix: string): string => `${prefix}-${Date.now()}-${++stepIdCounter}`

  // Load existing conversation history for UI display
  let conversationHistory: ConversationHistoryMessage[] = []

  try {
    const conversation = await conversationService.loadConversation(conversationId)
    if (conversation) {
      const branchMessageIndexMap = getBranchMessageIndexMap(conversation.messages)
      conversationHistory = conversation.messages.map((m, index) => ({
        role: m.role,
        content: m.content,
        toolCalls: m.toolCalls,
        toolResults: m.toolResults,
        timestamp: m.timestamp,
        branchMessageIndex: branchMessageIndexMap[index],
      }))
    }
  } catch (err) {
    logApp(`[ACP Main] Failed to load conversation history: ${err}`)
  }

  let nextBranchMessageIndex =
    (conversationHistory[conversationHistory.length - 1]?.branchMessageIndex ?? -1) + 1

  const currentTurnStartIndex = conversationHistory.length

  const persistConversationTail = async (finalAssistantResponse?: string) => {
    if (typeof finalAssistantResponse !== "string" || finalAssistantResponse.trim().length === 0) {
      return
    }

    await conversationService.addMessageToConversation(
      conversationId,
      finalAssistantResponse,
      "assistant",
    )

    for (let index = conversationHistory.length - 1; index >= 0; index -= 1) {
      const entry = conversationHistory[index]
      if (entry.role !== "assistant" || entry.content !== finalAssistantResponse) continue
      if (typeof entry.branchMessageIndex !== "number") {
        entry.branchMessageIndex = nextBranchMessageIndex++
      }
      break
    }
  }

  const deriveFinalAssistantResponse = (fallbackResponse?: string) => {
    const { userResponse } = deriveAcpUserResponseState(conversationHistory, {
      sinceIndex: currentTurnStartIndex,
      sessionId,
      runId,
    })

    return {
      userResponse,
      finalResponse: userResponse || fallbackResponse || accumulatedText || undefined,
    }
  }

  const appendAssistantText = (text: string, timestamp: number) => {
    if (!text) return
    sawAssistantTextBlock = true

    if (
      typeof lastAssistantTextMessageIndex === "number" &&
      conversationHistory[lastAssistantTextMessageIndex]?.role === "assistant" &&
      !(conversationHistory[lastAssistantTextMessageIndex]?.toolCalls?.length) &&
      !(conversationHistory[lastAssistantTextMessageIndex]?.toolResults?.length)
    ) {
      const existing = conversationHistory[lastAssistantTextMessageIndex]
      if (existing) {
        existing.content += text
        existing.timestamp = timestamp
      }
      return
    }

    conversationHistory.push({
      role: "assistant",
      content: text,
      timestamp,
    })
    lastAssistantTextMessageIndex = conversationHistory.length - 1
  }

  const appendConversationEntry = (entry: ConversationHistoryMessage) => {
    conversationHistory.push(entry)
    if (typeof entry.branchMessageIndex === "number") {
      nextBranchMessageIndex = entry.branchMessageIndex + 1
    }
    lastAssistantTextMessageIndex = undefined
  }

  const appendOrMergeAssistantToolCall = (toolCall: ToolCall, timestamp: number): number => {
    const lastEntry = conversationHistory[conversationHistory.length - 1]
    if (
      typeof lastAssistantTextMessageIndex === "number" &&
      lastAssistantTextMessageIndex === conversationHistory.length - 1 &&
      lastEntry?.role === "assistant" &&
      !lastEntry.toolResults?.length &&
      (!lastEntry.toolCalls || lastEntry.toolCalls.length === 0)
    ) {
      lastEntry.toolCalls = [toolCall]
      lastEntry.timestamp = timestamp
      lastAssistantTextMessageIndex = undefined
      return conversationHistory.length - 1
    }

    appendConversationEntry({
      role: "assistant",
      content: "",
      toolCalls: [toolCall],
      timestamp,
    })
    return conversationHistory.length - 1
  }

  const applyAcpToolCallUpdateToConversation = (toolCallUpdate: ACPToolCallUpdate, timestamp: number) => {
    const toolCallId = toolCallUpdate.toolCallId || `acp-tool-${timestamp}-${++fallbackToolCallIdCounter}`
    const toolCall: ToolCall = {
      name: formatAcpToolCallName(toolCallUpdate),
      arguments: normalizeToolArguments(toolCallUpdate.rawInput),
    }

    let tracked = trackedToolCalls.get(toolCallId)

    if (!tracked) {
      const spanId = tracingEnabled ? `acp-tool-${toolCallId}` : undefined
      tracked = {
        assistantIndex: appendOrMergeAssistantToolCall(toolCall, timestamp),
        spanId,
      }
      trackedToolCalls.set(toolCallId, tracked)
      if (spanId) {
        createToolSpan(sessionId, spanId, {
          name: `ACP Tool: ${toolCall.name}`,
          input: toolCall.arguments as Record<string, unknown>,
          metadata: { toolName: toolCall.name, acpToolCallId: toolCallId, agentName },
        })
      }
    } else {
      const assistantEntry = conversationHistory[tracked.assistantIndex]
      if (assistantEntry) {
        assistantEntry.toolCalls = [toolCall]
        assistantEntry.timestamp = timestamp
      }
    }

    if (isCompletedToolCallStatus(toolCallUpdate.status)) {
      const toolResult = formatAcpToolCallResult(toolCallUpdate)
      const content = toolResult.error || toolResult.content

      if (typeof tracked.resultIndex === "number") {
        const resultEntry = conversationHistory[tracked.resultIndex]
        if (resultEntry) {
          resultEntry.content = content
          resultEntry.toolResults = [toolResult]
          resultEntry.timestamp = timestamp
        }
      } else {
        appendConversationEntry({
          role: "tool",
          content,
          toolResults: [toolResult],
          timestamp,
        })
        tracked.resultIndex = conversationHistory.length - 1
      }

      if (tracked.spanId && !tracked.spanEnded) {
        endToolSpan(tracked.spanId, {
          output: toolResult.content,
          level: toolResult.error ? "ERROR" : "DEFAULT",
          statusMessage: toolResult.error,
        })
        tracked.spanEnded = true
      }
    }
  }

  // Helper to get ACP session info for progress updates (Task 3.1)
  const getAcpSessionInfo = () => {
    const agentInstance = acpService.getAgentInstance(agentName)
    if (!agentInstance) return undefined
    const availableModelsFromMetadata = agentInstance.sessionInfo?.models?.availableModels
      ?.filter((model): model is { modelId: string; name: string; description?: string } => Boolean(model.modelId && model.name))
      .map(model => ({
        id: model.modelId,
        name: model.name,
        description: model.description,
      }))
    const availableModesFromMetadata = agentInstance.sessionInfo?.modes?.availableModes
      ?.filter((mode): mode is { id: string; name: string; description?: string } => Boolean(mode.id && mode.name))
      .map(mode => ({
        id: mode.id,
        name: mode.name,
        description: mode.description,
      }))
    return {
      agentName: agentInstance.agentInfo?.name,
      agentTitle: agentInstance.agentInfo?.title,
      agentVersion: agentInstance.agentInfo?.version,
      currentModel: getCurrentConfigOptionLabel(getConfigOptionByCategory(agentInstance.sessionInfo?.configOptions, "model"))
        || agentInstance.sessionInfo?.models?.currentModelId,
      currentMode: getCurrentConfigOptionLabel(getConfigOptionByCategory(agentInstance.sessionInfo?.configOptions, "mode"))
        || agentInstance.sessionInfo?.modes?.currentModeId,
      availableModels: getConfigOptionChoices(getConfigOptionByCategory(agentInstance.sessionInfo?.configOptions, "model"))
        || availableModelsFromMetadata,
      availableModes: getConfigOptionChoices(getConfigOptionByCategory(agentInstance.sessionInfo?.configOptions, "mode"))
        || availableModesFromMetadata,
      configOptions: agentInstance.sessionInfo?.configOptions as ACPConfigOption[] | undefined,
    }
  }

  // Track only responses emitted during this turn so prior-turn ACP responses
  // are never replayed into the current run.
  let lastEmittedUserResponse: string | undefined =
    deriveAcpUserResponseState(conversationHistory, {
      sinceIndex: currentTurnStartIndex,
      sessionId,
      runId,
    }).userResponse

  // Emit progress with optional streaming content and conversation history
  const emitProgress = async (
    steps: AgentProgressStep[],
    isComplete: boolean,
    finalContent?: string,
    streamingContent?: { text: string; isStreaming: boolean }
  ) => {
    const { responseEvents, userResponse, userResponseHistory } = deriveAcpUserResponseState(conversationHistory, {
      sinceIndex: currentTurnStartIndex,
      sessionId,
      runId,
    })
    const conversationState: AgentConversationState = isComplete ? "complete" : "running"
    // Only include userResponse when it changed to avoid re-emitting stale
    // responses from prior turns (same pattern as llm.ts emit guard)
    const shouldEmitUserResponse =
      userResponse !== undefined && userResponse !== lastEmittedUserResponse
    const update: AgentProgressUpdate = {
      sessionId,
      runId,
      conversationId,
      currentIteration: 1,
      maxIterations: 1,
      steps,
      isComplete,
      conversationState,
      finalContent: finalContent ?? (isComplete ? userResponse : undefined),
      streamingContent,
      conversationHistory,
      ...(responseEvents.length ? { responseEvents } : {}),
      ...(shouldEmitUserResponse ? { userResponse } : {}),
      ...(shouldEmitUserResponse && userResponseHistory?.length ? { userResponseHistory } : {}),
      // Include ACP session info in progress updates (Task 3.1)
      acpSessionInfo: getAcpSessionInfo(),
    }
    if (shouldEmitUserResponse) {
      lastEmittedUserResponse = userResponse
    }
    await emitAgentProgress(update)
    onProgress?.(update)
  }

  // Note: User message is already added to conversation by createMcpTextInput or processQueuedMessages
  // So we don't add it here - it's already in the loaded conversationHistory

  const emitSetupProgress = async (stage: ACPGetOrCreateSessionStage | "sending_prompt") => {
    const step = stage === "sending_prompt"
      ? {
          id: generateStepId("acp-thinking"),
          type: "thinking" as const,
          title: `Sending prompt to ${agentName}...`,
          status: "in_progress" as const,
          timestamp: Date.now(),
        }
      : {
          id: generateStepId(ACP_SETUP_STAGE_META[stage].stepId),
          type: "thinking" as const,
          title: ACP_SETUP_STAGE_META[stage].title(agentName),
          status: "in_progress" as const,
          timestamp: Date.now(),
        }

    await emitProgress([step], false)
  }

  try {
    // Get or create acpx-managed session
    const existingSession = forceNewSession ? undefined : getSessionForConversation(conversationId)
    const shouldEmitSetupProgress = !existingSession || existingSession.agentName !== agentName
    const preferredSessionName = existingSession?.agentName === agentName
      ? (existingSession.sessionName ?? getMainAcpxSessionName(conversationId))
      : getMainAcpxSessionName(conversationId)
    const acpSessionId = await acpService.getOrCreateSession(
      agentName,
      forceNewSession,
      undefined,
      { appSessionId: sessionId },
      preferredSessionName,
      shouldEmitSetupProgress ? emitSetupProgress : undefined,
    )
    traceAcpSessionId = acpSessionId

    setSessionForConversation(conversationId, acpSessionId, agentName, preferredSessionName)
    if (existingSession?.sessionId && existingSession.sessionId === acpSessionId) {
      logApp(`[ACP Main] Reused acpx session ${acpSessionId}`)
    } else if (existingSession?.sessionId) {
      logApp(`[ACP Main] Replaced stale acpx session ${existingSession.sessionId} with ${acpSessionId}`)
    } else {
      logApp(`[ACP Main] Created new acpx session ${acpSessionId} (${preferredSessionName})`)
    }

    // Register the ACP session → DotAgents session mapping
    // This is critical for routing tool approval requests to the correct UI session
    registerKnownAppSessionId(sessionId)
    setAcpToAppSessionMapping(acpSessionId, sessionId, runId)

    // Set up progress listener for session updates
    const progressHandler = (event: {
      agentName: string
      sessionId: string
      content?: ACPContentBlock[]
      toolCall?: ACPToolCallUpdate
      isComplete?: boolean
      toolResponseStats?: {
        status?: string
        agentId?: string
        totalDurationMs?: number
        totalTokens?: number
        totalToolUseCount?: number
        usage?: {
          input_tokens?: number
          cache_creation_input_tokens?: number
          cache_read_input_tokens?: number
          output_tokens?: number
        }
      }
    }) => {
      if (event.sessionId !== acpSessionId) return

      // Map content blocks to progress steps and accumulate text
      const steps: AgentProgressStep[] = []
      if (event.content) {
        for (const block of event.content) {
          const timestamp = Date.now()
          if (block.type === "text" && block.text) {
            // Accumulate text for streaming display
            accumulatedText += block.text
            appendAssistantText(block.text, timestamp)
            steps.push({
              id: generateStepId("acp-text"),
              type: "thinking",
              title: "Agent response",
              description: block.text.substring(0, 200) + (block.text.length > 200 ? "..." : ""),
              status: event.isComplete ? "completed" : "in_progress",
              timestamp,
              llmContent: accumulatedText, // Use accumulated text, not just this block
            })
          } else if (block.type === "tool_use" && block.name) {
            appendOrMergeAssistantToolCall({
              name: normalizeAcpToolName(block.name) || block.name,
              arguments: normalizeToolArguments(block.input),
            }, timestamp)
            const step: AgentProgressStep = {
              id: generateStepId("acp-tool"),
              type: "tool_call",
              title: `Tool: ${block.name}`,
              status: "in_progress",
              timestamp,
            }
            // Attach execution stats if available from tool response
            if (event.toolResponseStats) {
              step.executionStats = {
                durationMs: event.toolResponseStats.totalDurationMs,
                totalTokens: event.toolResponseStats.totalTokens,
                toolUseCount: event.toolResponseStats.totalToolUseCount,
                inputTokens: event.toolResponseStats.usage?.input_tokens,
                outputTokens: event.toolResponseStats.usage?.output_tokens,
                cacheHitTokens: event.toolResponseStats.usage?.cache_read_input_tokens,
              }
              step.subagentId = event.toolResponseStats.agentId
            }
            steps.push(step)
          } else if (block.type === "tool_result") {
            appendConversationEntry({
              role: "tool",
              content: stringifyAcpValue(block.result) || "Tool completed",
              toolResults: [formatAcpToolResult(block.result)],
              timestamp,
            })
            const summary = summarizeAcpContentBlock(block)
            if (summary) {
              steps.push({
                id: generateStepId("acp-content"),
                type: summary.type,
                title: summary.title,
                description: summary.description,
                status: event.isComplete ? "completed" : "in_progress",
                timestamp,
              })
            }
          } else {
            const assistantMessage = formatAcpBlockAsAssistantMessage(block)
            if (assistantMessage) {
              appendConversationEntry({
                role: "assistant",
                content: assistantMessage,
                timestamp,
              })
            }
            const summary = summarizeAcpContentBlock(block)
            if (summary) {
              steps.push({
                id: generateStepId("acp-content"),
                type: summary.type,
                title: summary.title,
                description: summary.description,
                status: event.isComplete ? "completed" : "in_progress",
                timestamp,
              })
            }
          }
        }
      }

      if (event.toolCall) {
        applyAcpToolCallUpdateToConversation(event.toolCall, Date.now())
        const toolStatus = event.toolCall.status
        steps.push({
          id: generateStepId("acp-tool-call"),
          type: "tool_call",
          title: event.toolCall.title || "Tool call",
          description: toolStatus ? `Status: ${toolStatus}` : undefined,
          status: toolStatus === "completed"
            ? "completed"
            : (toolStatus === "failed" ? "error" : "in_progress"),
          timestamp: Date.now(),
        })
      }

      // If we have toolResponseStats but no tool_use content block, it's a tool completion update
      // Emit a step with the execution stats
      if (event.toolResponseStats && steps.length === 0) {
        steps.push({
          id: generateStepId("acp-tool-result"),
          type: "tool_call",
          title: "Tool completed",
          status: "completed",
          timestamp: Date.now(),
          executionStats: {
            durationMs: event.toolResponseStats.totalDurationMs,
            totalTokens: event.toolResponseStats.totalTokens,
            toolUseCount: event.toolResponseStats.totalToolUseCount,
            inputTokens: event.toolResponseStats.usage?.input_tokens,
            outputTokens: event.toolResponseStats.usage?.output_tokens,
            cacheHitTokens: event.toolResponseStats.usage?.cache_read_input_tokens,
          },
          subagentId: event.toolResponseStats.agentId,
        })
      }

      // Always emit with streaming content to show accumulated text
      // Handle the promise to avoid unhandled rejections in the main process
      emitProgress(
        steps.length > 0 ? steps : [{
          id: generateStepId("acp-streaming"),
          type: "thinking",
          title: "Agent response",
          status: "in_progress",
          timestamp: Date.now(),
          llmContent: accumulatedText,
        }],
        false,
        undefined,
        {
          text: accumulatedText,
          isStreaming: !event.isComplete,
        }
      ).catch(err => {
        logApp(`[ACP Main] Failed to emit progress: ${err}`)
      })
    }

    acpService.on("sessionUpdate", progressHandler)

    try {
      // Send the prompt
      await emitSetupProgress("sending_prompt")
      const promptContext = buildProfileContext(profileSnapshot, ACP_RUNTIME_TOOL_PROMPT_CONTEXT)
      const result = await acpService.sendPrompt(agentName, preferredSessionName, transcript, promptContext)
      if (result.sessionId && result.sessionId !== acpSessionId) {
        traceAcpSessionId = result.sessionId
        updateConversationRuntimeSessionId(conversationId, result.sessionId)
        registerKnownAppSessionId(sessionId)
        setAcpToAppSessionMapping(result.sessionId, sessionId, runId)
      }

      const { userResponse, finalResponse } = deriveFinalAssistantResponse(result.response)
      traceOutput = finalResponse || ""
      traceError = result.success ? undefined : result.error
      traceStopReason = result.stopReason

      if (finalResponse && !userResponse && !sawAssistantTextBlock) {
        appendAssistantText(finalResponse, Date.now())
      } else if (finalResponse && !userResponse && accumulatedText && finalResponse.startsWith(accumulatedText)) {
        appendAssistantText(finalResponse.slice(accumulatedText.length), Date.now())
        accumulatedText = finalResponse
      }

      // Emit completion with final accumulated text
      await emitProgress([
        {
          id: generateStepId("acp-complete"),
          type: "completion",
          title: result.success ? "Response complete" : "Request failed",
          description: result.error,
          status: result.success ? "completed" : "error",
          timestamp: Date.now(),
          llmContent: finalResponse,
        },
      ], true, finalResponse, {
        text: finalResponse || "",
        isStreaming: false,
      })

      try {
        await persistConversationTail(finalResponse)
      } catch (persistError) {
        logApp(`[ACP Main] Failed to persist conversation tail: ${persistError}`)
      }

      logApp(`[ACP Main] Completed - success: ${result.success}, response length: ${finalResponse?.length || 0}`)

      return {
        success: result.success,
        response: finalResponse,
        acpSessionId,
        stopReason: result.stopReason,
        error: result.error,
      }
    } finally {
      acpService.off("sessionUpdate", progressHandler)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const { finalResponse } = deriveFinalAssistantResponse()
    traceOutput = finalResponse || ""
    traceError = errorMessage
    logApp(`[ACP Main] Error: ${errorMessage}`)

    await emitProgress([
      {
        id: generateStepId("acp-error"),
        type: "completion",
        title: "Error",
        description: errorMessage,
        status: "error",
        timestamp: Date.now(),
        llmContent: finalResponse,
      },
    ], true, finalResponse, {
      text: finalResponse || "",
      isStreaming: false,
    })

    try {
      await persistConversationTail(finalResponse)
    } catch (persistError) {
      logApp(`[ACP Main] Failed to persist conversation tail after error: ${persistError}`)
    }

    return {
      success: false,
      error: errorMessage,
    }
  } finally {
    if (tracingEnabled) {
      for (const tracked of trackedToolCalls.values()) {
        if (tracked.spanId && !tracked.spanEnded) {
          endToolSpan(tracked.spanId, {
            level: "WARNING",
            statusMessage: traceError || "ACP session ended before tool completed",
          })
          tracked.spanEnded = true
        }
      }

      endAgentTrace(sessionId, {
        output: traceOutput,
        metadata: {
          agentName,
          conversationId,
          acpSessionId: traceAcpSessionId,
          success: !traceError,
          error: traceError,
          stopReason: traceStopReason,
        },
      })
      await flushLangfuse().catch(() => {})
    }
  }
}
