import { configStore, globalAgentsFolder, resolveWorkspaceAgentsFolder } from "./config"
import {
  MCPTool,
  MCPToolCall,
  LLMToolCallResponse,
  MCPToolResult,
} from "./mcp-service"
import { AgentProgressStep, AgentProgressUpdate, SessionProfileSnapshot } from "../shared/types"
import { diagnosticsService } from "./diagnostics"

import { makeLLMCallWithFetch, makeTextCompletionWithFetch, verifyCompletionWithFetch, RetryProgressCallback, makeLLMCallWithStreamingAndTools, StreamingCallback } from "./llm-fetch"
import { constructSystemPrompt } from "./system-prompts"
import { state, agentSessionStateManager } from "./state"
import { isDebugLLM, logLLM, isDebugTools, logTools } from "./debug"
import { shrinkMessagesForLLM, estimateTokensFromMessages, clearActualTokenUsage, clearIterativeSummary, clearContextRefs, clearArchiveFrontier, clearSummarizationFailureFlags } from "./context-budget"
import { emitAgentProgress } from "./emit-agent-progress"
import { agentSessionTracker } from "./agent-session-tracker"
import { conversationService } from "./conversation-service"
import { getAcpSessionTitleOverride } from "./acp-session-state"
import { hasRepeatTaskTitlePrefix } from "../shared/repeat-tasks"
import { DEFAULT_TRANSCRIPT_POST_PROCESSING_PROMPT, getCurrentPresetName } from "@dotagents/shared"
import {
  createAgentTrace,
  endAgentTrace,
  isLangfuseEnabled,
  flushLangfuse,
} from "./langfuse-service"
import {
  isSummarizationEnabled,
  shouldSummarizeStep,
  summarizeAgentStep,
  summarizationService,
  type SummarizationInput,
} from "./summarization-service"
import { knowledgeNotesService } from "./knowledge-notes-service"
import {
  getSessionUserResponse,
  getSessionRunUserResponseEvents,
  getSessionUserResponseHistory,
} from "./session-user-response-store"
import {
  getLatestRespondToUserContentFromConversationHistory,
  getUnmaterializedUserResponseEvents,
  normalizeUserFacingResponseContent,
  resolveLatestUserFacingResponse,
} from "./respond-to-user-utils"
import {
  MARK_WORK_COMPLETE_TOOL,
  RESPOND_TO_USER_TOOL,
  INTERNAL_COMPLETION_NUDGE_TEXT,
} from "../shared/runtime-tool-names"
import {
  appendAgentStopNote,
  resolveAgentIterationLimits,
} from "./agent-run-utils"
import { filterEphemeralMessages, isInternalNudgeContent } from "./conversation-history-utils"
import {
  filterNamedItemsToAllowedTools,
} from "./llm-tool-gating"
import { sanitizeMessageContentForDisplay } from "@dotagents/shared"
import {
  isDeliverableResponseContent,
  isGarbledToolCallText,
  isProgressUpdateResponse,
  normalizeMissingItemsList,
  normalizeVerificationResultForCompletion,
  resolveIterationLimitFinalContent,
} from "./llm-continuation-guards"
import { buildVerificationMessagesFromAgentState } from "./llm-verification-replay"
import { loadWorkingKnowledgeNotesForPrompt } from "./working-notes-runtime"
import {
  normalizeAgentConversationState,
  type AgentConversationState,
} from "@dotagents/shared"

const AGENT_PROGRESS_CONVERSATION_HISTORY_WINDOW_SIZE = 120

/**
 * Clean error message by removing stack traces and noise
 */
function cleanErrorMessage(errorText: string): string {
  // Remove stack traces (lines starting with "at " after an error)
  const lines = errorText.split('\n')
  const cleanedLines: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    // Skip stack trace lines
    if (trimmed.startsWith('at ')) continue
    // Skip file path lines
    if (trimmed.match(/^\s*at\s+.*\.(js|ts|mjs):\d+/)) continue
    // Skip empty lines in stack traces
    if (cleanedLines.length > 0 && trimmed === '' && lines.indexOf(line) > 0) {
      const prevLine = lines[lines.indexOf(line) - 1]?.trim()
      if (prevLine?.startsWith('at ')) continue
    }
    cleanedLines.push(line)
  }

  let cleaned = cleanedLines.join('\n').trim()

  // Remove duplicate error class names (e.g., "CodeExecutionTimeoutError: Code execution timed out")
  cleaned = cleaned.replace(/(\w+Error):\s*\1:/g, '$1:')

  // Truncate if still too long
  if (cleaned.length > 500) {
    cleaned = cleaned.substring(0, 500) + '...'
  }

  return cleaned
}

function resolveProgressConversationState(update: Pick<AgentProgressUpdate, "conversationState" | "isComplete" | "pendingToolApproval" | "finalContent">): AgentConversationState {
  const isKillSwitchCompletion =
    update.isComplete &&
    typeof update.finalContent === "string" &&
    update.finalContent.includes("emergency kill switch")

  if (update.conversationState) {
    return normalizeAgentConversationState(
      update.conversationState,
      update.isComplete ? "complete" : "running",
    )
  }

  if (update.pendingToolApproval) {
    return "needs_input"
  }

  if (isKillSwitchCompletion) {
    return "blocked"
  }

  return update.isComplete ? "complete" : "running"
}

function getVerificationOutcomeDescription(state: AgentConversationState): string {
  switch (state) {
    case "complete":
      return "Verification passed"
    case "needs_input":
      return "Verification passed - waiting for user input"
    case "blocked":
      return "Verification passed - conversation is blocked"
    default:
      return "Verification failed - continue iteration"
  }
}

/**
 * Extract a compact, ID-focused skills index suitable for Tier-3 minimal prompts.
 *
 * Why: Tier-3 context shrinking replaces the entire system prompt. If we drop skill IDs,
 * the model cannot call load_skill_instructions and will tend to over-use MCP tools.
 */
function extractSkillsIndexForMinimalPrompt(skillsInstructions?: string): string | undefined {
  const text = (skillsInstructions || "").trim()
  if (!text) return undefined

  const lines = text.split(/\r?\n/)
  const skillLines = lines
    .map((l) => l.trimEnd())
    // Match the canonical index format from skills-service:
    // - `skill-id` — description
    .filter((l) => {
      const t = l.trim()
      return t.startsWith("- `") && t.includes("` —")
    })

  if (skillLines.length > 0) {
    return skillLines.slice(0, 50).join("\n")
  }

  // Fallback: keep the top portion (drop folder paths/directory info) and cap length.
  const marker = "\nSkills directory:"
  const idx = text.indexOf(marker)
  const cut = (idx >= 0 ? text.slice(0, idx) : text).trim()
  if (!cut) return undefined
  return cut.length > 1500 ? cut.slice(0, 1500).trimEnd() + "\n..." : cut
}

const NON_AGENT_WORKING_NOTES_LIMIT = 3
const AGENT_WORKING_NOTES_LIMIT = 4

function isInvalidExecuteCommandSkillIdFailure(toolName: string | undefined, result: MCPToolResult): boolean {
  if (toolName !== "execute_command" || !result.isError) return false

  const errorText = result.content
    .map((content) => content.text)
    .join(" ")
    .toLowerCase()

  return errorText.includes("invalid execute_command.skillid")
    || (errorText.includes("skill not found") && errorText.includes("omit skillid"))
}

function isLikelyAnswerOnlyContinuationTurn(
  transcript: string,
  previousConversationHistory?: Array<{ role: string; content?: string; toolCalls?: unknown[]; toolResults?: unknown[] }>,
): boolean {
  const priorHistory = previousConversationHistory || []
  const hasPriorEvidence = priorHistory.some((entry) =>
    entry.role === "tool"
    || (Array.isArray(entry.toolCalls) && entry.toolCalls.length > 0)
    || (Array.isArray(entry.toolResults) && entry.toolResults.length > 0),
  )
  if (!hasPriorEvidence) return false

  const normalized = transcript.toLowerCase().replace(/\s+/g, " ").trim()
  if (!normalized) return false

  const words = normalized.split(" ").filter(Boolean)
  const startsAsQuestionOrStatus = /^(what|why|how|did|does|is|are|can|should|summarize|summary|status|current|continue|next|explain|check|test)\b/.test(normalized)
  const containsStatusCue = /\b(current state|next safest action|next safe action|what happened|what should|status|summarize|summary|blocker|known|unknown|confirmed|worked|works|failed|done|complete)\b/.test(normalized)

  return words.length <= 40 && (normalized.endsWith("?") || startsAsQuestionOrStatus || containsStatusCue)
}

function findPriorAnswerForExactRepeatContinuation(
  transcript: string,
  previousConversationHistory?: Array<{ role: string; content?: string; toolCalls?: Array<{ name?: string; arguments?: any }> }>,
): string | undefined {
  const normalized = transcript.toLowerCase().replace(/\s+/g, " ").trim()
  if (!normalized || normalized.split(" ").length > 20) return undefined
  if (/\b(again|retry|rerun|redo|repeat)\b/.test(normalized)) return undefined

  const history = previousConversationHistory || []
  const previousUserIndex = history.findLastIndex((entry) =>
    entry.role === "user"
    && (entry.content || "").toLowerCase().replace(/\s+/g, " ").trim() === normalized,
  )
  if (previousUserIndex < 0) return undefined

  const latestUserIndex = history.findLastIndex((entry) => entry.role === "user")
  if (previousUserIndex !== latestUserIndex) return undefined

  for (let index = history.length - 1; index > previousUserIndex; index -= 1) {
    const entry = history[index]
    if (entry.role === "user") return undefined
    for (const toolCall of entry.toolCalls || []) {
      if (toolCall?.name === RESPOND_TO_USER_TOOL) {
        const response = normalizeUserFacingResponseContent(
          toolCall.arguments?.text || toolCall.arguments?.response || "",
        )
        if (response && isDeliverableResponseContent(response)) return response
      }
    }

    if (entry.role === "assistant") {
      const content = (entry.content || "").replace(/<think>[\s\S]*?<\/think>/gi, "").trim()
      if (content && isDeliverableResponseContent(content)) return content
    }
  }

  return undefined
}

function isEmptyExecuteCommandCall(toolCall: MCPToolCall): boolean {
  if (toolCall.name !== "execute_command") return false
  const args = toolCall.arguments as any
  return !args || typeof args !== "object" || typeof args.command !== "string" || args.command.trim().length === 0
}

function buildAnswerOnlyContinuationDigest(
  omittedHistory: Array<{ role: string; content?: string }>,
): string {
  const formatSnippet = (entry: { role: string; content?: string }) => {
    let text = sanitizeMessageContentForDisplay(entry.content || "")
      .replace(/\s+/g, " ")
      .trim()

    if (entry.role === "assistant") {
      text = text
        .replace(/^<think>\s*\*\*[^*]+\*\*\s*/i, "Thinking: ")
        .replace(/^<think>\s*/i, "Thinking: ")
        .replace(/<\/think>/gi, "")
    } else if (entry.role === "tool") {
      const toolName = text.match(/^\[([^\]]+)\]/)?.[1]
      if (toolName === RESPOND_TO_USER_TOOL) {
        text = `[${RESPOND_TO_USER_TOOL}] delivered user response`
      } else if (toolName === "set_session_title") {
        const title = text.match(/"title":\s*"([^"]+)"/)?.[1]
        text = title ? `[set_session_title] ${title}` : `[set_session_title] updated title`
      } else {
        text = text
          .replace(/^\[([^\]]+)\]\s*\{\s*"success":\s*(true|false),\s*/i, "[$1] ")
          .replace(/"command":\s*"/g, "command: ")
          .replace(/",\s*"cwd":\s*"/g, " cwd: ")
      }
    }

    const snippetLimit = entry.role === "assistant" && text.startsWith("Thinking:") ? 200 : entry.role === "user" ? 160 : 240
    text = text.slice(0, snippetLimit)
    return text ? `- ${entry.role}: ${text}` : ""
  }

  const userSnippets = omittedHistory
    .filter((entry) => entry.role === "user")
    .slice(-3)
    .map(formatSnippet)
    .filter(Boolean)

  const evidenceSnippets = omittedHistory
    .filter((entry) => entry.role === "assistant" || entry.role === "tool")
    .slice(-5)
    .map(formatSnippet)
    .filter(Boolean)

  return [
    `[Older context: ${omittedHistory.length} omitted.]`,
    `Background; prefer recent messages.`,
    userSnippets.length ? `Older constraints:\n${userSnippets.join("\n")}` : "",
    evidenceSnippets.length ? `Older evidence:\n${evidenceSnippets.join("\n")}` : "",
  ].filter(Boolean).join("\n")
}

export async function postProcessTranscript(transcript: string) {
  const config = configStore.get()

  if (!config.transcriptPostProcessingEnabled) {
    return transcript
  }

  let prompt = config.transcriptPostProcessingPrompt?.trim() || DEFAULT_TRANSCRIPT_POST_PROCESSING_PROMPT

  if (prompt.includes("{transcript}")) {
    prompt = prompt.replaceAll("{transcript}", transcript)
  } else {
    prompt = prompt + "\n\n" + transcript
  }

  const chatProviderId = config.transcriptPostProcessingProviderId

  try {
    const result = await makeTextCompletionWithFetch(prompt, chatProviderId)
    return result
  } catch (error) {
    throw error
  }
}

export async function processTranscriptWithTools(
  transcript: string,
  availableTools: MCPTool[],
): Promise<LLMToolCallResponse> {
  const config = configStore.get()

  const uniqueAvailableTools = availableTools.filter(
    (tool, index, self) =>
      index === self.findIndex((t) => t.name === tool.name),
  )

  // Load enabled agent skills instructions for non-agent mode too
  // Uses the Main Agent's skills config if available, otherwise globally enabled skills
  const { skillsService } = await import("./skills-service")
  const { agentProfileService } = await import("./agent-profile-service")
  const mainAgent = agentProfileService.getCurrentProfile()
  const userGuidelines = mainAgent?.guidelines || ""
  const enabledSkillIdsOrNull = mainAgent
    ? agentProfileService.getEnabledSkillIdsForProfile(mainAgent.id)
    : []
  // null means "all skills enabled by default" — resolve to all available skill IDs
  const enabledSkillIds = enabledSkillIdsOrNull === null
    ? skillsService.refreshFromDisk().map(s => s.id)
    : enabledSkillIdsOrNull
  const skillsInstructions = skillsService.getEnabledSkillsInstructionsForProfile(enabledSkillIds)
  const skillsIndex = extractSkillsIndexForMinimalPrompt(skillsInstructions)

  const workspaceAgentsFolder = resolveWorkspaceAgentsFolder()
  const workingNotes = loadWorkingKnowledgeNotesForPrompt({
    globalAgentsDir: globalAgentsFolder,
    workspaceAgentsDir: workspaceAgentsFolder,
    maxNotes: NON_AGENT_WORKING_NOTES_LIMIT,
  })
  logLLM(`[processTranscriptWithLLM] Loaded ${workingNotes.length} working notes for prompt context`)

  const systemPrompt = constructSystemPrompt(
    uniqueAvailableTools,
    userGuidelines,
    false,
    undefined,
    mainAgent?.systemPrompt,
    skillsInstructions,
    undefined, // agentProperties - not used in non-agent mode
    workingNotes,
  )

  const messages = [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: transcript,
    },
  ]

  const { messages: shrunkMessages } = await shrinkMessagesForLLM({
    messages,
    availableTools: uniqueAvailableTools,
    isAgentMode: false,
    skillsIndex,
  })

  const chatProviderId = config.mcpToolsProviderId

  try {
    // Pass tools for native AI SDK tool calling
    const result = await makeLLMCallWithFetch(
      shrunkMessages,
      chatProviderId,
      undefined,
      undefined,
      uniqueAvailableTools,
    )

    // Defensive: don't allow JSON-fallback toolCalls to escape the tools we actually provided.
    if (result.toolCalls && Array.isArray(result.toolCalls) && result.toolCalls.length > 0) {
      const { allowed, removed } = filterNamedItemsToAllowedTools(result.toolCalls, uniqueAvailableTools)
      if (removed.length > 0 && isDebugTools()) {
        logTools("Filtered non-agent toolCalls not present in provided tools", {
          removed: removed.map((tc) => tc.name),
        })
      }
      result.toolCalls = allowed.length > 0 ? (allowed as any) : undefined
    }

    // Strip any raw tool-marker tokens (e.g. <|tool_call_begin|>) that
    // makeLLMCallWithFetch preserves for the agent loop's recovery path.
    // This non-agent flow returns content directly to the renderer.
    if (result.content) {
      const stripped = result.content.replace(/<\|[^|]*\|>/g, "").trim()
      // Only update if stripping produced non-empty content; if the response
      // was marker-only, replace with empty string rather than falling back
      // to the raw marker text (which would leak special tokens to the renderer).
      result.content = stripped || ""
    }
    return result
  } catch (error) {
    throw error
  }
}

export interface AgentModeResponse {
  content: string
  conversationHistory: Array<{
    role: "user" | "assistant" | "tool"
    content: string
    timestamp?: number
    toolCalls?: MCPToolCall[]
    toolResults?: MCPToolResult[]
    branchMessageIndex?: number
  }>
  totalIterations: number
}

function createProgressStep(
  type: AgentProgressStep["type"],
  title: string,
  description?: string,
  status: AgentProgressStep["status"] = "pending",
): AgentProgressStep {
  return {
    id: `step_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    type,
    title,
    description,
    status,
    timestamp: Date.now(),
  }
}

/**
 * Result from a single tool execution including metadata for progress tracking
 */
interface ToolExecutionResult {
  toolCall: MCPToolCall
  result: MCPToolResult
  retryCount: number
  cancelledByKill: boolean
}

/**
 * Execute a single tool call with retry logic and kill switch support
 * This helper is used by both sequential and parallel execution modes
 */
async function executeToolWithRetries(
  toolCall: MCPToolCall,
  executeToolCall: (toolCall: MCPToolCall, onProgress?: (message: string) => void) => Promise<MCPToolResult>,
  currentSessionId: string,
  onToolProgress: (message: string) => void,
  maxRetries: number = 2,
): Promise<ToolExecutionResult> {
  // Check for stop signal before starting
  if (agentSessionStateManager.shouldStopSession(currentSessionId)) {
    return {
      toolCall,
      result: {
        content: [{ type: "text", text: "Tool execution cancelled by emergency kill switch" }],
        isError: true,
      },
      retryCount: 0,
      cancelledByKill: true,
    }
  }

  // Execute tool with cancel-aware race so kill switch can stop mid-tool
  let cancelledByKill = false
  let cancelInterval: ReturnType<typeof setInterval> | null = null
  const stopPromise: Promise<MCPToolResult> = new Promise((resolve) => {
    cancelInterval = setInterval(() => {
      if (agentSessionStateManager.shouldStopSession(currentSessionId)) {
        cancelledByKill = true
        if (cancelInterval) clearInterval(cancelInterval)
        resolve({
          content: [{ type: "text", text: "Tool execution cancelled by emergency kill switch" }],
          isError: true,
        })
      }
    }, 100)
  })

  const execPromise = executeToolCall(toolCall, onToolProgress)
  let result = (await Promise.race([
    execPromise,
    stopPromise,
  ])) as MCPToolResult
  // Avoid unhandled rejection if the tool promise rejects after we already stopped
  if (cancelledByKill) {
    execPromise.catch(() => { /* swallow after kill switch */ })
  }
  if (cancelInterval) clearInterval(cancelInterval)

  if (cancelledByKill) {
    return {
      toolCall,
      result,
      retryCount: 0,
      cancelledByKill: true,
    }
  }

  // Enhanced retry logic for specific error types
  let retryCount = 0
  while (result.isError && retryCount < maxRetries) {
    // Check kill switch before retrying
    if (agentSessionStateManager.shouldStopSession(currentSessionId)) {
      return {
        toolCall,
        result: {
          content: [{ type: "text", text: "Tool execution cancelled by emergency kill switch" }],
          isError: true,
        },
        retryCount,
        cancelledByKill: true,
      }
    }

    const errorText = result.content
      .map((c) => c.text)
      .join(" ")
      .toLowerCase()

    // Check if this is a retryable error
    const isRetryableError =
      errorText.includes("timeout") ||
      errorText.includes("connection") ||
      errorText.includes("network") ||
      errorText.includes("temporary") ||
      errorText.includes("busy")

    if (isRetryableError) {
      retryCount++

      // Wait before retry (exponential backoff)
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, retryCount) * 1000),
      )

      result = await executeToolCall(toolCall, onToolProgress)
    } else {
      break // Don't retry non-transient errors
    }
  }

  return {
    toolCall,
    result,
    retryCount,
    cancelledByKill: false,
  }
}

export async function processTranscriptWithAgentMode(
  transcript: string,
  availableTools: MCPTool[],
  executeToolCall: (toolCall: MCPToolCall, onProgress?: (message: string) => void) => Promise<MCPToolResult>,
  maxIterations: number = 10,
  previousConversationHistory?: Array<{
    role: "user" | "assistant" | "tool"
    content: string
    toolCalls?: MCPToolCall[]
    toolResults?: MCPToolResult[]
    timestamp?: number
    branchMessageIndex?: number
  }>,
  conversationId?: string, // Conversation ID for linking to conversation history
  sessionId?: string, // Session ID for progress routing and isolation
  onProgress?: (update: AgentProgressUpdate) => void, // Optional callback for external progress consumers (e.g., SSE)
  profileSnapshot?: SessionProfileSnapshot, // Profile snapshot for session isolation
  runId?: number,
): Promise<AgentModeResponse> {
  const config = configStore.get()
  const forceFinalSummary = config.mcpFinalSummaryEnabled === true
  const { loopMaxIterations, guardrailBudget } = resolveAgentIterationLimits(maxIterations)
  maxIterations = loopMaxIterations

  // Store IDs for use in progress updates
  const currentConversationId = conversationId
  const currentSessionId =
    sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  // Number of messages in the conversation history that predate this agent session.
  // Used by the UI to show only this session's messages while still saving full history.
  // When continuing a conversation, we set this to 0 so the UI shows the full history.
  // The user explicitly wants to see the previous context when they click "Continue".
  const sessionStartIndex = 0

  // For session isolation: prefer the stored snapshot over the passed-in one
  // This ensures that when reusing an existing sessionId, we maintain the original profile settings
  // and don't allow mid-session profile changes to affect the session
  const storedSnapshot = sessionId ? agentSessionStateManager.getSessionProfileSnapshot(sessionId) : undefined
  const effectiveProfileSnapshot = storedSnapshot ?? profileSnapshot

  // Ensure this run always has a concrete runId.
  // - If caller already started the run (and passed runId), keep that ID.
  // - Otherwise start a new run here for flows that call this function directly.
  let effectiveRunId: number
  if (typeof runId === "number") {
    agentSessionStateManager.createSession(currentSessionId, effectiveProfileSnapshot)
    effectiveRunId = runId
  } else {
    effectiveRunId = agentSessionStateManager.startSessionRun(currentSessionId, effectiveProfileSnapshot)
  }

  // Track step summaries for dual-model mode
  const stepSummaries: import("../shared/types").AgentStepSummary[] = []

  // Create Langfuse trace for this agent session if enabled
  // - traceId: unique ID for this trace (our agent session ID)
  // - sessionId: groups traces together in Langfuse (our conversation ID)
  if (isLangfuseEnabled()) {
    createAgentTrace(currentSessionId, {
      name: "Agent Session",
      sessionId: currentConversationId,  // Groups all agent sessions in this conversation
      metadata: {
        maxIterations,
        hasHistory: !!previousConversationHistory?.length,
        profileId: effectiveProfileSnapshot?.profileId,
        profileName: effectiveProfileSnapshot?.profileName,
      },
      input: transcript,
      tags: effectiveProfileSnapshot?.profileName
        ? [`profile:${effectiveProfileSnapshot.profileName}`]
        : undefined,
    })
  }

  // Declare variables that need to be accessible in the finally block for Langfuse tracing
  let iteration = 0
  let finalContent = ""
  let wasAborted = false // Track if agent was aborted for observability
  let toolsExecutedInSession = false // Track if ANY tools were executed, survives context shrinking
  let lastContextBudgetInfo: { estTokensAfter: number; maxTokens: number; appliedStrategies?: string[] } | undefined

  try {
  // Track context usage info for progress display
  // Declared here so emit() can access it
  let contextInfoRef: { estTokens: number; maxTokens: number } | undefined = undefined

  // Get model info for progress display
  const providerId = config.mcpToolsProviderId || "openai"
  const modelName = providerId === "openai"
    ? config.mcpToolsOpenaiModel || "gpt-4.1-mini"
    : providerId === "groq"
    ? config.mcpToolsGroqModel || "openai/gpt-oss-120b"
    : providerId === "gemini"
    ? config.mcpToolsGeminiModel || "gemini-2.5-flash"
    : providerId === "chatgpt-web"
    ? config.mcpToolsChatgptWebModel || "gpt-5.4-mini"
    : "gpt-4.1-mini"
  // For OpenAI provider, use the preset name (e.g., "OpenRouter", "Together AI")
  const providerDisplayName = providerId === "openai"
    ? getCurrentPresetName(config.currentModelPresetId, config.modelPresets)
    : providerId === "groq" ? "Groq" : providerId === "gemini" ? "Gemini" : providerId === "chatgpt-web" ? "OpenAI Codex" : providerId
  const modelInfoRef = { provider: providerDisplayName, model: modelName }
  // Seed lastEmittedUserResponse with the latest respond_to_user content from
  // previous conversation history. This prevents the emit() guard from
  // re-emitting a stale response from a prior turn on the very first progress
  // event of a follow-up (which would trigger outdated TTS on mobile).
  let lastEmittedUserResponse: string | undefined =
    getLatestRespondToUserContentFromConversationHistory(
      (previousConversationHistory as any) ?? []
    )
  const materializedUserResponseEventIds = new Set<string>()

  // Create bound emitter that always includes sessionId, conversationId, snooze state, sessionStartIndex, conversationTitle, and contextInfo
  const emit = (
    update: Omit<AgentProgressUpdate, 'sessionId' | 'runId' | 'conversationId' | 'isSnoozed' | 'conversationTitle'>,
  ) => {
    const isSnoozed = agentSessionTracker.isSessionSnoozed(currentSessionId)
    const session = agentSessionTracker.getSession(currentSessionId)
    const conversationTitle =
      session?.conversationTitle ?? getAcpSessionTitleOverride(currentSessionId)
    const profileName = session?.profileSnapshot?.profileName
    const responseEvents = getSessionRunUserResponseEvents(currentSessionId, effectiveRunId)
    const storedUserResponse = getSessionUserResponse(currentSessionId, effectiveRunId)
    // Live progress should only surface executed respond_to_user output. Falling
    // back to the current conversationHistory can read the planned tool-call args
    // before runtime-tools has materialized local image paths into renderable
    // conversation assets, causing a duplicate non-renderable "Local image" bubble.
    const normalizedStoredUserResponse = resolveLatestUserFacingResponse({
      storedResponse: storedUserResponse,
      responseEvents,
    })
    const conversationState = resolveProgressConversationState({
      conversationState: update.conversationState,
      isComplete: update.isComplete,
      pendingToolApproval: update.pendingToolApproval,
      finalContent: update.finalContent,
    })
    const userResponseForUpdate =
      update.userResponse ??
      normalizedStoredUserResponse
    const userResponseSource =
      update.userResponse !== undefined
        ? "update"
        : normalizedStoredUserResponse !== undefined
        ? "store"
        : "none"
    const shouldEmitUserResponse =
      userResponseForUpdate !== undefined &&
      userResponseForUpdate !== lastEmittedUserResponse

    // Get history of past respond_to_user calls (excluding current)
    const responseHistory = getSessionUserResponseHistory(currentSessionId, effectiveRunId)

    const windowedConversationHistory = update.conversationHistory
      ? (() => {
          const totalCount = update.conversationHistory?.length ?? 0
          const startIndex = Math.max(0, totalCount - AGENT_PROGRESS_CONVERSATION_HISTORY_WINDOW_SIZE)
          return {
            conversationHistory: update.conversationHistory?.slice(startIndex),
            conversationHistoryStartIndex: startIndex,
            conversationHistoryTotalCount: totalCount,
          }
        })()
      : {}

    const fullUpdate: AgentProgressUpdate = {
      ...update,
      ...windowedConversationHistory,
      // Only include userResponse when it changed. This avoids re-sending large
      // image payloads on every progress tick while preserving merge behavior.
      ...(shouldEmitUserResponse ? { userResponse: userResponseForUpdate } : {}),
      ...(responseEvents.length > 0 ? { responseEvents } : {}),
      // Include response history if there are past responses
      ...(shouldEmitUserResponse && responseHistory.length > 0 ? { userResponseHistory: responseHistory } : {}),
      conversationState,
      sessionId: currentSessionId,
      runId: effectiveRunId,
      conversationId: currentConversationId,
      conversationTitle,
      isSnoozed,
      sessionStartIndex,
      // Always include current context info if available
      contextInfo: update.contextInfo ?? contextInfoRef,
      // Always include model info
      modelInfo: modelInfoRef,
      // Include profile name from session snapshot for UI display
      profileName,
      // Dual-model summarization data (from service - single source of truth)
      stepSummaries: summarizationService.getSummaries(currentSessionId),
      latestSummary: summarizationService.getLatestSummary(currentSessionId),
    }

    if (shouldEmitUserResponse) {
      logLLM("[emit] Including userResponse in progress update", {
        sessionId: currentSessionId,
        conversationId: currentConversationId,
        source: userResponseSource,
        responseLength: userResponseForUpdate?.length || 0,
        historyLength: responseHistory.length,
        isComplete: !!update.isComplete,
      })
      lastEmittedUserResponse = userResponseForUpdate
    }

    // Fire and forget - don't await, but catch errors
    emitAgentProgress(fullUpdate).catch(err => {
      logLLM("[emit] Failed to emit agent progress:", err)
    })

    // Also call external progress callback if provided (for SSE streaming, etc.)
    if (onProgress) {
      try {
        onProgress(fullUpdate)
      } catch (err) {
        logLLM("[emit] Failed to call onProgress callback:", err)
      }
    }
  }

  // Helper function to save a message incrementally to the conversation
  // This ensures messages are persisted even if the agent crashes or is stopped
  const saveMessageIncremental = async (
    role: "user" | "assistant" | "tool",
    content: string,
    toolCalls?: MCPToolCall[],
    toolResults?: MCPToolResult[]
  ) => {
    if (!currentConversationId) {
      return // No conversation to save to
    }

    try {
      // Convert toolResults from MCPToolResult format to stored format
      const convertedToolResults = toolResults?.map(tr => ({
        success: !tr.isError,
        content: Array.isArray(tr.content)
          ? tr.content.map(c => c.text).join("\n")
          : String(tr.content || ""),
        error: tr.isError
          ? (Array.isArray(tr.content) ? tr.content.map(c => c.text).join("\n") : String(tr.content || ""))
          : undefined
      }))

      const updatedConversation = await conversationService.addMessageToConversation(
        currentConversationId,
        content,
        role,
        toolCalls,
        convertedToolResults
      )

      if (role === "assistant" && currentConversationId && sessionId) {
        void conversationService.maybeAutoGenerateConversationTitle(currentConversationId, sessionId)
          .then((retitledConversation) => {
            if (!retitledConversation?.title) {
              return
            }

            const trackedSession = agentSessionTracker.getSession(sessionId)
            const shouldPreserveRepeatTaskTitle = hasRepeatTaskTitlePrefix(
              trackedSession?.conversationTitle,
            ) && !hasRepeatTaskTitlePrefix(retitledConversation.title)
            if (
              !shouldPreserveRepeatTaskTitle &&
              trackedSession?.conversationTitle !== retitledConversation.title
            ) {
              agentSessionTracker.updateSession(sessionId, {
                conversationTitle: retitledConversation.title,
              })
            }
          })
          .catch((error) => {
            logLLM("[saveMessageIncremental] Failed to auto-generate session title:", error)
          })
      } else if (updatedConversation?.title && sessionId) {
        const trackedSession = agentSessionTracker.getSession(sessionId)
        const shouldPreserveRepeatTaskTitle = hasRepeatTaskTitlePrefix(
          trackedSession?.conversationTitle,
        ) && !hasRepeatTaskTitlePrefix(updatedConversation.title)
        if (
          !shouldPreserveRepeatTaskTitle &&
          trackedSession?.conversationTitle !== updatedConversation.title
        ) {
          agentSessionTracker.updateSession(sessionId, {
            conversationTitle: updatedConversation.title,
          })
        }
      }

      if (isDebugLLM()) {
        logLLM("💾 Saved message incrementally", {
          conversationId: currentConversationId,
          role,
          contentLength: content.length,
          hasToolCalls: !!toolCalls,
          hasToolResults: !!toolResults
        })
      }
    } catch (error) {
      // Log but don't throw - persistence failures shouldn't crash the agent
      logLLM("[saveMessageIncremental] Failed to save message:", error)
      diagnosticsService.logWarning("llm", "Failed to save message incrementally", error)
    }
  }

  // Helper function to generate a step summary using the weak model (if dual-model enabled)
  const generateStepSummary = async (
    stepNumber: number,
    toolCalls?: MCPToolCall[],
    toolResults?: MCPToolResult[],
    assistantResponse?: string,
    isCompletion?: boolean,
  ) => {
    if (!isSummarizationEnabled()) {
      return null
    }

    const hasToolCalls = !!toolCalls && toolCalls.length > 0
    const isCompletionStep = isCompletion ?? false

    if (!shouldSummarizeStep(hasToolCalls, isCompletionStep)) {
      return null
    }

    const input: SummarizationInput = {
      sessionId: currentSessionId,
      stepNumber,
      toolCalls: toolCalls?.map(tc => ({
        name: tc.name,
        arguments: tc.arguments,
      })),
      toolResults: toolResults?.map(tr => ({
        success: !tr.isError,
        content: Array.isArray(tr.content)
          ? tr.content.map(c => c.text).join("\n")
          : String(tr.content || ""),
        error: tr.isError
          ? (Array.isArray(tr.content) ? tr.content.map(c => c.text).join("\n") : String(tr.content || ""))
          : undefined,
      })),
      assistantResponse,
      recentMessages: conversationHistory.slice(-5).map(m => ({
        role: m.role,
        content: m.content,
      })),
    }

    try {
      const summary = await summarizeAgentStep(input)
      if (summary) {
        summarizationService.addSummary(summary)

        // Auto-save summary working notes directly under .agents/knowledge
        {
          const note = knowledgeNotesService.createNoteFromSummary(
            summary,
            undefined, // title
            undefined, // userNotes
            undefined, // tags
            undefined, // conversationTitle
            currentConversationId,
          )
          if (note) {
            knowledgeNotesService.saveNote(note).catch(err => {
              if (isDebugLLM()) {
                logLLM("[Dual-Model] Error auto-saving summary:", err)
              }
            })
          }
        }

        if (isDebugLLM()) {
          logLLM("[Dual-Model] Generated step summary:", {
            stepNumber: summary.stepNumber,
            importance: summary.importance,
            actionSummary: summary.actionSummary,
          })
        }

        return summary
      }
    } catch (error) {
      if (isDebugLLM()) {
        logLLM("[Dual-Model] Error generating step summary:", error)
      }
    }

    return null
  }

  // Helper function to add a message to conversation history AND save it incrementally
  // This ensures all messages are both in memory and persisted to disk
  const addMessage = (
    role: "user" | "assistant" | "tool",
    content: string,
    toolCalls?: MCPToolCall[],
    toolResults?: MCPToolResult[],
    timestamp?: number,
    options?: { skipModelReplay?: boolean; displayContent?: string },
  ) => {
    // Add to in-memory history
    const message: typeof conversationHistory[0] = {
      role,
      content,
      toolCalls,
      toolResults,
      timestamp: timestamp || Date.now(),
      branchMessageIndex: nextBranchMessageIndex++,
      ...(options?.skipModelReplay ? { skipModelReplay: true } : {}),
      ...(options?.displayContent ? { displayContent: options.displayContent } : {}),
    }
    conversationHistory.push(message)

    // Save to disk asynchronously (fire and forget)
    saveMessageIncremental(role, content, toolCalls, toolResults).catch(err => {
      logLLM("[addMessage] Failed to save message:", err)
    })
  }

  // Helper function to add a message to the in-memory conversation history ONLY (not persisted).
  // Use for internal prompt-engineering nudges that should never appear in saved transcripts.
  const addEphemeralMessage = (
    role: "user" | "assistant" | "tool",
    content: string,
    toolCalls?: MCPToolCall[],
    toolResults?: MCPToolResult[],
    timestamp?: number
  ) => {
    const message: typeof conversationHistory[0] = {
      role,
      content,
      toolCalls,
      toolResults,
      timestamp: timestamp ?? Date.now(),
      ephemeral: true,
    }
    conversationHistory.push(message)
  }

  const hasAssistantMessageInCurrentTurn = (content: string): boolean => {
    if (!content.trim()) return false
    return conversationHistory
      .slice(currentPromptIndex + 1)
      .some((message) => message.role === "assistant" && message.content === content)
  }

  const getNextMaterializedUserResponseTimestamp = (eventTimestamp?: number): number => {
    const baseTimestamp =
      typeof eventTimestamp === "number" && Number.isFinite(eventTimestamp)
        ? Math.trunc(eventTimestamp)
        : Date.now()

    for (let index = conversationHistory.length - 1; index >= 0; index -= 1) {
      const existingTimestamp = conversationHistory[index]?.timestamp
      if (typeof existingTimestamp === "number" && Number.isFinite(existingTimestamp)) {
        return Math.max(baseTimestamp, Math.trunc(existingTimestamp) + 1)
      }
    }

    return baseTimestamp
  }

  const materializePendingUserResponses = (): string | undefined => {
    const responseEvents = getSessionRunUserResponseEvents(currentSessionId, effectiveRunId)

    for (const responseEvent of getUnmaterializedUserResponseEvents(
      responseEvents,
      materializedUserResponseEventIds,
    )) {
      const responseText = normalizeUserFacingResponseContent(responseEvent.text)

      if (responseText && !hasAssistantMessageInCurrentTurn(responseText)) {
        addMessage(
          "assistant",
          responseText,
          undefined,
          undefined,
          getNextMaterializedUserResponseTimestamp(responseEvent.timestamp),
          { skipModelReplay: true },
        )
      }

      materializedUserResponseEventIds.add(responseEvent.id)
    }

    return resolveLatestUserFacingResponse({ responseEvents })
  }

  // Track current iteration for retry progress callback
  // This is updated in the agent loop and read by onRetryProgress
  let currentIterationRef = 0

  // Create retry progress callback that emits updates to the UI
  // This callback is passed to makeLLMCall to show retry status
  // Note: This callback captures conversationHistory and formatConversationForProgress by reference,
  // so it will have access to them when called (they are defined later in this function)
  const onRetryProgress: RetryProgressCallback = (retryInfo) => {
    emit({
      currentIteration: currentIterationRef,
      maxIterations,
      steps: [], // Empty - retry info is separate from steps
      isComplete: false,
      retryInfo: retryInfo.isRetrying ? retryInfo : undefined,
      // Include conversationHistory to avoid "length: 0" logs in emitAgentProgress
      conversationHistory: typeof formatConversationForProgress === 'function' && conversationHistory
        ? formatConversationForProgress(conversationHistory)
        : [],
    })
  }

  // Initialize progress tracking
  const progressSteps: AgentProgressStep[] = []

  // Add initial step
  const initialStep = createProgressStep(
    "thinking",
    "Analyzing request",
    "Processing your request and determining next steps",
    "in_progress",
  )
  progressSteps.push(initialStep)

  // Update initial step with tool count
  initialStep.status = "completed"
  initialStep.description = `Found ${availableTools.length} available tools.`

  // Remove duplicates from available tools to prevent confusion
  const uniqueAvailableTools = availableTools.filter(
    (tool, index, self) =>
      index === self.findIndex((t) => t.name === tool.name),
  )

  const hideCompletionSignalTool = isLikelyAnswerOnlyContinuationTurn(transcript, previousConversationHistory)
  const baseAvailableTools = hideCompletionSignalTool
    ? uniqueAvailableTools.filter((tool) => tool.name !== MARK_WORK_COMPLETE_TOOL)
    : uniqueAvailableTools

  const { agentProfileService } = await import("./agent-profile-service")
  const mainAgent = agentProfileService.getCurrentProfile()

  // Use profile snapshot for session isolation if available, otherwise fall back to current profile
  // This ensures the session uses the profile settings at creation time,
  // even if the global profile is changed during session execution
  const agentModeGuidelines = effectiveProfileSnapshot?.guidelines ?? mainAgent?.guidelines ?? ""
  const customSystemPrompt = effectiveProfileSnapshot?.systemPrompt ?? mainAgent?.systemPrompt
  // Get skills instructions from profile snapshot (typically set by agents/sub-sessions)
  const agentSkillsInstructions = effectiveProfileSnapshot?.skillsInstructions
  // Get agent properties from profile snapshot (dynamic key-value pairs)
  const agentProperties = effectiveProfileSnapshot?.agentProperties

  // Load enabled agent skills instructions for the current profile
  // Skills provide specialized instructions that improve AI performance on specific tasks
  // SKIP if agentSkillsInstructions already present — the snapshot already loaded skills for this profile,
  // loading them again would duplicate the skills index section in the system prompt
  let profileSkillsInstructions: string | undefined
  if (!agentSkillsInstructions) {
    const { skillsService } = await import("./skills-service")
    const snapshotSkillsConfig = effectiveProfileSnapshot?.skillsConfig
    // When skillsConfig is undefined or allSkillsDisabledByDefault is false, all skills are enabled
    const enabledSkillIds = (!snapshotSkillsConfig || !snapshotSkillsConfig.allSkillsDisabledByDefault)
      ? skillsService.refreshFromDisk().map(s => s.id)
      : (snapshotSkillsConfig.enabledSkillIds ?? [])
    logLLM(`[processTranscriptWithAgentMode] Loading skills for session ${currentSessionId}. enabledSkillIds: [${enabledSkillIds.join(', ')}]`)
    profileSkillsInstructions = skillsService.getEnabledSkillsInstructionsForProfile(enabledSkillIds)
    logLLM(`[processTranscriptWithAgentMode] Skills instructions loaded: ${profileSkillsInstructions ? `${profileSkillsInstructions.length} chars` : 'none'}`)
  } else {
    logLLM(`[processTranscriptWithAgentMode] Using agent skills instructions from profile snapshot (${agentSkillsInstructions.length} chars), skipping duplicate load`)
  }

  // Use agent-level skills if present (from snapshot), otherwise profile-level
  const skillsInstructions = agentSkillsInstructions ?? profileSkillsInstructions
  const skillsIndex = extractSkillsIndexForMinimalPrompt(skillsInstructions)

  const workspaceAgentsFolder = resolveWorkspaceAgentsFolder()
  const workingNotes = loadWorkingKnowledgeNotesForPrompt({
    globalAgentsDir: globalAgentsFolder,
    workspaceAgentsDir: workspaceAgentsFolder,
    maxNotes: AGENT_WORKING_NOTES_LIMIT,
  })
  logLLM(`[processTranscriptWithAgentMode] Loaded ${workingNotes.length} working notes for prompt context`)

  // The agent's profile ID is used to exclude itself from delegation targets in the system prompt
  const excludeAgentId = effectiveProfileSnapshot?.profileId

  // Construct system prompt using the new approach
  const systemPrompt = constructSystemPrompt(
    baseAvailableTools,
    agentModeGuidelines,
    true,
    undefined, // relevantTools removed - let LLM decide tool relevance
    customSystemPrompt, // custom base system prompt from profile snapshot or global config
    skillsInstructions, // agent skills instructions
    agentProperties, // dynamic agent properties
    workingNotes, // injected working notes
    excludeAgentId, // exclude this agent from delegation targets
  )

  logLLM(`[llm.ts processTranscriptWithAgentMode] Initializing conversationHistory for session ${currentSessionId}`)
  logLLM(`[llm.ts processTranscriptWithAgentMode] previousConversationHistory length: ${previousConversationHistory?.length || 0}`)
  if (previousConversationHistory && previousConversationHistory.length > 0) {
    logLLM(`[llm.ts processTranscriptWithAgentMode] previousConversationHistory roles: [${previousConversationHistory.map(m => m.role).join(', ')}]`)
  }

  const sanitizedPreviousConversationHistory = (previousConversationHistory || []).filter(
    (entry) => !(entry.role === "user" && isInternalNudgeContent(entry.content))
  )

  if ((previousConversationHistory?.length || 0) !== sanitizedPreviousConversationHistory.length) {
    logLLM(
      `[llm.ts processTranscriptWithAgentMode] stripped ${
        (previousConversationHistory?.length || 0) - sanitizedPreviousConversationHistory.length
      } persisted internal nudge messages from prior history`
    )
  }

  const isInternalResumeTranscript = transcript === INTERNAL_COMPLETION_NUDGE_TEXT
  const previousBranchMessageIndex =
    sanitizedPreviousConversationHistory[sanitizedPreviousConversationHistory.length - 1]?.branchMessageIndex ?? -1
  const currentTurnUserBranchMessageIndex = isInternalResumeTranscript
    ? undefined
    : previousBranchMessageIndex + 1

  const preparedPreviousConversationHistory = (() => {
    if (!hideCompletionSignalTool || sanitizedPreviousConversationHistory.length <= 10) {
      return sanitizedPreviousConversationHistory
    }

    const tailCount = 6
    const splitIndex = Math.max(0, sanitizedPreviousConversationHistory.length - tailCount)
    const omittedHistory = sanitizedPreviousConversationHistory.slice(0, splitIndex)
    const recentHistory = sanitizedPreviousConversationHistory.slice(splitIndex)
    return [
      ...omittedHistory.map((entry) => ({ ...entry, skipModelReplay: true })),
      {
        role: "assistant" as const,
        content: buildAnswerOnlyContinuationDigest(omittedHistory),
        timestamp: Date.now(),
        ephemeral: true,
      },
      ...recentHistory,
    ]
  })()

  const conversationHistory: Array<{
    role: "user" | "assistant" | "tool"
    content: string
    toolCalls?: MCPToolCall[]
    toolResults?: MCPToolResult[]
    timestamp?: number
    branchMessageIndex?: number
    ephemeral?: boolean
    skipModelReplay?: boolean
    /** Renderer-only content override; never persisted or replayed to the model. */
    displayContent?: string
  }> = [
    ...preparedPreviousConversationHistory,
    {
      role: "user",
      content: transcript,
      timestamp: Date.now(),
      branchMessageIndex: currentTurnUserBranchMessageIndex,
      ...(isInternalResumeTranscript ? { ephemeral: true } : {}),
    },
  ]

  let nextBranchMessageIndex =
    (currentTurnUserBranchMessageIndex ?? previousBranchMessageIndex) + 1

  // Track the index where the current user prompt was added
  // This is used to scope tool result checks to only the current turn
  const currentPromptIndex = preparedPreviousConversationHistory.length

  const buildIntentOnlyToolUsageNudge = (contentText: string) => {
    const selectorRef = contentText.match(/@[a-z][0-9]+/i)?.[0]
    const baseMessage = "Your previous response only described the next step instead of actually doing it. Do NOT narrate intended actions like \"Let me...\" or \"I'll...\". Invoke the next tool call now using the structured function-calling interface."
    return selectorRef
      ? `${baseMessage} You already identified ${selectorRef}; use it in the tool call if it is the correct selector.`
      : baseMessage
  }

  const buildMissingFinalAnswerAfterCompletionNudge = () => {
    return `You called ${MARK_WORK_COMPLETE_TOOL} without first providing the final user-facing answer. Provide that answer now in normal assistant text, or use ${RESPOND_TO_USER_TOOL} only if explicit delivery semantics are needed. Call ${MARK_WORK_COMPLETE_TOOL} again only if needed. Do not add a second recap or summary unless the user explicitly asked for one.`
  }

  const extractLatestSelectorRefFromHistory = () => {
    for (let i = conversationHistory.length - 1; i >= currentPromptIndex; i--) {
      const content = typeof conversationHistory[i]?.content === "string"
        ? conversationHistory[i].content
        : ""
      const selectorRef = content.match(/@[a-z][0-9]+/i)?.[0]
      if (selectorRef) return selectorRef
    }
    return undefined
  }

  const buildGarbledToolCallNudge = () => {
    const selectorRef = extractLatestSelectorRefFromHistory()
    const baseMessage = "Your previous response contained text like \"[Calling tools: ...]\" instead of an actual tool call. Do NOT write tool call names as text. Instead, invoke tools using the structured function-calling interface."
    return selectorRef
      ? `${baseMessage} The latest successful step already identified ${selectorRef}; use it in the next tool call if it is still the correct selector. If you cannot call tools, provide your final answer directly.`
      : `${baseMessage} If you cannot call tools, provide your final answer directly.`
  }

  logLLM(`[llm.ts processTranscriptWithAgentMode] conversationHistory initialized with ${conversationHistory.length} messages, roles: [${conversationHistory.map(m => m.role).join(', ')}]`)

  // Save the initial user message incrementally
  // Only save if this is a new message (not already in previous conversation history)
  // Check if ANY user message in previousConversationHistory has the same content (not just the last one)
  // This handles retry scenarios where the user message exists but isn't the last message
  // (e.g., after a failed attempt that added assistant/tool messages)
  const userMessageAlreadyExists = sanitizedPreviousConversationHistory.some(
    msg => msg.role === "user" && msg.content === transcript
  )
  const shouldPersistInitialUserMessage = !isInternalResumeTranscript
  if (!userMessageAlreadyExists && shouldPersistInitialUserMessage) {
    saveMessageIncremental("user", transcript).catch(err => {
      logLLM("[processTranscriptWithAgentMode] Failed to save initial user message:", err)
    })
  }

  // Track empty response retries to prevent infinite loops
  let emptyResponseRetryCount = 0

  // Helper function to convert conversation history to the format expected by AgentProgressUpdate
  // - Filters out ephemeral messages (internal prompt-engineering nudges)
  // - Filters out other internal "user" nudges that we don't want to render in the progress UI
  const formatConversationForProgress = (
    history: typeof conversationHistory,
  ) => {
    return history
      .filter((entry) => !entry.ephemeral)
      .filter((entry) => !(entry.role === "user" && isInternalNudgeContent(entry.content)))
      .map((entry) => ({
        role: entry.role,
        content: entry.content,
        ...(entry.displayContent ? { displayContent: entry.displayContent } : {}),
        toolCalls: entry.toolCalls?.map((tc) => ({
          name: tc.name,
          arguments: tc.arguments,
        })),
        toolResults: entry.toolResults?.map((tr) => {
          // Safely handle content - it should be an array, but add defensive check
          const contentText = Array.isArray(tr.content)
            ? tr.content.map((c) => c.text).join("\n")
            : String(tr.content || "")

          return {
            success: !tr.isError,
            content: contentText,
            error: tr.isError ? contentText : undefined,
          }
        }),
        // Preserve original timestamp if available, otherwise use current time
        timestamp: entry.timestamp || Date.now(),
        branchMessageIndex: entry.branchMessageIndex,
      }))
  }

  const finalizeEmergencyStop = (steps: AgentProgressStep[]) => {
    finalContent = appendAgentStopNote(finalContent)

    const lastMessage = conversationHistory[conversationHistory.length - 1]
    if (
      !lastMessage ||
      lastMessage.role !== "assistant" ||
      lastMessage.content !== finalContent
    ) {
      addMessage("assistant", finalContent)
    }

    emit({
      currentIteration: iteration,
      maxIterations,
      steps,
      isComplete: true,
      finalContent,
      conversationHistory: formatConversationForProgress(conversationHistory),
    })

    wasAborted = true
  }

  interface IncompleteTaskDetails {
    missingItems?: string[]
    reason?: string
  }

  const buildIncompleteTaskFallback = (
    _lastResponse: string,
    details?: IncompleteTaskDetails
  ): string => {
    const missingItems = normalizeMissingItemsList(details?.missingItems)
    const reason = typeof details?.reason === "string" ? details.reason.trim() : ""

    if (!reason && missingItems.length === 0) {
      return "I couldn't complete the request after multiple attempts. Please try again with a narrower scope or additional guidance."
    }

    const parts: string[] = ["I couldn't complete the request after multiple attempts."]

    if (reason) {
      parts.push(`Reason: ${reason}`)
    }

    if (missingItems.length > 0) {
      const shownItems = missingItems.slice(0, 3)
      const remainingCount = missingItems.length - shownItems.length
      const summary = shownItems.join("; ")
      parts.push(
        remainingCount > 0
          ? `Missing items: ${summary}; and ${remainingCount} more.`
          : `Missing items: ${summary}.`
      )
    }

    parts.push("Please try again with a narrower scope or additional guidance.")
    return parts.join(" ")
  }

  // Helper to map conversation history to LLM messages format (filters empty content)
  const mapConversationToMessages = (
    addSummaryPrompt: boolean = false
  ): Array<{ role: "user" | "assistant"; content: string }> => {
    const mapped = conversationHistory
      .map((entry) => {
        if (entry.skipModelReplay) return null

        const rawContent = typeof entry.content === "string" ? entry.content : ""
        const content = sanitizeMessageContentForDisplay(rawContent).trim()
        if (!content) return null

        if (entry.role === "tool") {
          // Tool results already contain tool name prefix (format: [toolName] content...)
          // Just pass through without adding generic "Tool execution results:" wrapper
          return { role: "user" as const, content }
        }

        return { role: entry.role as "user" | "assistant", content }
      })
      .filter(Boolean) as Array<{ role: "user" | "assistant"; content: string }>

    // Add summary prompt if last message is from assistant (ensures LLM has something to respond to)
    if (addSummaryPrompt && mapped.length > 0 && mapped[mapped.length - 1].role === "assistant") {
      mapped.push({ role: "user", content: "Please provide a brief summary of what was accomplished." })
    }
    return mapped
  }

  // Helper to generate post-verify summary (consolidates duplicate logic)
  const generatePostVerifySummary = async (
    currentFinalContent: string,
    checkForStop: boolean = false,
    activeToolsList: MCPTool[] = uniqueAvailableTools
  ): Promise<{ content: string; stopped: boolean }> => {
    const postVerifySummaryStep = createProgressStep(
      "thinking",
      "Summarizing results",
      "Creating a concise final summary of what was achieved",
      "in_progress",
    )
    progressSteps.push(postVerifySummaryStep)
    emit({
      currentIteration: iteration,
      maxIterations,
      steps: progressSteps.slice(-3),
      isComplete: false,
      conversationHistory: formatConversationForProgress(conversationHistory),
    })

    const postVerifySystemPrompt = constructSystemPrompt(
      activeToolsList,
      agentModeGuidelines, // Use session-bound guidelines
      true,
      undefined, // relevantTools removed
      customSystemPrompt, // Use session-bound custom system prompt
      skillsInstructions, // agent skills instructions
      agentProperties, // dynamic agent properties
      workingNotes, // injected working notes
      excludeAgentId, // exclude this agent from delegation targets
    )

    const postVerifySummaryMessages = [
      { role: "system" as const, content: postVerifySystemPrompt },
      ...mapConversationToMessages(true),
    ]

    const { messages: shrunkMessages, estTokensAfter: verifyEstTokens, maxTokens: verifyMaxTokens } = await shrinkMessagesForLLM({
      messages: postVerifySummaryMessages as any,
      availableTools: activeToolsList,
      relevantTools: undefined,
      isAgentMode: true,
      skillsIndex,
      sessionId: currentSessionId,
      onSummarizationProgress: (current, total) => {
        const lastThinkingStep = progressSteps.findLast(step => step.type === "thinking")
        if (lastThinkingStep) {
          lastThinkingStep.description = `Summarizing for verification (${current}/${total})`
        }
        emit({
          currentIteration: iteration,
          maxIterations,
          steps: progressSteps.slice(-3),
          isComplete: false,
          conversationHistory: formatConversationForProgress(conversationHistory),
        })
      },
    })
    // Update context info for progress display
    contextInfoRef = { estTokens: verifyEstTokens, maxTokens: verifyMaxTokens }

    const response = await makeLLMCall(shrunkMessages, config, onRetryProgress, undefined, currentSessionId)

    // Check for stop request if needed
    if (checkForStop && agentSessionStateManager.shouldStopSession(currentSessionId)) {
      logLLM(`Agent session ${currentSessionId} stopped during post-verify summary generation`)
      return { content: currentFinalContent, stopped: true }
    }

    postVerifySummaryStep.status = "completed"
    postVerifySummaryStep.llmContent = response.content || ""
    postVerifySummaryStep.title = "Summary provided"
    postVerifySummaryStep.description = response.content && response.content.length > 100
      ? response.content.substring(0, 100) + "..."
      : response.content || "Summary generated"

    return { content: response.content || currentFinalContent, stopped: false }
  }

  // Build compact verification messages (schema-first verifier)
  const buildVerificationMessages = (finalAssistantText: string, currentVerificationFailCount: number = 0) => {
    return buildVerificationMessagesFromAgentState({
      version: 1,
      id: `session-${currentSessionId}`,
      mode: "agent_state",
      transcript,
      finalAssistantText,
      storedResponse: getSessionUserResponse(currentSessionId, effectiveRunId),
      responseEvents: getSessionRunUserResponseEvents(currentSessionId, effectiveRunId),
      verificationFailCount: currentVerificationFailCount,
      verifyContextMaxItems: config.mcpVerifyContextMaxItems || 20,
      conversationHistory: conversationHistory as any,
      sinceIndex: currentPromptIndex,
    })
  }

  // Derive loop safety budgets from the configured iteration budget so we don't
  // give up too early on recoverable tasks (e.g. tool-heavy flows that need
  // several correction nudges before converging).
  // NOTE: All of the failure counters below are tracked as *consecutive*
  // failures (they reset on any forward progress, e.g. a successful tool call
  // or a verifier "yes"). Their upper clamps therefore do not need to match a
  // typical run length — they only cap how long a single recovery streak is
  // allowed to run before we give up.
  const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))
  const effectiveIterationBudget = guardrailBudget

  // Consecutive verification failure limit - after this many failed completion
  // checks *in a row* (without any successful tool batch or verifier "yes" in
  // between), end as incomplete. Scales with iteration budget; the high upper
  // clamp keeps long deep-research runs from being killed by a verifier that
  // is correctly saying "still more work to do".
  const VERIFICATION_FAIL_LIMIT = clamp(Math.ceil(effectiveIterationBudget * 0.8), 5, 1000)

  // Max consecutive nudges before forcing an incomplete fallback. Resets on
  // any successful tool batch (see `totalNudgeCount = 0` reset paths below),
  // so this only caps "how stuck can the agent be in one segment".
  const MAX_NUDGES = clamp(Math.ceil(effectiveIterationBudget * 0.6), 3, 1000)

  // Empty response retry limit - after this many retries, break to prevent infinite loops
  const MAX_EMPTY_RESPONSE_RETRIES = 3

  /**
   * Result of running verification and handling the outcome
   */
  interface VerificationHandlerResult {
    /** Whether the loop should continue (verification failed and we should retry) */
    shouldContinue: boolean
    /** Whether verification passed. false can mean either CONTINUE (shouldContinue=true) or FORCE_INCOMPLETE (forcedByLimit=true); callers must check forcedByLimit to distinguish a real incomplete from a retry. */
    isComplete: boolean
    /** Updated verification failure count */
    newFailCount: number
    /** Whether to skip post-verify summary (reserved for caller policy) */
    skipPostVerifySummary: boolean
    /** Whether completion was forced due verification limit */
    forcedByLimit: boolean
    /** Conversation state returned by verifier or fallback */
    conversationState: AgentConversationState
    /** Optional details about missing deliverables when forced incomplete */
    incompleteDetails?: IncompleteTaskDetails
  }

  /**
   * Centralized verification state machine.
   *
   * States:
   * - COMPLETE: verifier confirms completion
   * - CONTINUE: verifier rejects completion and provides nudge
   * - FORCE_INCOMPLETE: fail budget exhausted; caller should finalize with fallback
   */
  async function runVerificationAndHandleResult(
    finalContent: string,
    verifyStep: AgentProgressStep,
    currentFailCount: number,
    options: {
      /** Whether to add tool usage nudge after 2 failures */
      nudgeForToolUsage?: boolean
      /** Index where the current user prompt was added (for scoping tool result checks) */
      currentPromptIndex?: number
    } = {}
  ): Promise<VerificationHandlerResult> {
    const {
      nudgeForToolUsage = false,
      currentPromptIndex: promptIndex,
    } = options

    const retries = Math.max(0, config.mcpVerifyRetryCount ?? 1)

    const maybeNudgeToolUsage = (newFailCount: number) => {
      if (!nudgeForToolUsage || newFailCount < 2) return

      // Scope to current turn if promptIndex is provided, otherwise check entire conversation.
      // When promptIndex is provided, only check the slice for that turn (not the session-wide flag)
      // to avoid suppressing nudges for later turns that haven't used tools yet.
      const hasToolResultsSoFar = promptIndex !== undefined
        ? conversationHistory.slice(promptIndex + 1).some((e) => e.role === "tool")
        : toolsExecutedInSession || conversationHistory.some((e) => e.role === "tool")

      if (!hasToolResultsSoFar) {
        addEphemeralMessage(
          "user",
          "Use available tools directly via native function-calling. Do not respond with intent-only updates."
        )
      }
    }

    // Run verifier with bounded retries.
    let verification: any = null
    let verified = false
    for (let i = 0; i <= retries; i++) {
      const verificationMessages = buildVerificationMessages(finalContent, currentFailCount)
      verification = normalizeVerificationResultForCompletion(await verifyCompletionWithFetch(
        verificationMessages,
        config.mcpToolsProviderId,
        currentSessionId,
      ), { verificationMessages })
      if (verification?.isComplete === true) {
        verified = true
        break
      }
    }

    const missingItems = normalizeMissingItemsList(verification?.missingItems)
    const verificationReason =
      typeof verification?.reason === "string" && verification.reason.trim().length > 0
        ? verification.reason.trim()
        : ""
    const onlyMissingInternalCompletionSignal = (() => {
      const verificationSignals = [verificationReason, ...missingItems]
        .map((value) => value.toLowerCase().trim())
        .filter((value) => value.length > 0)
      if (verificationSignals.length === 0) return false

      const completionSignalPhrases = [MARK_WORK_COMPLETE_TOOL, "completion signal"] as const
      const mentionsCompletionSignal = verificationSignals.some((signal) =>
        completionSignalPhrases.some((phrase) => signal.includes(phrase))
      )

      const stripCompletionSignalPhrases = (signal: string): string => {
        const withoutSignalTargets = completionSignalPhrases.reduce(
          (current, phrase) => current.replaceAll(phrase, " "),
          signal,
        )
        const withoutCompletionSignalBoilerplate = withoutSignalTargets
          .replace(/\b(?:was|is|were|are)\s+not\s+called\b/giu, " ")
          .replace(/\bnot\s+called\b/giu, " ")
          .replace(/\bnot\s+invoked\b/giu, " ")
          .replace(/\b(?:was|is|were|are)\s+missing\b/giu, " ")
          .replace(/\bmissing\b/giu, " ")
          .replace(/\b(?:was|is|were|are)\s+not\s+used\b/giu, " ")
          .replace(/\buse\b/giu, " ")
          .replace(/\bcall\b/giu, " ")
        return withoutCompletionSignalBoilerplate
          .replace(/[^\p{L}\p{N}]+/gu, " ")
          .trim()
      }

      const mentionsMissingWork = verificationSignals.some((signal) => {
        if (!completionSignalPhrases.some((phrase) => signal.includes(phrase))) {
          return true
        }
        return stripCompletionSignalPhrases(signal).length > 0
      })

      return mentionsCompletionSignal && !mentionsMissingWork
    })()

    const conversationState = normalizeAgentConversationState(
      verification?.conversationState,
      verified ? "complete" : "running",
    )
    const skipPostVerifySummary =
      conversationState === "needs_input" || conversationState === "blocked"

    if (verified || (onlyMissingInternalCompletionSignal && isDeliverableResponseContent(finalContent))) {
      const completionConversationState: AgentConversationState = onlyMissingInternalCompletionSignal
        ? "complete"
        : conversationState
      verifyStep.status = "completed"
      verifyStep.description = onlyMissingInternalCompletionSignal
        ? "Verification passed - only the internal completion signal was missing"
        : getVerificationOutcomeDescription(completionConversationState)
      return {
        shouldContinue: false,
        isComplete: true,
        newFailCount: 0,
        skipPostVerifySummary,
        forcedByLimit: false,
        conversationState: completionConversationState,
      }
    }

    // Verification failed; either continue with nudge or force incomplete.
    const newFailCount = currentFailCount + 1

    if (newFailCount >= VERIFICATION_FAIL_LIMIT) {
      verifyStep.status = "error"
      verifyStep.description = "Verification budget exhausted - ending as incomplete"
      return {
        shouldContinue: false,
        isComplete: false,
        newFailCount,
        skipPostVerifySummary: true,
        forcedByLimit: true,
        conversationState: "blocked",
        incompleteDetails: {
          reason: verificationReason || "Completion criteria were not met before verification retry limit.",
          missingItems,
        },
      }
    }

    verifyStep.status = "error"
    verifyStep.description = getVerificationOutcomeDescription(conversationState)
    const missing = missingItems
      .map((s: string) => `- ${s}`)
      .join("\n")
    const reason = verificationReason
      ? `Reason: ${verificationReason}`
      : "Reason: Completion criteria not met."
    const userNudge = `${reason}\n${missing ? `Missing items:\n${missing}` : ""}\nContinue only the current unresolved request described above. Do not resume older/background tasks unless they are explicitly required to satisfy these missing items.`
    addEphemeralMessage("user", userNudge)
    maybeNudgeToolUsage(newFailCount)

    return {
      shouldContinue: true,
      isComplete: false,
      newFailCount,
      skipPostVerifySummary,
      forcedByLimit: false,
      conversationState,
    }
  }

  // Emit initial progress
  emit({
    currentIteration: 0,
    maxIterations,
    steps: progressSteps.slice(-3), // Show max 3 steps
    isComplete: false,
    conversationHistory: formatConversationForProgress(conversationHistory),
  })

  let noOpCount = 0 // Track iterations without meaningful progress
  // Counts *consecutive* nudges since the last forward step. Forward steps —
  // real tool calls, successful verifications, explicit user-facing responses,
  // and completion signals — all reset this counter, so a single recovery
  // segment is what's bounded, not the lifetime of the run.
  let totalNudgeCount = 0
  let garbledToolCallCount = 0 // Track consecutive garbled tool-call-as-text responses
  // Count *consecutive* verification failures. Resets to 0 on any verifier
  // "yes" (handled inside runVerificationAndHandleResult by returning
  // newFailCount: 0) and on any successful tool batch (see the reset right
  // after `allToolsSuccessful` is computed below). This makes a long deep
  // research run with many legitimate "not done yet" verifier verdicts safe,
  // because every successful tool call breaks the failure streak.
  let verificationFailCount = 0
  // Track *consecutive* failures per tool name. The counter resets to 0 the
  // next time that specific tool succeeds, so a tool that fails twice while the
  // agent iterates on its arguments and then succeeds is fully reinstated. This
  // is critical for experiment-style flows where the agent legitimately needs
  // to retry the same tool with progressively refined inputs.
  const toolFailureCount = new Map<string, number>()
  const MAX_TOOL_FAILURES = 3 // Max consecutive failures of a tool before excluding it
  let lastExcludedToolCount = 0 // Track previous excluded count to avoid unnecessary system prompt rebuilds
  let cachedSystemPrompt: string | undefined // Cached rebuilt prompt when tools are excluded

  while (iteration < maxIterations) {
    iteration++
    currentIterationRef = iteration // Update ref for retry progress callback

    // Filter out tools that have failed too many times - compute at start of iteration
    // so the same filtered list is used consistently throughout (LLM call + heuristics)
    const activeTools = baseAvailableTools.filter((tool) => {
      const failures = toolFailureCount.get(tool.name) || 0
      return failures < MAX_TOOL_FAILURES
    })

    // Log when tools have been excluded
    const excludedToolCount = baseAvailableTools.length - activeTools.length
    if (excludedToolCount > 0 && iteration === 1) {
      // Only log on first iteration after exclusion to avoid spam
      logLLM(`ℹ️ ${excludedToolCount} tool(s) excluded due to repeated failures`)
    }

    // Rebuild system prompt only when the excluded tool count actually changes.
    // This keeps the system prompt stable across iterations for better prefix caching
    // (OpenAI, Anthropic, and Gemini all cache based on prefix matching).
    let currentSystemPrompt = systemPrompt
    if (excludedToolCount > 0) {
      if (excludedToolCount !== lastExcludedToolCount) {
        // Tool list changed — rebuild and cache the prompt
        cachedSystemPrompt = constructSystemPrompt(
          activeTools,
          agentModeGuidelines,
          true,
          undefined, // relevantTools removed - let LLM decide tool relevance
          customSystemPrompt, // custom base system prompt from profile snapshot or global config
          skillsInstructions, // agent skills instructions
          agentProperties, // dynamic agent properties
          workingNotes, // injected working notes
          excludeAgentId, // exclude this agent from delegation targets
        )
        lastExcludedToolCount = excludedToolCount
        logLLM(`[processTranscriptWithAgentMode] Rebuilt system prompt with ${activeTools.length} active tools (excluded ${excludedToolCount})`)
      }
      currentSystemPrompt = cachedSystemPrompt!
    }

    // Check for stop signal (session-specific or global)
    if (agentSessionStateManager.shouldStopSession(currentSessionId)) {
      logLLM(`Agent session ${currentSessionId} stopped by kill switch`)

      // Add emergency stop step
      const stopStep = createProgressStep(
        "completion",
        "Agent stopped",
        "Agent mode was stopped by emergency kill switch",
        "error",
      )
      progressSteps.push(stopStep)

      finalizeEmergencyStop(progressSteps.slice(-3))
      break
    }

    // Update iteration count in session state
    agentSessionStateManager.updateIterationCount(currentSessionId, iteration)

    // Update initial step to completed and add thinking step for this iteration
    if (iteration === 1) {
      initialStep.status = "completed"
    }

    const thinkingStep = createProgressStep(
      "thinking",
      `Processing request (iteration ${iteration})`,
      "Analyzing request and planning next actions",
      "in_progress",
    )
    progressSteps.push(thinkingStep)

    // Emit progress update for thinking step
    emit({
      currentIteration: iteration,
      maxIterations,
      steps: progressSteps.slice(-3),
      isComplete: false,
      conversationHistory: formatConversationForProgress(conversationHistory),
    })

    // Build messages for LLM call
    const messages = [
      { role: "system", content: currentSystemPrompt },
      ...conversationHistory
        .map((entry) => {
          if (entry.skipModelReplay) return null

          const rawContent = typeof entry.content === "string" ? entry.content : ""
          const sanitizedContent = sanitizeMessageContentForDisplay(rawContent)

          if (entry.role === "tool") {
            const text = sanitizedContent.trim()
            if (!text) return null
            // Tool results already contain tool name prefix (format: [toolName] content...)
            // Pass through directly without adding redundant wrapper
            return {
              role: "user" as const,
              content: text,
            }
          }
          // Skip empty assistant tool-call placeholders entirely when replaying history.
          // Re-injecting synthetic text like "[Calling tools: ...]" into the prompt can
          // cause the model to parrot that placeholder back as garbled tool-call text and
          // answer our internal recovery nudges instead of the user's actual request.
          if (entry.role === "assistant" && !sanitizedContent.trim()) {
            return null
          }

          // Preserve user-provided image markdown for the provider adapter; it
          // converts data/assets image URLs into multimodal message parts. The
          // sanitized variant above is still used for tool replay and emptiness checks.
          const content = rawContent
          return {
            role: entry.role as "user" | "assistant",
            content,
          }
        })
        .filter(Boolean as any),
    ]

    // Apply context budget management before the agent LLM call
    // All active tools are sent to the LLM - progressive disclosure tools
    // (list_server_tools, get_tool_schema) allow the LLM to discover tools dynamically
    const { messages: shrunkMessages, estTokensAfter, maxTokens: maxContextTokens, appliedStrategies } = await shrinkMessagesForLLM({
      messages: messages as any,
      availableTools: activeTools,
      relevantTools: undefined,
      isAgentMode: true,
      skillsIndex,
      sessionId: currentSessionId,
      onSummarizationProgress: (current, total, message) => {
        // Update thinking step with summarization progress
        thinkingStep.description = current <= 0
          ? "Updating context summary"
          : `Summarizing context (${current}/${total})`
        thinkingStep.llmContent = message
        emit({
          currentIteration: iteration,
          maxIterations,
          steps: progressSteps.slice(-3),
          isComplete: false,
          conversationHistory: formatConversationForProgress(conversationHistory),
        })
      },
    })
    // Update context info for progress display
    contextInfoRef = { estTokens: estTokensAfter, maxTokens: maxContextTokens }
    // Track last context budget for Langfuse trace metadata
    lastContextBudgetInfo = { estTokensAfter, maxTokens: maxContextTokens, appliedStrategies }

    if (thinkingStep.description?.startsWith("Summarizing context") || thinkingStep.description === "Updating context summary") {
      thinkingStep.description = appliedStrategies.length > 0
        ? "Generating response with compacted context"
        : "Generating response"
      thinkingStep.llmContent = ""
      emit({
        currentIteration: iteration,
        maxIterations,
        steps: progressSteps.slice(-3),
        isComplete: false,
        conversationHistory: formatConversationForProgress(conversationHistory),
      })
    }

    // If stop was requested during context shrinking, exit now
    if (agentSessionStateManager.shouldStopSession(currentSessionId)) {
      logLLM(`Agent session ${currentSessionId} stopped during context shrink`)
      thinkingStep.status = "completed"
      thinkingStep.title = "Agent stopped"
      thinkingStep.description = "Emergency stop triggered"
      finalizeEmergencyStop(progressSteps.slice(-3))
      break
    }

    // Make LLM call (abort-aware) with streaming for real-time UI updates
    let llmResponse: any
    try {
      // Create streaming callback that emits progress updates as content streams in
      let lastStreamEmitTime = 0
      const STREAM_EMIT_THROTTLE_MS = 50

      const onStreamingUpdate: StreamingCallback = (_chunk, accumulated) => {
        const now = Date.now()
        // Update the thinking step with streaming content (always)
        thinkingStep.llmContent = accumulated
        if (accumulated.trim()) {
          thinkingStep.title = "Agent response"
          thinkingStep.description = "Generating response..."
        }

        // Throttle emit calls to reduce log spam
        if (now - lastStreamEmitTime < STREAM_EMIT_THROTTLE_MS) {
          return // Skip emit, but content is updated
        }
        lastStreamEmitTime = now

        // Emit progress update with streaming content
        emit({
          currentIteration: iteration,
          maxIterations,
          steps: progressSteps.slice(-3),
          isComplete: false,
          conversationHistory: formatConversationForProgress(conversationHistory),
          streamingContent: {
            text: accumulated,
            isStreaming: true,
          },
        })
      }

      llmResponse = await makeLLMCall(shrunkMessages, config, onRetryProgress, onStreamingUpdate, currentSessionId, activeTools)

      // Clear streaming state after response is complete
      emit({
        currentIteration: iteration,
        maxIterations,
        steps: progressSteps.slice(-3),
        isComplete: false,
        conversationHistory: formatConversationForProgress(conversationHistory),
        streamingContent: {
          text: llmResponse?.content || "",
          isStreaming: false,
        },
      })

      // If stop was requested while the LLM call was in-flight and it returned before aborting, exit now
      if (agentSessionStateManager.shouldStopSession(currentSessionId)) {
        logLLM(`Agent session ${currentSessionId} stopped right after LLM response`)
        thinkingStep.status = "completed"
        thinkingStep.title = "Agent stopped"
        thinkingStep.description = "Emergency stop triggered"
        finalizeEmergencyStop(progressSteps.slice(-3))
        break
      }
    } catch (error: any) {
      if (error?.name === "AbortError" || agentSessionStateManager.shouldStopSession(currentSessionId)) {
        logLLM(`LLM call aborted for session ${currentSessionId} due to emergency stop`)
        thinkingStep.status = "completed"
        thinkingStep.title = "Agent stopped"
        thinkingStep.description = "Emergency stop triggered"
        finalizeEmergencyStop(progressSteps.slice(-3))
        break
      }

      // Handle empty response errors - retry with guidance
      const errorMessage = (error?.message || String(error)).toLowerCase()
      if (errorMessage.includes("empty") || errorMessage.includes("no text") || errorMessage.includes("no content")) {
        emptyResponseRetryCount++
        if (emptyResponseRetryCount >= MAX_EMPTY_RESPONSE_RETRIES) {
          logLLM(`❌ Empty response retry limit exceeded (${MAX_EMPTY_RESPONSE_RETRIES} retries)`)
          diagnosticsService.logError("llm", "Empty response retry limit exceeded", {
            iteration,
            retryCount: emptyResponseRetryCount,
            limit: MAX_EMPTY_RESPONSE_RETRIES
          })
          thinkingStep.status = "error"
          thinkingStep.description = "Empty response limit exceeded"
          const emptyResponseFinalContent = "I encountered repeated empty responses and couldn't complete the task. Please try again."
          conversationHistory.push({ role: "assistant", content: emptyResponseFinalContent, timestamp: Date.now() })
          emit({
            currentIteration: iteration,
            maxIterations,
            steps: progressSteps.slice(-3),
            isComplete: true,
            conversationState: "blocked",
            finalContent: emptyResponseFinalContent,
            conversationHistory: formatConversationForProgress(conversationHistory),
          })
          break
        }
        thinkingStep.status = "error"
        thinkingStep.description = "Empty response. Retrying..."
        emit({
          currentIteration: iteration,
          maxIterations,
          steps: progressSteps.slice(-3),
          isComplete: false,
          conversationHistory: formatConversationForProgress(conversationHistory),
        })
        addEphemeralMessage("user", "Previous request had empty response. Please retry or summarize progress.")
        continue
      }

      // Other errors - throw (llm-fetch.ts handles JSON validation/failedGeneration recovery)
      throw error
    }

    // Validate response is not null/empty.
    // A response is valid if it has either:
    // 1. Non-empty content, OR
    // 2. Valid toolCalls (tool-only responses can have empty content).

    // Defensive: don't allow JSON-fallback toolCalls to escape the tools we actually provided.
    // llm-fetch.ts can synthesize toolCalls by parsing JSON-like text output, so we must
    // validate tool calls against the current iteration's activeTools before execution.
    if (llmResponse?.toolCalls && Array.isArray((llmResponse as any).toolCalls)) {
      const { allowed, removed } = filterNamedItemsToAllowedTools(
        (llmResponse as any).toolCalls,
        activeTools,
      )
      if (removed.length > 0 && isDebugTools()) {
        logTools("Filtered agent toolCalls not present in activeTools", {
          removed: removed.map((tc) => tc.name),
        })
      }
      (llmResponse as any).toolCalls = allowed.length > 0 ? allowed : undefined
    }

    const hasValidContent = llmResponse?.content && llmResponse.content.trim().length > 0
    const hasValidToolCalls = llmResponse?.toolCalls && Array.isArray(llmResponse.toolCalls) && llmResponse.toolCalls.length > 0

    if (!llmResponse || (!hasValidContent && !hasValidToolCalls)) {
      emptyResponseRetryCount++
      logLLM(`❌ LLM null/empty response on iteration ${iteration} (retry ${emptyResponseRetryCount}/${MAX_EMPTY_RESPONSE_RETRIES})`)
      logLLM("Response details:", {
        hasResponse: !!llmResponse,
        responseType: typeof llmResponse,
        responseKeys: llmResponse ? Object.keys(llmResponse) : [],
        content: llmResponse?.content,
        contentType: typeof llmResponse?.content,
        hasToolCalls: !!llmResponse?.toolCalls,
        toolCallsCount: llmResponse?.toolCalls?.length || 0,
        fullResponse: JSON.stringify(llmResponse, null, 2)
      })
      diagnosticsService.logError("llm", "Null/empty LLM response in agent mode", {
        iteration,
        response: llmResponse,
        message: "LLM response has neither content nor toolCalls",
        retryCount: emptyResponseRetryCount,
        limit: MAX_EMPTY_RESPONSE_RETRIES
      })
      if (emptyResponseRetryCount >= MAX_EMPTY_RESPONSE_RETRIES) {
        logLLM(`❌ Empty response retry limit exceeded (${MAX_EMPTY_RESPONSE_RETRIES} retries)`)
        thinkingStep.status = "error"
        thinkingStep.description = "Empty response limit exceeded"
        const emptyResponseFinalContent = "I encountered repeated empty responses and couldn't complete the task. Please try again."
        conversationHistory.push({ role: "assistant", content: emptyResponseFinalContent, timestamp: Date.now() })
        emit({
          currentIteration: iteration,
          maxIterations,
          steps: progressSteps.slice(-3),
          isComplete: true,
          conversationState: "blocked",
          finalContent: emptyResponseFinalContent,
          conversationHistory: formatConversationForProgress(conversationHistory),
        })
        break
      }
      thinkingStep.status = "error"
      thinkingStep.description = "Invalid response. Retrying..."
      emit({
        currentIteration: iteration,
        maxIterations,
        steps: progressSteps.slice(-3),
        isComplete: false,
        conversationHistory: formatConversationForProgress(conversationHistory),
      })
      // Check if recent messages contain truncated content that might be confusing
      const recentMessages = conversationHistory.slice(-3)
      const hasTruncatedContent = recentMessages.some(m =>
        m.content?.includes('[Truncated') ||
        m.content?.includes('[truncated]') ||
        m.content?.includes('(truncated')
      )
      const retryMessage = hasTruncatedContent
        ? "Previous request had empty response. The tool output was truncated which may have caused confusion. Please either: (1) try a different approach to get the data you need, (2) work with the partial data available, or (3) summarize your progress so far."
        : "Previous request had empty response. Please retry or summarize progress."
      addEphemeralMessage("user", retryMessage)
      continue
    }

    // Reset empty response counter on successful response
    emptyResponseRetryCount = 0

    // Build a display-only reasoning block for the progress UI. Do not mutate
    // llmResponse.content: reasoning summaries are internal thinking and must
    // never be treated as deliverable/final user-facing content.
    let reasoningDisplayContent: string | undefined
    if (llmResponse.reasoningSummary) {
      // Sanitize reasoningSummary to prevent nested think tags from
      // breaking parseThinkSections()'s regex-based extraction.
      const sanitized = llmResponse.reasoningSummary
        .replace(/<\/think>/gi, "")
        .replace(/<think>/gi, "")
      const thinkBlock = `<think>\n${sanitized}\n</think>`
      reasoningDisplayContent = llmResponse.content
        ? `${thinkBlock}\n\n${llmResponse.content}`
        : thinkBlock
    }

    // Update thinking step with actual LLM content and mark as completed.
    // Strip any raw tool-marker tokens (e.g. <|tool_call_begin|>) so they
    // don't leak into the progress UI before the marker-recovery branch runs.
    const displayContent = (reasoningDisplayContent || llmResponse.content || "").replace(/<\|[^|]*\|>/g, "").trim()
    const displayOnlyMessageOptions = reasoningDisplayContent
      ? { displayContent }
      : undefined
    thinkingStep.status = "completed"
    thinkingStep.llmContent = displayContent
    if (displayContent) {
      // Update title and description to be more meaningful
      thinkingStep.title = "Agent response"
      thinkingStep.description =
        displayContent.length > 100
          ? displayContent.substring(0, 100) + "..."
          : displayContent
    }

    // Emit progress update with the LLM content immediately after setting it
    emit({
      currentIteration: iteration,
      maxIterations,
      steps: progressSteps.slice(-3),
      isComplete: false,
      conversationHistory: formatConversationForProgress(conversationHistory),
    })

    // Check for explicit completion signal
    const toolCallsArray: MCPToolCall[] = Array.isArray(
      (llmResponse as any).toolCalls,
    )
      ? (llmResponse as any).toolCalls
      : []
    if (isDebugTools()) {
      if (
        (llmResponse as any).toolCalls &&
        !Array.isArray((llmResponse as any).toolCalls)
      ) {
        logTools("Non-array toolCalls received from LLM", {
          receivedType: typeof (llmResponse as any).toolCalls,
          value: (llmResponse as any).toolCalls,
        })
      }
      logTools("Planned tool calls from LLM", toolCallsArray)
    }
    const emptyExecuteOnlyForRepeatContinuation = hideCompletionSignalTool
      && toolCallsArray.length > 0
      && toolCallsArray.every(isEmptyExecuteCommandCall)
    if (emptyExecuteOnlyForRepeatContinuation) {
      const priorAnswer = findPriorAnswerForExactRepeatContinuation(transcript, sanitizedPreviousConversationHistory)
      if (priorAnswer) {
        finalContent = priorAnswer
        addMessage("assistant", finalContent)
        emit({
          currentIteration: iteration,
          maxIterations,
          steps: progressSteps.slice(-3),
          isComplete: true,
          conversationState: "complete",
          finalContent,
          conversationHistory: formatConversationForProgress(conversationHistory),
        })
        break
      }
    }

    const completionToolCalled = toolCallsArray.some((toolCall) => toolCall.name === MARK_WORK_COMPLETE_TOOL)
    // Don't treat mark_work_complete as confirmed completion yet.
    // We defer completion until after tool execution confirms the whole batch succeeded.
    const hasToolCalls = toolCallsArray.length > 0
    let onlyCommunicationTools = false

    // Handle no-op iterations (no tool calls).
    if (!hasToolCalls) {
      noOpCount++

      const hasToolsAvailable = activeTools.length > 0
      const contentText = llmResponse.content || ""
      const trimmedContent = contentText.trim()
      const hasToolMarkers = /<\|tool_calls_section_begin\|>|<\|tool_call_begin\|>/i.test(contentText)

      if (hasToolMarkers) {
        const cleaned = contentText.replace(/<\|[^|]*\|>/g, "").trim()
        if (cleaned.length > 0) {
          addMessage("assistant", cleaned)
        }
        addMessage(
          "user",
          "Please use the native tool-calling interface to call the tools directly, rather than describing them in text.",
        )
        noOpCount = 0
        continue
      }

      // Scope tool evidence to this user prompt (current turn)
      const hasToolResultsInCurrentTurn =
        toolsExecutedInSession || conversationHistory.slice(currentPromptIndex + 1).some((e) => e.role === "tool")

      // For no-tool responses, require a bit more substance before treating as completion candidate.
      // Use a low threshold (2 chars) to avoid rejecting legitimate short answers like "Yes." or "42"
      // while still filtering truly empty/whitespace-only responses.
      const hasSubstantiveResponse = (hasToolResultsInCurrentTurn
        ? trimmedContent.length >= 1
        : trimmedContent.length >= 2)
        && isDeliverableResponseContent(contentText)

      // Unified completion candidate handling:
      // Any substantive response is either:
      // - accepted directly for no-tool/simple flows, or
      // - treated as in-progress status for tool-driven flows until explicit completion.
      if (hasSubstantiveResponse) {
        const canBypassVerification = !config.mcpVerifyCompletionEnabled || !hasToolsAvailable

        if (canBypassVerification) {
          // Even without verification, reject garbled tool-call-as-text output
          // where the model hallucinated tool call syntax as plain text content.
          // These are never valid deliverable responses — force the loop to continue.
          if (!isDeliverableResponseContent(contentText)) {
            if (trimmedContent.length > 0) {
              addMessage("assistant", contentText)
            }
            addEphemeralMessage("user", "Your previous response contained garbled tool call syntax instead of actual tool calls. Please retry the intended action using proper tool calls.")
            continue
          }
          finalContent = contentText
          addMessage("assistant", finalContent, undefined, undefined, undefined, displayOnlyMessageOptions)
          emit({
            currentIteration: iteration,
            maxIterations,
            steps: progressSteps.slice(-3),
            isComplete: true,
            conversationState: "complete",
            finalContent,
            conversationHistory: formatConversationForProgress(conversationHistory),
          })
          break
        }

        // Treat substantive plain assistant text as a legitimate completion candidate
        // even when runtime communication/completion tools are available. Older models
        // needed a completion-tool nudge here, but forcing that extra loop degrades
        // simple question/answer turns. Verification below still catches genuinely
        // incomplete work and asks the model to continue when necessary.
        finalContent = contentText
        const noToolsCalledYet = !conversationHistory.some((e) => e.role === "tool")
        let skipPostVerifySummary =
          !forceFinalSummary ||
          (noToolsCalledYet && finalContent.trim().length > 0)
        let completionForcedByVerificationLimit = false
        let completionForcedIncompleteDetails: IncompleteTaskDetails | undefined
        let finalConversationState: AgentConversationState = "complete"

        if (config.mcpVerifyCompletionEnabled) {
          const verifyStep = createProgressStep(
            "thinking",
            "Verifying completion",
            "Checking that the user's request has been achieved",
            "in_progress",
          )
          progressSteps.push(verifyStep)
          emit({
            currentIteration: iteration,
            maxIterations,
            steps: progressSteps.slice(-3),
            isComplete: false,
            conversationHistory: formatConversationForProgress(conversationHistory),
          })

          const result = await runVerificationAndHandleResult(
            finalContent,
            verifyStep,
            verificationFailCount,
            {
              nudgeForToolUsage: true,
              currentPromptIndex,
            },
          )
          verificationFailCount = result.newFailCount
          completionForcedByVerificationLimit = result.forcedByLimit
          completionForcedIncompleteDetails = result.incompleteDetails
          finalConversationState = result.conversationState
          if (result.skipPostVerifySummary) {
            skipPostVerifySummary = true
          }

          if (result.shouldContinue) {
            if (finalContent.trim().length > 0) {
              addMessage("assistant", finalContent, undefined, undefined, undefined, displayOnlyMessageOptions)
            }
            noOpCount = 0
            totalNudgeCount = 0
            garbledToolCallCount = 0
            continue
          }
        }

        // Skip post-verify summary if respond_to_user already provided a response (#1084)
        const existingUserResponse1 = resolveLatestUserFacingResponse({
          storedResponse: getSessionUserResponse(currentSessionId, effectiveRunId),
          responseEvents: getSessionRunUserResponseEvents(currentSessionId, effectiveRunId),
          conversationHistory: conversationHistory as any,
          sinceIndex: currentPromptIndex,
        })
        if (existingUserResponse1?.trim().length) {
          finalContent = existingUserResponse1
        } else if (!skipPostVerifySummary && !completionForcedByVerificationLimit) {
          try {
            const result = await generatePostVerifySummary(finalContent, false, activeTools)
            finalContent = result.content
            if (finalContent.trim().length > 0) {
              addMessage("assistant", finalContent)
            }
          } catch (e) {
            if (finalContent.trim().length > 0) {
              addMessage("assistant", finalContent)
            }
          }
        } else if (!completionForcedByVerificationLimit) {
          if (finalContent.trim().length > 0) {
            addMessage(
              "assistant",
              finalContent,
              undefined,
              undefined,
              undefined,
              finalContent === contentText ? displayOnlyMessageOptions : undefined,
            )
          }
        }

        if (completionForcedByVerificationLimit && !existingUserResponse1?.trim().length) {
          finalContent = buildIncompleteTaskFallback(finalContent, completionForcedIncompleteDetails)
          addMessage("assistant", finalContent)
        }

        const completionStep = createProgressStep(
          "completion",
          completionForcedByVerificationLimit ? "Task incomplete" : "Task completed",
          completionForcedByVerificationLimit
            ? "Verification did not confirm completion before retry limit"
            : "Successfully completed the requested task",
          completionForcedByVerificationLimit ? "error" : "completed",
        )
        progressSteps.push(completionStep)

        emit({
          currentIteration: iteration,
          maxIterations,
          steps: progressSteps.slice(-3),
          isComplete: true,
          conversationState: completionForcedByVerificationLimit ? "blocked" : finalConversationState,
          finalContent,
          conversationHistory: formatConversationForProgress(conversationHistory),
        })

        if (isSummarizationEnabled()) {
          const lastToolCalls = conversationHistory
            .filter(m => m.toolCalls && m.toolCalls.length > 0)
            .flatMap(m => m.toolCalls || [])
            .slice(-5)
          const lastToolResults = conversationHistory
            .filter(m => m.toolResults && m.toolResults.length > 0)
            .flatMap(m => m.toolResults || [])
            .slice(-5)

          try {
            const completionSummary = await generateStepSummary(
              iteration,
              lastToolCalls,
              lastToolResults,
              finalContent,
              true,
            )

            if (completionSummary) {
              emit({
                currentIteration: iteration,
                maxIterations,
                steps: progressSteps.slice(-3),
                isComplete: true,
                conversationState: completionForcedByVerificationLimit ? "blocked" : finalConversationState,
                finalContent,
                conversationHistory: formatConversationForProgress(conversationHistory),
              })
            }
          } catch (err) {
            if (isDebugLLM()) {
              logLLM("[Dual-Model] Completion summarization error:", err)
            }
          }
        }

        break
      }

      // Nudge path for no-progress responses. Allow at least one "thinking
      // only" iteration before nudging — agents doing deep research often
      // legitimately need to reflect on a tool result for one turn before
      // acting again, and firing the verifier on the very first text-only
      // iteration was punishing that workflow.
      if (config.mcpVerifyCompletionEnabled && noOpCount >= 2) {
        // Detect garbled tool-call-as-text loops: the model keeps outputting
        // "[Calling tools: ...]" as plain text instead of actual tool calls.
        // After a few consecutive garbled responses, the model is in a degraded
        // state and nudging won't help — bail out early instead of looping.
        const lastConversationMessage = conversationHistory[conversationHistory.length - 1]
        const followsSuccessfulToolResult = lastConversationMessage?.role === "tool" && !/\bERROR:\b/i.test(lastConversationMessage.content || "")
        if (followsSuccessfulToolResult) {
          totalNudgeCount = 0
        }

        const isGarbledToolCallTextResponse = isGarbledToolCallText(contentText)
        if (isGarbledToolCallTextResponse) {
          garbledToolCallCount = followsSuccessfulToolResult ? 1 : garbledToolCallCount + 1
        } else {
          garbledToolCallCount = 0
        }
        const MAX_GARBLED_TOOL_CALL_RETRIES = 3
        if (totalNudgeCount >= MAX_NUDGES || garbledToolCallCount >= MAX_GARBLED_TOOL_CALL_RETRIES) {
          finalContent = buildIncompleteTaskFallback(contentText)
          addMessage("assistant", finalContent)
          emit({
            currentIteration: iteration,
            maxIterations,
            steps: progressSteps.slice(-3),
            isComplete: true,
            finalContent,
            conversationHistory: formatConversationForProgress(conversationHistory),
          })
          break
        }

        // Only add non-garbled content to conversation history.
        // Garbled tool-call text (e.g. "[Calling tools: execute_command]") just
        // confuses the model further when it appears in prior turns. Skip it so
        // the next attempt starts from a clean state.
        if (trimmedContent.length > 0 && !isGarbledToolCallTextResponse) {
          addMessage("assistant", contentText, undefined, undefined, undefined, displayOnlyMessageOptions)
        }

        const isIntentOnlyProgressText = isProgressUpdateResponse(contentText)

        const nudgeMessage = isGarbledToolCallTextResponse
          ? buildGarbledToolCallNudge()
          : isIntentOnlyProgressText && hasToolsAvailable
            ? buildIntentOnlyToolUsageNudge(contentText)
          : hasToolsAvailable
            ? "Use available tools directly via native function-calling, or provide a complete final answer."
            : "Provide a complete final answer."
        addEphemeralMessage("user", nudgeMessage)

        noOpCount = 0
        totalNudgeCount++
        continue
      }

      // With verification disabled and no substantive completion candidate, exit as incomplete.
      if (!config.mcpVerifyCompletionEnabled) {
        finalContent = buildIncompleteTaskFallback(contentText)
        addMessage("assistant", finalContent)
        emit({
          currentIteration: iteration,
          maxIterations,
          steps: progressSteps.slice(-3),
          isComplete: true,
          conversationState: "blocked",
          finalContent,
          conversationHistory: formatConversationForProgress(conversationHistory),
        })
        break
      }
    } else {
      // Check if the only tools called are communication-only (respond_to_user).
      // These don't represent real work progress — they're just the agent talking to the user.
      // If respond_to_user is called without mark_work_complete, don't reset the completion
      // counters; otherwise the agent can loop indefinitely: text → nudge → respond_to_user
      // (resets counters) → text → nudge → respond_to_user → … (#respond-to-user-spam)
      const COMMUNICATION_ONLY_TOOLS = new Set([RESPOND_TO_USER_TOOL])
      onlyCommunicationTools = toolCallsArray.every(tc => COMMUNICATION_ONLY_TOOLS.has(tc.name))

      if (onlyCommunicationTools) {
        // Communication-only batches are explicit user-facing updates, not proof of
        // task completion. Keep the no-op counters moving so the runtime can nudge
        // the model to either continue working or explicitly mark the task complete.
        noOpCount++
      } else {
        // Real work tools: full counter reset
        noOpCount = 0
        // Reset nudge count when tools are actually being used - this allows
        // nudging to work per "stuck segment" rather than globally across the run.
        // If the agent gets stuck again later, it should have a fresh nudge budget.
        totalNudgeCount = 0
      }
    }

    // Execute tool calls with enhanced error handling
    const toolResults: MCPToolResult[] = []
    const failedTools: string[] = []

    // Add assistant response with tool calls to conversation history BEFORE executing tools
    // This ensures the tool call request is visible immediately in the UI
    addMessage("assistant", llmResponse.content || "", llmResponse.toolCalls || [], undefined, undefined, displayOnlyMessageOptions)

    // Emit progress update to show tool calls immediately
    emit({
      currentIteration: iteration,
      maxIterations,
      steps: progressSteps.slice(-3),
      isComplete: false,
      conversationHistory: formatConversationForProgress(conversationHistory),
    })

    // Apply intelligent tool result processing to all queries to prevent context overflow

    // Check for stop signal before starting tool execution
    if (agentSessionStateManager.shouldStopSession(currentSessionId)) {
      logLLM(`Agent session ${currentSessionId} stopped before tool execution`)
      finalizeEmergencyStop(progressSteps.slice(-3))
      break
    }

    // Determine execution mode: parallel or sequential
    // Sequential execution is used when config mcpParallelToolExecution is set to false
    // Default is parallel execution when multiple tools are called
    const forceSequential = config.mcpParallelToolExecution === false
    const useParallelExecution = !forceSequential && toolCallsArray.length > 1

    if (useParallelExecution) {
      // PARALLEL EXECUTION: Execute all tool calls concurrently
      if (isDebugTools()) {
        logTools(`Executing ${toolCallsArray.length} tool calls in parallel`, toolCallsArray.map(t => t.name))
      }

      // Create progress steps for all tools upfront
      // Use array index as key to avoid collisions when same tool is called with identical args
      const toolCallSteps: AgentProgressStep[] = []
      for (const toolCall of toolCallsArray) {
        const toolCallStep = createProgressStep(
          "tool_call",
          `Executing ${toolCall.name}`,
          `Running tool with arguments: ${JSON.stringify(toolCall.arguments)}`,
          "in_progress",
        )
        toolCallStep.toolCall = {
          name: toolCall.name,
          arguments: toolCall.arguments,
        }
        progressSteps.push(toolCallStep)
        toolCallSteps.push(toolCallStep)
      }

      // Emit progress showing all tools starting in parallel
      emit({
        currentIteration: iteration,
        maxIterations,
        steps: progressSteps.slice(-Math.min(toolCallsArray.length * 2, 6)),
        isComplete: false,
        conversationHistory: formatConversationForProgress(conversationHistory),
      })

      // Execute all tools in parallel
      const executionPromises = toolCallsArray.map(async (toolCall, index) => {
        const toolCallStep = toolCallSteps[index]

        const onToolProgress = (message: string) => {
          toolCallStep.description = message
          emit({
            currentIteration: iteration,
            maxIterations,
            steps: progressSteps.slice(-Math.min(toolCallsArray.length * 2, 6)),
            isComplete: false,
            conversationHistory: formatConversationForProgress(conversationHistory),
          })
        }

        const execResult = await executeToolWithRetries(
          toolCall,
          executeToolCall,
          currentSessionId,
          onToolProgress,
          2, // maxRetries
        )

        // Update the progress step with the result
        toolCallStep.status = execResult.result.isError ? "error" : "completed"
        toolCallStep.toolResult = {
          success: !execResult.result.isError,
          content: execResult.result.content.map((c) => c.text).join("\n"),
          error: execResult.result.isError
            ? execResult.result.content.map((c) => c.text).join("\n")
            : undefined,
        }

        // Add tool result step
        const toolResultStep = createProgressStep(
          "tool_result",
          `${toolCall.name} ${execResult.result.isError ? "failed" : "completed"}`,
          execResult.result.isError
            ? `Tool execution failed${execResult.retryCount > 0 ? ` after ${execResult.retryCount} retries` : ""}`
            : "Tool executed successfully",
          execResult.result.isError ? "error" : "completed",
        )
        toolResultStep.toolResult = toolCallStep.toolResult
        progressSteps.push(toolResultStep)

        return execResult
      })

      // Wait for all tools to complete
      const executionResults = await Promise.all(executionPromises)

      // Check if any tool was cancelled by kill switch
      const anyCancelled = executionResults.some(r => r.cancelledByKill)
      if (anyCancelled) {
        finalizeEmergencyStop(progressSteps.slice(-Math.min(toolCallsArray.length * 2, 6)))
        break
      }

      // Collect results in order
      for (const execResult of executionResults) {
        toolResults.push(execResult.result)
        toolsExecutedInSession = true
        garbledToolCallCount = 0 // Reset on successful tool execution
        if (execResult.result.isError) {
          failedTools.push(execResult.toolCall.name)
        } else {
          // Reset the consecutive-failure counter for this specific tool on
          // success so the agent gets a fresh budget after recovering.
          toolFailureCount.delete(execResult.toolCall.name)
        }
      }

      // Emit final progress for parallel execution
      emit({
        currentIteration: iteration,
        maxIterations,
        steps: progressSteps.slice(-Math.min(toolCallsArray.length * 2, 6)),
        isComplete: false,
        conversationHistory: formatConversationForProgress(conversationHistory),
      })
    } else {
      // SEQUENTIAL EXECUTION: Execute tool calls one at a time
      if (isDebugTools()) {
        const reason = toolCallsArray.length <= 1
          ? "Single tool call"
          : "Config disabled parallel execution"
        logTools(`Executing ${toolCallsArray.length} tool calls sequentially - ${reason}`, toolCallsArray.map(t => t.name))
      }
      for (const [, toolCall] of toolCallsArray.entries()) {
        if (isDebugTools()) {
          logTools("Executing planned tool call", toolCall)
        }
        // Check for stop signal before executing each tool
        if (agentSessionStateManager.shouldStopSession(currentSessionId)) {
          logLLM(`Agent session ${currentSessionId} stopped during tool execution`)
          finalizeEmergencyStop(progressSteps.slice(-3))
          break
        }

        // Add tool call step
        const toolCallStep = createProgressStep(
          "tool_call",
          `Executing ${toolCall.name}`,
          `Running tool with arguments: ${JSON.stringify(toolCall.arguments)}`,
          "in_progress",
        )
        toolCallStep.toolCall = {
          name: toolCall.name,
          arguments: toolCall.arguments,
        }
        progressSteps.push(toolCallStep)

        // Emit progress update
        emit({
          currentIteration: iteration,
          maxIterations,
          steps: progressSteps.slice(-3),
          isComplete: false,
          conversationHistory: formatConversationForProgress(conversationHistory),
        })

        // Create progress callback to update tool execution step
        const onToolProgress = (message: string) => {
          toolCallStep.description = message
          emit({
            currentIteration: iteration,
            maxIterations,
            steps: progressSteps.slice(-3),
            isComplete: false,
            conversationHistory: formatConversationForProgress(conversationHistory),
          })
        }

        const execResult = await executeToolWithRetries(
          toolCall,
          executeToolCall,
          currentSessionId,
          onToolProgress,
          2, // maxRetries
        )

        if (execResult.cancelledByKill) {
          // Mark step and emit final progress, then break out of tool loop
          toolCallStep.status = "error"
          toolCallStep.toolResult = {
            success: false,
            content: "Tool execution cancelled by emergency kill switch",
            error: "Cancelled by emergency kill switch",
          }
          const toolResultStep = createProgressStep(
            "tool_result",
            `${toolCall.name} cancelled`,
            "Tool execution cancelled by emergency kill switch",
            "error",
          )
          toolResultStep.toolResult = toolCallStep.toolResult
          progressSteps.push(toolResultStep)
          finalizeEmergencyStop(progressSteps.slice(-3))
          break
        }

        toolResults.push(execResult.result)
        toolsExecutedInSession = true

        // Track failed tools for better error reporting
        if (execResult.result.isError) {
          failedTools.push(toolCall.name)
        }

        // Update tool call step with result
        toolCallStep.status = execResult.result.isError ? "error" : "completed"
        toolCallStep.toolResult = {
          success: !execResult.result.isError,
          content: execResult.result.content.map((c) => c.text).join("\n"),
          error: execResult.result.isError
            ? execResult.result.content.map((c) => c.text).join("\n")
            : undefined,
        }

        // Add tool result step with enhanced error information
        const toolResultStep = createProgressStep(
          "tool_result",
          `${toolCall.name} ${execResult.result.isError ? "failed" : "completed"}`,
          execResult.result.isError
            ? `Tool execution failed${execResult.retryCount > 0 ? ` after ${execResult.retryCount} retries` : ""}`
            : "Tool executed successfully",
          execResult.result.isError ? "error" : "completed",
        )
        toolResultStep.toolResult = toolCallStep.toolResult
        progressSteps.push(toolResultStep)

        // Emit progress update
        emit({
          currentIteration: iteration,
          maxIterations,
          steps: progressSteps.slice(-3),
          isComplete: false,
          conversationHistory: formatConversationForProgress(conversationHistory),
        })
      }
    }

    // If stop was requested during tool execution, exit the agent loop now
    if (agentSessionStateManager.shouldStopSession(currentSessionId)) {
      finalizeEmergencyStop(progressSteps.slice(-3))
      break
    }


    // Note: Assistant response with tool calls was already added before tool execution
    // This ensures the tool call request is visible immediately in the UI

    // Keep tool results intact for full visibility in UI
    // The UI will handle display and truncation as needed
    const processedToolResults = toolResults
    let latestMaterializedUserResponse: string | undefined

    // Always add a tool message if any tools were executed, even if results are empty
    // This ensures the verifier sees tool execution evidence in conversationHistory
    if (processedToolResults.length > 0) {
      // For each result, use "[No output]" if the content is empty and not an error
      const resultsWithPlaceholders = processedToolResults.map((result) => {
        const contentText = result.content?.map((c) => c.text).join("").trim() || ""
        if (!result.isError && contentText.length === 0) {
          return {
            ...result,
            content: [{ type: "text" as const, text: "[No output]" }],
          }
        }
        return result
      })

      // Format tool results with tool name prefix for better context preservation
      // Format: [toolName] content... or [toolName] ERROR: content...
      const toolResultsText = resultsWithPlaceholders
        .map((result, i) => {
          const toolName = toolCallsArray[i]?.name || 'unknown'
          const content = result.content.map((c) => c.text).join("\n")
          const prefix = result.isError ? `[${toolName}] ERROR: ` : `[${toolName}] `
          return `${prefix}${content}`
        })
        .join("\n\n")

      addMessage("tool", toolResultsText, undefined, resultsWithPlaceholders)
    }

    latestMaterializedUserResponse = materializePendingUserResponses()

    if (processedToolResults.length > 0 || latestMaterializedUserResponse) {
      // Emit progress update after tool evidence and any materialized respond_to_user
      // content have both been appended, preserving sequential transcript order.
      emit({
        currentIteration: iteration,
        maxIterations,
        steps: progressSteps.slice(-3),
        isComplete: false,
        conversationHistory: formatConversationForProgress(conversationHistory),
      })
    }

    // Generate step summary after tool execution (if dual-model enabled)
    // Fire-and-forget: summaries are for UI display, not needed for agent's next decision
    generateStepSummary(
      iteration,
      toolCallsArray,
      toolResults,
      llmResponse.content || undefined,
    ).catch(err => {
      if (isDebugLLM()) {
        logLLM("[Dual-Model] Background summarization error:", err)
      }
    })

    // Enhanced completion detection with better error handling
    const hasErrors = toolResults.some((result) => result.isError)
    const allToolsSuccessful = toolResults.length > 0 && !hasErrors

    // A successful real-work tool batch is forward progress, so it breaks any
    // verifier-failure streak. Communication-only tools such as respond_to_user
    // are intentionally excluded; otherwise a model that repeatedly talks but
    // never calls mark_work_complete can reset the verifier budget forever.
    if (allToolsSuccessful && !onlyCommunicationTools) {
      verificationFailCount = 0
    }

    // Deferred completion signal: only treat mark_work_complete as a completion signal
    // after all tools in the batch have executed successfully. If any tool (including
    // mark_work_complete itself) returned an error, keep iterating so the agent can recover.
    const completionSignalConfirmed = completionToolCalled && allToolsSuccessful

    if (hasErrors) {
      const hasInvalidExecuteCommandSkillIdError = toolResults.some((result, index) =>
        isInvalidExecuteCommandSkillIdFailure(toolCallsArray[index]?.name, result)
      )
      if (hasInvalidExecuteCommandSkillIdError) {
        addEphemeralMessage(
          "user",
          "For execute_command, omit skillId unless you are using an exact skill id from Available Skills. Do not use repo names, file paths, URLs, or GitHub slugs as skillId. Retry the same command without skillId unless you explicitly need a skill directory."
        )
      }

      // Track per-tool failures
      for (let i = 0; i < toolResults.length; i++) {
        const result = toolResults[i]
        if (result.isError) {
          // Get the tool name from toolCallsArray by index
          const toolName = toolCallsArray[i]?.name || "unknown"
          const currentCount = toolFailureCount.get(toolName) || 0
          toolFailureCount.set(toolName, currentCount + 1)

          if (currentCount + 1 >= MAX_TOOL_FAILURES) {
            logLLM(`⚠️ Tool "${toolName}" has failed ${MAX_TOOL_FAILURES} times - will be excluded`)
          }
        }
      }

      // Add clean error summary to conversation history for LLM context
      const errorSummary = failedTools
        .map((toolName, idx) => {
          const failedResult = toolResults.filter((r) => r.isError)[idx]
          const rawError = failedResult?.content.map((c) => c.text).join(" ") || "Unknown error"
          const cleanedError = cleanErrorMessage(rawError)
          const failureCount = toolFailureCount.get(toolName) || 1
          return `TOOL FAILED: ${toolName} (attempt ${failureCount}/${MAX_TOOL_FAILURES})\nError: ${cleanedError}`
        })
        .join("\n\n")

      conversationHistory.push({
        role: "tool",
        content: errorSummary,
        timestamp: Date.now(),
      })
    }

    if (onlyCommunicationTools && !completionSignalConfirmed) {
      const latestCommunicationOnlyResponse = latestMaterializedUserResponse ?? resolveLatestUserFacingResponse({
        storedResponse: getSessionUserResponse(currentSessionId, effectiveRunId),
        responseEvents: getSessionRunUserResponseEvents(currentSessionId, effectiveRunId),
      })

      const hasCommunicationOnlyResponse = !!latestCommunicationOnlyResponse?.trim().length
      const shouldVerifyCommunicationOnlyResponse =
        config.mcpVerifyCompletionEnabled
        && hasCommunicationOnlyResponse

      if (shouldVerifyCommunicationOnlyResponse) {
        finalContent = latestCommunicationOnlyResponse
        let completionForcedByVerificationLimit = false
        let finalConversationState: AgentConversationState = "complete"

        const verifyStep = createProgressStep(
          "thinking",
          "Verifying completion",
          "Checking whether the latest user-facing response legitimately completes the request",
          "in_progress",
        )
        progressSteps.push(verifyStep)
        emit({
          currentIteration: iteration,
          maxIterations,
          steps: progressSteps.slice(-3),
          isComplete: false,
          conversationHistory: formatConversationForProgress(conversationHistory),
        })

        const result = await runVerificationAndHandleResult(
          finalContent,
          verifyStep,
          verificationFailCount,
          {
            nudgeForToolUsage: true,
            currentPromptIndex,
          },
        )
        verificationFailCount = result.newFailCount
        completionForcedByVerificationLimit = result.forcedByLimit
        finalConversationState = result.conversationState

        if (result.shouldContinue) {
          noOpCount = 0
          totalNudgeCount = 0
          garbledToolCallCount = 0
          continue
        }

        const completionStep = createProgressStep(
          "completion",
          completionForcedByVerificationLimit ? "Task incomplete" : "Task completed",
          completionForcedByVerificationLimit
            ? "Verification did not confirm completion before retry limit"
            : "Successfully completed the requested task",
          completionForcedByVerificationLimit ? "error" : "completed",
        )
        progressSteps.push(completionStep)

        emit({
          currentIteration: iteration,
          maxIterations,
          steps: progressSteps.slice(-3),
          isComplete: true,
          conversationState: completionForcedByVerificationLimit ? "blocked" : finalConversationState,
          finalContent,
          conversationHistory: formatConversationForProgress(conversationHistory),
        })
        break
      }

      if (
        noOpCount >= 2
        && hasCommunicationOnlyResponse
        && !config.mcpVerifyCompletionEnabled
      ) {
        finalContent = latestCommunicationOnlyResponse
        const completionStep = createProgressStep(
          "completion",
          "Task completed",
          "Completed with the latest user-facing response",
          "completed",
        )
        progressSteps.push(completionStep)

        emit({
          currentIteration: iteration,
          maxIterations,
          steps: progressSteps.slice(-3),
          isComplete: true,
          conversationState: "complete",
          finalContent,
          conversationHistory: formatConversationForProgress(conversationHistory),
        })
        break
      }

      if (noOpCount >= 2) {
        addEphemeralMessage("user", INTERNAL_COMPLETION_NUDGE_TEXT)
      }
      continue
    }

    // Check if agent indicated completion after executing tools.
    if (completionSignalConfirmed) {
      // Agent indicated completion. Prefer the explicit user-facing answer or the
      // existing assistant text. Only generate a separate summary when explicitly enabled.
      const lastAssistantContent = llmResponse.content || ""

      // Check if the last assistant message was primarily tool calls without much explanation
      const hasToolCalls = llmResponse.toolCalls && llmResponse.toolCalls.length > 0
      const hasMinimalContent = lastAssistantContent.trim().length < 50

      // Prefer the existing explicit user-facing response when present (#1084)
      const existingUserResponse = latestMaterializedUserResponse ?? resolveLatestUserFacingResponse({
        storedResponse: getSessionUserResponse(currentSessionId, effectiveRunId),
        responseEvents: getSessionRunUserResponseEvents(currentSessionId, effectiveRunId),
        conversationHistory: conversationHistory as any,
        sinceIndex: currentPromptIndex,
      })
      let generatedForcedCompletionSummary = false
      let respondToUserAlreadyInHistory = false
      if (existingUserResponse?.trim().length) {
        finalContent = existingUserResponse
        respondToUserAlreadyInHistory = hasAssistantMessageInCurrentTurn(finalContent)
        if (!respondToUserAlreadyInHistory) {
          addMessage("assistant", finalContent)
          respondToUserAlreadyInHistory = true
        }
      } else if (forceFinalSummary && hasToolCalls && (hasMinimalContent || !lastAssistantContent.trim())) {
        // The agent completed work without a user-facing answer. Only ask for a separate
        // completion recap when final-summary mode is explicitly enabled.
        const summaryPrompt = "Please provide a concise summary of what you just accomplished with the tool calls. Focus on the key results and outcomes for the user."

        conversationHistory.push({
          role: "user",
          content: summaryPrompt,
          timestamp: Date.now(),
        })

        // Create a summary request step
        const summaryStep = createProgressStep(
          "thinking",
          "Generating summary",
          "Requesting final summary of completed actions",
          "in_progress",
        )
        progressSteps.push(summaryStep)

        // Emit progress update for summary request
        emit({
          currentIteration: iteration,
          maxIterations,
          steps: progressSteps.slice(-3),
          isComplete: false,
          conversationHistory: formatConversationForProgress(conversationHistory),
        })

        // Get the summary from the agent
        const contextAwarePrompt = constructSystemPrompt(
          uniqueAvailableTools,
          agentModeGuidelines, // Use session-bound guidelines
          true, // isAgentMode
          undefined, // relevantTools
          customSystemPrompt, // Use session-bound custom system prompt
          skillsInstructions, // agent skills instructions
          agentProperties, // dynamic agent properties
          workingNotes, // injected working notes
          excludeAgentId, // exclude this agent from delegation targets
        )

        const summaryMessages = [
          { role: "system" as const, content: contextAwarePrompt },
          ...mapConversationToMessages(),
        ]

        const { messages: shrunkSummaryMessages, estTokensAfter: summaryEstTokens, maxTokens: summaryMaxTokens } = await shrinkMessagesForLLM({
          messages: summaryMessages as any,
          availableTools: uniqueAvailableTools,
          relevantTools: undefined,
          isAgentMode: true,
          skillsIndex,
          sessionId: currentSessionId,
          onSummarizationProgress: (current, total) => {
            summaryStep.description = `Summarizing for summary generation (${current}/${total})`
            emit({
              currentIteration: iteration,
              maxIterations,
              steps: progressSteps.slice(-3),
              isComplete: false,
              conversationHistory: formatConversationForProgress(conversationHistory),
            })
          },
        })
        // Update context info for progress display
        contextInfoRef = { estTokens: summaryEstTokens, maxTokens: summaryMaxTokens }


        try {
          const summaryResponse = await makeLLMCall(shrunkSummaryMessages, config, onRetryProgress, undefined, currentSessionId)

          // Check if stop was requested during summary generation
          if (agentSessionStateManager.shouldStopSession(currentSessionId)) {
            logLLM(`Agent session ${currentSessionId} stopped during summary generation`)
            finalizeEmergencyStop(progressSteps.slice(-3))
            break
          }

          // Update summary step with the response
          summaryStep.status = "completed"
          summaryStep.llmContent = summaryResponse.content || ""
          summaryStep.title = "Summary provided"
          summaryStep.description = summaryResponse.content && summaryResponse.content.length > 100
            ? summaryResponse.content.substring(0, 100) + "..."
            : summaryResponse.content || "Summary generated"

          // Use the summary as final content
          finalContent = summaryResponse.content || lastAssistantContent
          generatedForcedCompletionSummary = true

          // Add the summary to conversation history
          conversationHistory.push({
            role: "assistant",
            content: finalContent,
            timestamp: Date.now(),
          })
        } catch (error) {
          // If summary generation fails, fall back to the original content
          logLLM("Failed to generate summary:", error)
          finalContent = lastAssistantContent || "Task completed successfully."
          generatedForcedCompletionSummary = true
          summaryStep.status = "error"
          summaryStep.description = "Failed to generate summary, using fallback"

          conversationHistory.push({
            role: "assistant",
            content: finalContent,
            timestamp: Date.now(),
          })
        }
      } else {
        // Agent provided sufficient content, use it as the final content directly.
        finalContent = lastAssistantContent
      }

      if (!finalContent.trim() && !existingUserResponse?.trim().length && !forceFinalSummary) {
        const completionSummary = toolCallsArray
          .map((toolCall) => toolCall.name === MARK_WORK_COMPLETE_TOOL && typeof (toolCall.arguments as any)?.summary === "string"
            ? (toolCall.arguments as any).summary.trim()
            : "")
          .find((summary) => summary.length > 0)
        if (completionSummary && isDeliverableResponseContent(completionSummary)) {
          finalContent = completionSummary
        }
      }

      if (!existingUserResponse?.trim().length && !forceFinalSummary && !finalContent.trim().length) {
        addEphemeralMessage("user", buildMissingFinalAnswerAfterCompletionNudge())
        noOpCount = 0
        totalNudgeCount = 0
        garbledToolCallCount = 0
        continue
      }


	      // Optional verification before completing after tools
	      // Track if we should skip post-verify summary (when agent is repeating itself or disabled)
		      let skipPostVerifySummary2 = !forceFinalSummary || generatedForcedCompletionSummary
	      let completionForcedByVerificationLimit2 = false
	      let completionForcedIncompleteDetails2: IncompleteTaskDetails | undefined
		      let finalConversationState2: AgentConversationState = "complete"

	      if (config.mcpVerifyCompletionEnabled) {
	        const verifyStep = createProgressStep(
	          "thinking",
	          "Verifying completion",
	          "Checking that the user's request has been achieved",
	          "in_progress",
	        )
	        progressSteps.push(verifyStep)
	        emit({
	          currentIteration: iteration,
	          maxIterations,
	          steps: progressSteps.slice(-3),
	          isComplete: false,
	          conversationHistory: formatConversationForProgress(conversationHistory),
	        })

	        const result = await runVerificationAndHandleResult(
	          finalContent,
	          verifyStep,
	          verificationFailCount
	        )
	        verificationFailCount = result.newFailCount
	        completionForcedByVerificationLimit2 = result.forcedByLimit
	        completionForcedIncompleteDetails2 = result.incompleteDetails
		        finalConversationState2 = result.conversationState
	        if (result.skipPostVerifySummary) {
	          skipPostVerifySummary2 = true
	        }

	        // Check if stop was requested during verification
	        if (agentSessionStateManager.shouldStopSession(currentSessionId)) {
	          logLLM(`Agent session ${currentSessionId} stopped during verification`)
	          finalizeEmergencyStop(progressSteps.slice(-3))
	          break
	        }

	        if (result.shouldContinue) {
		          noOpCount = 0
		          totalNudgeCount = 0
		          garbledToolCallCount = 0
	          continue
	        }
	      }

	        // Post-verify: only produce an extra final summary when explicitly enabled
        // Skip when forced incomplete - the fallback message below will be the only assistant message
        // Skip summary generation if respond_to_user already provided a response (#1084)
        // Also skip if respond_to_user response was already added to history above
        const existingUserResponse2 = latestMaterializedUserResponse ?? resolveLatestUserFacingResponse({
          storedResponse: getSessionUserResponse(currentSessionId, effectiveRunId),
          responseEvents: getSessionRunUserResponseEvents(currentSessionId, effectiveRunId),
          conversationHistory: conversationHistory as any,
          sinceIndex: currentPromptIndex,
        })
        if (existingUserResponse2?.trim().length) {
          finalContent = existingUserResponse2
          respondToUserAlreadyInHistory = respondToUserAlreadyInHistory || hasAssistantMessageInCurrentTurn(finalContent)
          if (!respondToUserAlreadyInHistory && finalContent.trim().length > 0) {
            addMessage("assistant", finalContent)
            respondToUserAlreadyInHistory = true
          }
        } else if (respondToUserAlreadyInHistory) {
          // Already handled above — skip post-verify summary entirely
        } else if (!skipPostVerifySummary2 && !completionForcedByVerificationLimit2) {
          try {
            const result = await generatePostVerifySummary(finalContent, true, activeTools)
            if (result.stopped) {
              finalizeEmergencyStop(progressSteps.slice(-3))
              break
            }
            finalContent = result.content
            if (finalContent.trim().length > 0) {
              conversationHistory.push({ role: "assistant", content: finalContent, timestamp: Date.now() })
            }
          } catch (e) {
            // If summary generation fails, still add the existing finalContent to history
            // so the mobile client has the complete conversation
            if (finalContent.trim().length > 0) {
              conversationHistory.push({ role: "assistant", content: finalContent, timestamp: Date.now() })
            }
          }
	        } else if (!completionForcedByVerificationLimit2) {
	          // Even when skipping post-verify summary, ensure the final content is in history
	          // This prevents intermediate messages from disappearing on mobile
	          if (finalContent.trim().length > 0) {
	            conversationHistory.push({ role: "assistant", content: finalContent, timestamp: Date.now() })
	          }
	        }

	      if (completionForcedByVerificationLimit2 && !respondToUserAlreadyInHistory && !existingUserResponse2?.trim().length) {
	        finalContent = buildIncompleteTaskFallback(finalContent, completionForcedIncompleteDetails2)
	        conversationHistory.push({ role: "assistant", content: finalContent, timestamp: Date.now() })
	      }


	      // Add completion step
	      const completionStep = createProgressStep(
	        "completion",
	        completionForcedByVerificationLimit2 ? "Task incomplete" : "Task completed",
	        completionForcedByVerificationLimit2
	          ? "Verification did not confirm completion before retry limit"
		          : "Successfully completed the requested task",
	        completionForcedByVerificationLimit2 ? "error" : "completed",
	      )
      progressSteps.push(completionStep)

      // Emit final progress
      emit({
        currentIteration: iteration,
        maxIterations,
        steps: progressSteps.slice(-3),
        isComplete: true,
	        conversationState: completionForcedByVerificationLimit2 ? "blocked" : finalConversationState2,
        finalContent,
        conversationHistory: formatConversationForProgress(conversationHistory),
      })

      break
    }

    // Set final content to the latest assistant response (fallback)
    if (!finalContent) {
      finalContent = llmResponse.content || ""
    }
  }

  if (iteration >= maxIterations) {
    // Handle maximum iterations reached - always ensure we have a meaningful summary
    const hasRecentErrors = progressSteps
      .slice(-5)
      .some((step) => step.status === "error")

    const iterationLimitResolution = resolveIterationLimitFinalContent({
      finalContent,
      storedResponse: getSessionUserResponse(currentSessionId, effectiveRunId),
      responseEvents: getSessionRunUserResponseEvents(currentSessionId, effectiveRunId),
      conversationHistory: conversationHistory as any,
      sinceIndex: currentPromptIndex,
      hasRecentErrors,
    })
    finalContent = iterationLimitResolution.content

    // Add context about the termination reason
    const terminationNote = hasRecentErrors
      ? "\n\n(Note: Task incomplete due to repeated tool failures. Please try again or use alternative methods.)"
      : "\n\n(Note: Task may not be fully complete - reached maximum iteration limit. The agent was still working on the request.)"

    if (!iterationLimitResolution.usedExplicitUserResponse) {
      finalContent += terminationNote
    }

    // Make sure the final message is added to conversation history
    const lastMessage = conversationHistory[conversationHistory.length - 1]
    if (
      !lastMessage ||
      lastMessage.role !== "assistant" ||
      lastMessage.content !== finalContent
    ) {
      conversationHistory.push({
        role: "assistant",
        content: finalContent,
        timestamp: Date.now(),
      })
    }

    // Add timeout completion step with better context
    const timeoutStep = createProgressStep(
      "completion",
      "Maximum iterations reached",
      hasRecentErrors
        ? "Task stopped due to repeated tool failures"
        : "Task stopped due to iteration limit",
      "error",
    )
    progressSteps.push(timeoutStep)

    // Emit final progress
    emit({
      currentIteration: iteration,
      maxIterations,
      steps: progressSteps.slice(-3),
      isComplete: true,
      conversationState: "blocked",
      finalContent,
      conversationHistory: formatConversationForProgress(conversationHistory),
    })
  }

    if (!finalContent?.trim()) {
      const explicitUserResponse = resolveLatestUserFacingResponse({
        storedResponse: getSessionUserResponse(currentSessionId, effectiveRunId),
        responseEvents: getSessionRunUserResponseEvents(currentSessionId, effectiveRunId),
        conversationHistory: conversationHistory as any,
        sinceIndex: currentPromptIndex,
      })

      if (explicitUserResponse?.trim().length) {
        finalContent = explicitUserResponse
        if (!hasAssistantMessageInCurrentTurn(finalContent)) {
          addMessage("assistant", finalContent)
        }
      }
    }

    return {
      content: finalContent,
      conversationHistory: filterEphemeralMessages(conversationHistory).map((entry) => {
        const { skipModelReplay: _skipModelReplay, displayContent: _displayContent, ...rest } = entry
        return rest
      }),
      totalIterations: iteration,
    }
  } finally {
    // End Langfuse trace for this agent session if enabled
    // This is in a finally block to ensure traces are closed even on unexpected exceptions
    if (isLangfuseEnabled()) {
      endAgentTrace(currentSessionId, {
        output: finalContent,
        metadata: {
          totalIterations: iteration,
          wasAborted,
          ...(lastContextBudgetInfo && {
            contextBudget: {
              estTokensAfter: lastContextBudgetInfo.estTokensAfter,
              maxTokens: lastContextBudgetInfo.maxTokens,
              appliedStrategies: lastContextBudgetInfo.appliedStrategies,
            },
          }),
        },
      })
      // Flush to ensure trace is sent
      flushLangfuse().catch(() => {})
    }

    // Clean up context budget tracking for this session
    clearActualTokenUsage(currentSessionId)
    clearIterativeSummary(currentSessionId)
    clearContextRefs(currentSessionId)
    clearArchiveFrontier(currentSessionId)
    clearSummarizationFailureFlags(currentSessionId)

    // Clean up runtime session state at the end of agent processing.
    // Keep session userResponse/history so revived sessions can reinstate
    // prior respond_to_user blocks in the UI.
    agentSessionStateManager.cleanupSession(currentSessionId)
  }
}

async function makeLLMCall(
  messages: Array<{ role: string; content: string }>,
  config: any,
  onRetryProgress?: RetryProgressCallback,
  onStreamingUpdate?: StreamingCallback,
  sessionId?: string,
  tools?: MCPTool[],
): Promise<LLMToolCallResponse> {
  const chatProviderId = config.mcpToolsProviderId

  try {
    if (isDebugLLM()) {
      logLLM("=== LLM CALL START ===")
      logLLM("Messages →", {
        count: messages.length,
        totalChars: messages.reduce((sum, msg) => sum + msg.content.length, 0),
        messages: messages,
      })
      if (tools) {
        logLLM("Tools →", {
          count: tools.length,
          names: tools.map(t => t.name),
        })
      }
    }

    // Single call: streamText with tools for streaming providers, generateText for others.
    // This eliminates the previous two-call pattern (parallel streaming + generateText) which
    // caused divergence between what the user saw streaming and what tool actually executed.
    let result: LLMToolCallResponse
    if (onStreamingUpdate && chatProviderId !== "gemini") {
      result = await makeLLMCallWithStreamingAndTools(
        messages,
        onStreamingUpdate,
        chatProviderId,
        onRetryProgress,
        sessionId,
        tools,
      )
    } else {
      result = await makeLLMCallWithFetch(messages, chatProviderId, onRetryProgress, sessionId, tools)
    }

    if (isDebugLLM()) {
      logLLM("Response ←", result)
      logLLM("=== LLM CALL END ===")
    }
    return result
  } catch (error) {
    if (isDebugLLM()) {
      logLLM("LLM CALL ERROR:", error)
    }
    diagnosticsService.logError("llm", "Agent LLM call failed", error)
    throw error
  }
}
