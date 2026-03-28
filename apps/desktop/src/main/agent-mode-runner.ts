import type {
  AgentProgressUpdate,
  Config,
  Conversation,
  SessionProfileSnapshot,
} from "../shared/types"
import { processTranscriptWithACPAgent } from "./acp-main-agent"
import { agentProfileService, createSessionSnapshotFromProfile } from "./agent-profile-service"
import { agentSessionTracker } from "./agent-session-tracker"
import { configStore, trySaveConfig } from "./config"
import { conversationService } from "./conversation-service"
import { emitAgentProgress } from "./emit-agent-progress"
import { getErrorMessage } from "./error-utils"
import { processTranscriptWithAgentMode } from "./llm"
import { resolvePreferredTopLevelAcpAgentSelection } from "./main-agent-selection"
import { mcpService, MCPToolCall, MCPToolResult } from "./mcp-service"
import { agentSessionStateManager, toolApprovalManager } from "./state"

type AgentConversationHistoryEntry = {
  role: "user" | "assistant" | "tool"
  content: string
  toolCalls?: MCPToolCall[]
  toolResults?: MCPToolResult[]
  timestamp?: number
}

type StoredConversationMessage = Conversation["messages"][number]

export interface PreparedConversationTurn {
  conversationId: string
  previousConversationHistory: AgentConversationHistoryEntry[]
}

export interface EnsureAgentSessionForConversationOptions {
  conversationId: string
  conversationTitle: string
  startSnoozed?: boolean
  profileSnapshot?: SessionProfileSnapshot
  candidateSessionIds?: readonly string[]
}

export interface EnsuredAgentSession {
  sessionId: string
  reusedExistingSession: boolean
}

export interface PreparePromptExecutionContextOptions {
  prompt: string
  requestedConversationId?: string
  conversationTitle?: string
  startSnoozed?: boolean
  profileSnapshot?: SessionProfileSnapshot
  candidateSessionIds?: readonly string[]
}

export interface PreparedPromptExecutionContext extends PreparedConversationTurn {
  sessionId: string
  reusedExistingSession: boolean
}

export interface RunTopLevelAgentModeOptions {
  text: string
  conversationId?: string
  existingSessionId?: string
  previousConversationHistory?: AgentConversationHistoryEntry[]
  profileSnapshot?: SessionProfileSnapshot
  startSnoozed?: boolean
  maxIterationsOverride?: number
  approvalMode?: "inline" | "dialog"
  onProgress?: (update: AgentProgressUpdate) => void
  focusSession?: (sessionId: string) => void | Promise<void>
}

export interface RunTopLevelAgentModeResult {
  content: string
  conversationId?: string
  sessionId: string
  runId: number
  usedAcp: boolean
}

function getEffectiveMaxIterations(config: Config, maxIterationsOverride?: number): number {
  if (typeof maxIterationsOverride === "number" && Number.isFinite(maxIterationsOverride)) {
    return Math.max(1, Math.floor(maxIterationsOverride))
  }

  return config.mcpUnlimitedIterations ? Infinity : (config.mcpMaxIterations ?? 10)
}

function mapStoredConversationMessagesToAgentHistory(
  messages: StoredConversationMessage[],
): AgentConversationHistoryEntry[] {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
    toolCalls: message.toolCalls,
    timestamp: message.timestamp,
    toolResults: message.toolResults?.map((toolResult) => ({
      content: [
        {
          type: "text" as const,
          text: toolResult.success ? toolResult.content : (toolResult.error || toolResult.content),
        },
      ],
      isError: !toolResult.success,
    })),
  }))
}

async function emitTopLevelProgress(
  update: AgentProgressUpdate,
  onProgress?: (update: AgentProgressUpdate) => void,
): Promise<void> {
  await emitAgentProgress(update)
  if (onProgress) {
    onProgress(update)
  }
}

async function initializeMcpWithProgress(
  config: Config,
  sessionId: string,
  runId: number,
  maxIterations: number,
  onProgress?: (update: AgentProgressUpdate) => void,
): Promise<void> {
  const shouldStop = () => agentSessionStateManager.shouldStopSession(sessionId)

  if (shouldStop()) {
    return
  }

  const buildUpdate = (
    title: string,
    description: string,
    status: "in_progress" | "completed",
  ): AgentProgressUpdate => ({
    sessionId,
    runId,
    currentIteration: 0,
    maxIterations,
    steps: [
      {
        id: `mcp_init_${Date.now()}_${status}`,
        type: "thinking",
        title,
        description,
        status,
        timestamp: Date.now(),
      },
    ],
    isComplete: false,
  })

  const initStatus = mcpService.getInitializationStatus()
  const initialDescription = initStatus.progress.currentServer
    ? `Initializing ${initStatus.progress.currentServer} (${initStatus.progress.current}/${initStatus.progress.total})`
    : `Initializing MCP servers (${initStatus.progress.current}/${initStatus.progress.total})`

  await emitTopLevelProgress(
    buildUpdate("Initializing MCP tools", initialDescription, "in_progress"),
    onProgress,
  )

  const progressInterval = setInterval(() => {
    if (shouldStop()) {
      clearInterval(progressInterval)
      return
    }

    const currentStatus = mcpService.getInitializationStatus()
    if (!currentStatus.isInitializing) {
      clearInterval(progressInterval)
      return
    }

    const description = currentStatus.progress.currentServer
      ? `Initializing ${currentStatus.progress.currentServer} (${currentStatus.progress.current}/${currentStatus.progress.total})`
      : `Initializing MCP servers (${currentStatus.progress.current}/${currentStatus.progress.total})`

    void emitTopLevelProgress(
      buildUpdate("Initializing MCP tools", description, "in_progress"),
      onProgress,
    )
  }, 500)

  try {
    await mcpService.initialize()
  } finally {
    clearInterval(progressInterval)
  }

  if (shouldStop()) {
    return
  }

  await emitTopLevelProgress(
    buildUpdate(
      "MCP tools initialized",
      `Successfully initialized ${mcpService.getAvailableTools().length} tools`,
      "completed",
    ),
    onProgress,
  )
}

async function requestInlineToolApproval(
  sessionId: string,
  runId: number,
  maxIterations: number,
  toolCall: MCPToolCall,
  onProgress?: (update: AgentProgressUpdate) => void,
): Promise<boolean> {
  const { approvalId, promise } = toolApprovalManager.requestApproval(
    sessionId,
    toolCall.name,
    toolCall.arguments,
  )

  await emitTopLevelProgress(
    {
      sessionId,
      runId,
      currentIteration: 0,
      maxIterations,
      steps: [
        {
          id: `tool_approval_${approvalId}`,
          type: "tool_approval",
          title: `Awaiting approval for ${toolCall.name}`,
          description: "Approve or deny this tool call before execution continues.",
          status: "awaiting_approval",
          timestamp: Date.now(),
          approvalRequest: {
            approvalId,
            toolName: toolCall.name,
            arguments: toolCall.arguments,
          },
        },
      ],
      isComplete: false,
      pendingToolApproval: {
        approvalId,
        toolName: toolCall.name,
        arguments: toolCall.arguments,
      },
    },
    onProgress,
  )

  const approved = await promise

  await emitTopLevelProgress(
    {
      sessionId,
      runId,
      currentIteration: 0,
      maxIterations,
      steps: [
        {
          id: `tool_approval_result_${approvalId}`,
          type: "tool_approval",
          title: approved ? `Approved ${toolCall.name}` : `Denied ${toolCall.name}`,
          description: approved
            ? "Tool execution approved."
            : "Tool execution was denied.",
          status: approved ? "completed" : "error",
          timestamp: Date.now(),
        },
      ],
      isComplete: false,
      pendingToolApproval: undefined,
    },
    onProgress,
  )

  return approved
}

export async function prepareConversationForPrompt(
  prompt: string,
  requestedConversationId?: string,
): Promise<PreparedConversationTurn> {
  let conversationId = requestedConversationId

  if (conversationId) {
    const updatedConversation = await conversationService.addMessageToConversation(
      conversationId,
      prompt,
      "user",
    )

    if (updatedConversation) {
      return {
        conversationId: updatedConversation.id,
        previousConversationHistory: mapStoredConversationMessagesToAgentHistory(
          updatedConversation.messages.slice(0, -1),
        ),
      }
    }

    const newConversation = await conversationService.createConversationWithId(
      conversationId,
      prompt,
      "user",
    )
    return {
      conversationId: newConversation.id,
      previousConversationHistory: [],
    }
  }

  const newConversation = await conversationService.createConversationWithId(
    conversationService.generateConversationIdPublic(),
    prompt,
    "user",
  )
  return {
    conversationId: newConversation.id,
    previousConversationHistory: [],
  }
}

export function ensureAgentSessionForConversation(
  options: EnsureAgentSessionForConversationOptions,
): EnsuredAgentSession {
  const {
    conversationId,
    conversationTitle,
    startSnoozed = true,
    profileSnapshot,
    candidateSessionIds = [],
  } = options

  const existingSessionId = agentSessionTracker.findSessionByConversationId(conversationId)
  const sessionCandidates = [...candidateSessionIds, existingSessionId].filter(
    (sessionId, index, list): sessionId is string =>
      typeof sessionId === "string" && sessionId.length > 0 && list.indexOf(sessionId) === index,
  )

  for (const sessionId of sessionCandidates) {
    if (agentSessionTracker.reviveSession(sessionId, startSnoozed)) {
      return {
        sessionId,
        reusedExistingSession: true,
      }
    }
  }

  return {
    sessionId: agentSessionTracker.startSession(
      conversationId,
      conversationTitle,
      startSnoozed,
      profileSnapshot,
    ),
    reusedExistingSession: false,
  }
}

export async function preparePromptExecutionContext(
  options: PreparePromptExecutionContextOptions,
): Promise<PreparedPromptExecutionContext> {
  const {
    prompt,
    requestedConversationId,
    conversationTitle = prompt,
    startSnoozed = true,
    profileSnapshot,
    candidateSessionIds = [],
  } = options

  const {
    conversationId,
    previousConversationHistory,
  } = await prepareConversationForPrompt(prompt, requestedConversationId)
  const {
    sessionId,
    reusedExistingSession,
  } = ensureAgentSessionForConversation({
    conversationId,
    conversationTitle,
    startSnoozed,
    profileSnapshot,
    candidateSessionIds,
  })

  return {
    conversationId,
    previousConversationHistory,
    sessionId,
    reusedExistingSession,
  }
}

export async function loadPreviousConversationHistory(
  conversationId?: string,
): Promise<AgentConversationHistoryEntry[] | undefined> {
  if (!conversationId) {
    return undefined
  }

  const conversation = await conversationService.loadConversation(conversationId)
  if (!conversation?.messages?.length) {
    return undefined
  }

  return mapStoredConversationMessagesToAgentHistory(
    conversation.messages.slice(0, -1),
  )
}

export async function runTopLevelAgentMode(
  options: RunTopLevelAgentModeOptions,
): Promise<RunTopLevelAgentModeResult> {
  const {
    text,
    conversationId,
    existingSessionId,
    previousConversationHistory,
    startSnoozed = false,
    profileSnapshot: explicitProfileSnapshot,
    maxIterationsOverride,
    approvalMode = "inline",
    onProgress,
    focusSession,
  } = options

  const config = configStore.get()
  const effectiveMaxIterations = getEffectiveMaxIterations(config, maxIterationsOverride)
  const allProfiles = agentProfileService.getAll()
  const currentProfile = agentProfileService.getCurrentProfile()
  const existingProfileSnapshot = explicitProfileSnapshot
    ?? (existingSessionId
      ? agentSessionStateManager.getSessionProfileSnapshot(existingSessionId)
        ?? agentSessionTracker.getSessionProfileSnapshot(existingSessionId)
      : undefined)

  const topLevelAcpSelection = resolvePreferredTopLevelAcpAgentSelection({
    currentProfile,
    sessionProfileId: existingProfileSnapshot?.profileId,
    mainAgentMode: config.mainAgentMode,
    mainAgentName: config.mainAgentName,
    profileAgents: allProfiles,
    legacyAgents: config.acpAgents || [],
  })

  let profileSnapshot: SessionProfileSnapshot | undefined = existingProfileSnapshot
  if (!profileSnapshot && currentProfile) {
    profileSnapshot = createSessionSnapshotFromProfile(currentProfile)
  }

  const conversationTitle = text
  const sessionId = existingSessionId
    || agentSessionTracker.startSession(conversationId, conversationTitle, startSnoozed, profileSnapshot)
  agentSessionTracker.updateSession(sessionId, {
    maxIterations: effectiveMaxIterations,
    ...(profileSnapshot ? { profileSnapshot } : {}),
  })
  const runId = agentSessionStateManager.startSessionRun(sessionId, profileSnapshot)

  if (topLevelAcpSelection) {
    if ("error" in topLevelAcpSelection) {
      agentSessionTracker.errorSession(sessionId, topLevelAcpSelection.error)
      agentSessionStateManager.cleanupSession(sessionId)
      return {
        content: topLevelAcpSelection.error,
        conversationId,
        sessionId,
        runId,
        usedAcp: true,
      }
    }

    if (
      topLevelAcpSelection.source === "main-agent"
      && topLevelAcpSelection.repairedName
      && topLevelAcpSelection.repairedName !== config.mainAgentName
    ) {
      trySaveConfig({
        ...config,
        mainAgentName: topLevelAcpSelection.resolvedName,
      })
    }

    try {
      const result = await processTranscriptWithACPAgent(text, {
        agentName: topLevelAcpSelection.resolvedName,
        conversationId: conversationId || sessionId,
        sessionId,
        runId,
        onProgress,
        profileSnapshot,
      })

      if (result.success) {
        agentSessionTracker.completeSession(sessionId, "ACP agent completed successfully")
      } else {
        agentSessionTracker.errorSession(sessionId, result.error || "Unknown error")
      }

      return {
        content: result.response || result.error || "No response from agent",
        conversationId,
        sessionId,
        runId,
        usedAcp: true,
      }
    } finally {
      agentSessionStateManager.cleanupSession(sessionId)
    }
  }

  let llmOwnsSessionCleanup = false

  try {
    await initializeMcpWithProgress(
      config,
      sessionId,
      runId,
      effectiveMaxIterations,
      onProgress,
    )

    mcpService.registerExistingProcessesWithAgentManager()

    const availableTools = profileSnapshot?.mcpServerConfig
      ? mcpService.getAvailableToolsForProfile(profileSnapshot.mcpServerConfig)
      : mcpService.getAvailableTools()

    const executeToolCall = async (
      toolCall: MCPToolCall,
      toolProgress?: (message: string) => void,
    ): Promise<MCPToolResult> => {
      if (
        config.mcpRequireApprovalBeforeToolCall
        && approvalMode === "inline"
      ) {
        const approved = await requestInlineToolApproval(
          sessionId,
          runId,
          effectiveMaxIterations,
          toolCall,
          onProgress,
        )

        if (!approved) {
          return {
            content: [
              {
                type: "text",
                text: `Tool call denied by user: ${toolCall.name}`,
              },
            ],
            isError: true,
          }
        }
      }

      return mcpService.executeToolCall(
        toolCall,
        toolProgress,
        config.mcpRequireApprovalBeforeToolCall && approvalMode === "inline",
        sessionId,
        profileSnapshot?.mcpServerConfig,
      )
    }

    if (!startSnoozed && focusSession) {
      await focusSession(sessionId)
    }

    llmOwnsSessionCleanup = true
    const agentResult = await processTranscriptWithAgentMode(
      text,
      availableTools,
      executeToolCall,
      effectiveMaxIterations,
      previousConversationHistory,
      conversationId,
      sessionId,
      onProgress,
      profileSnapshot,
      runId,
    )

    agentSessionTracker.completeSession(sessionId, "Agent completed successfully")

    return {
      content: agentResult.content,
      conversationId,
      sessionId,
      runId,
      usedAcp: false,
    }
  } catch (error) {
    const errorMessage = getErrorMessage(error)
    agentSessionTracker.errorSession(sessionId, errorMessage)

    await emitTopLevelProgress(
      {
        sessionId,
        runId,
        conversationId: conversationId || "",
        conversationTitle,
        currentIteration: 1,
        maxIterations: effectiveMaxIterations,
        steps: [
          {
            id: `error_${Date.now()}`,
            type: "thinking",
            title: "Error",
            description: errorMessage,
            status: "error",
            timestamp: Date.now(),
          },
        ],
        isComplete: true,
        finalContent: `Error: ${errorMessage}`,
        conversationHistory: [
          { role: "user", content: text, timestamp: Date.now() },
          { role: "assistant", content: `Error: ${errorMessage}`, timestamp: Date.now() },
        ],
      },
      onProgress,
    )

    if (!llmOwnsSessionCleanup) {
      agentSessionStateManager.cleanupSession(sessionId)
    }

    throw error
  }
}
