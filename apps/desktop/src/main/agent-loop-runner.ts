import { getBranchMessageIndexMap } from "@dotagents/shared/conversation-progress"
import { resolveAgentModeMaxIterations } from "@dotagents/shared/agent-run-utils"
import type { SessionProfileSnapshot } from "@dotagents/core"
import type { AgentProgressUpdate } from "@dotagents/shared/agent-progress"
import type { ConversationCompactionMetadata } from "@dotagents/shared/conversation-domain"
import type { Config } from "../shared/types"
import { agentRuntime } from "./agent-runtime"
import { agentProfileService, createSessionSnapshotFromProfile, refreshSessionSnapshotSkillsFromProfile } from "./agent-profile-service"
import { agentSessionTracker } from "./agent-session-tracker"
import { processTranscriptWithACPAgent } from "./acp-main-agent"
import { configStore, trySaveConfig } from "./config"
import { conversationService } from "./conversation-service"
import { logApp, logLLM } from "./debug"
import { emitAgentProgress } from "./emit-agent-progress"
import { getErrorMessage } from "./error-utils"
import { resolvePreferredTopLevelAcpAgentSelection } from "./main-agent-selection"
import { mcpService, type MCPToolCall, type MCPToolResult } from "./mcp-service"
import { agentSessionStateManager, toolApprovalManager } from "./state"
import { getWindowRendererHandlers } from "./window"

export type ProcessWithAgentModeOptions = {
  profileId?: string
  onProgress?: (update: AgentProgressUpdate) => void
}

async function publishAgentProgress(
  update: AgentProgressUpdate,
  onProgress?: (update: AgentProgressUpdate) => void,
): Promise<void> {
  onProgress?.(update)
  await emitAgentProgress(update)
}

async function initializeMcpWithProgress(
  config: Config,
  sessionId: string,
  runId?: number,
  onProgress?: (update: AgentProgressUpdate) => void,
): Promise<void> {
  const shouldStop = () => agentSessionStateManager.shouldStopSession(sessionId)
  const effectiveMaxIterations = resolveAgentModeMaxIterations(config)

  if (shouldStop()) {
    return
  }

  const initStatus = mcpService.getInitializationStatus()

  await publishAgentProgress({
    sessionId,
    runId,
    currentIteration: 0,
    maxIterations: effectiveMaxIterations,
    steps: [
      {
        id: `mcp_init_${Date.now()}`,
        type: "thinking",
        title: "Preparing agent tools",
        description: initStatus.progress.currentServer
          ? `Connecting ${initStatus.progress.currentServer} (${initStatus.progress.current}/${initStatus.progress.total})`
          : `Checking tool connections (${initStatus.progress.current}/${initStatus.progress.total})`,
        status: "in_progress",
        timestamp: Date.now(),
      },
    ],
    isComplete: false,
  }, onProgress)

  const progressInterval = setInterval(async () => {
    if (shouldStop()) {
      clearInterval(progressInterval)
      return
    }

    const currentStatus = mcpService.getInitializationStatus()
    if (currentStatus.isInitializing) {
      await publishAgentProgress({
        sessionId,
        runId,
        currentIteration: 0,
        maxIterations: effectiveMaxIterations,
        steps: [
          {
            id: `mcp_init_${Date.now()}`,
            type: "thinking",
            title: "Preparing agent tools",
            description: currentStatus.progress.currentServer
              ? `Connecting ${currentStatus.progress.currentServer} (${currentStatus.progress.current}/${currentStatus.progress.total})`
              : `Checking tool connections (${currentStatus.progress.current}/${currentStatus.progress.total})`,
            status: "in_progress",
            timestamp: Date.now(),
          },
        ],
        isComplete: false,
      }, onProgress)
    } else {
      clearInterval(progressInterval)
    }
  }, 500)

  try {
    await mcpService.initialize()
  } finally {
    clearInterval(progressInterval)
  }

  if (shouldStop()) {
    return
  }

  await publishAgentProgress({
    sessionId,
    runId,
    currentIteration: 0,
    maxIterations: effectiveMaxIterations,
    steps: [
      {
        id: `mcp_init_complete_${Date.now()}`,
        type: "thinking",
        title: "Agent tools ready",
        description: `${mcpService.getAvailableTools().length} tools available`,
        status: "completed",
        timestamp: Date.now(),
      },
    ],
    isComplete: false,
  }, onProgress)
}

export async function processWithAgentMode(
  text: string,
  conversationId?: string,
  existingSessionId?: string,
  startSnoozed: boolean = false,
  maxIterationsOverride?: number,
  options: ProcessWithAgentModeOptions = {},
): Promise<string> {
  const config = configStore.get()
  const effectiveMaxIterations = resolveAgentModeMaxIterations(config, maxIterationsOverride)
  const allProfiles = agentProfileService.getAll()
  const requestedProfile = options.profileId
    ? agentProfileService.getById(options.profileId)
    : undefined
  if (options.profileId && !requestedProfile) {
    throw new Error(`Configured profile not found: ${options.profileId}`)
  }
  const currentProfile = requestedProfile ?? agentProfileService.getCurrentProfile()
  const existingProfileSnapshotFromSession = existingSessionId
    ? agentSessionStateManager.getSessionProfileSnapshot(existingSessionId)
      ?? agentSessionTracker.getSessionProfileSnapshot(existingSessionId)
    : undefined
  const existingProfileSnapshot = refreshSessionSnapshotSkillsFromProfile(
    existingProfileSnapshotFromSession,
    currentProfile,
  )
  const topLevelAcpSelection = resolvePreferredTopLevelAcpAgentSelection({
    currentProfile,
    sessionProfileId: existingProfileSnapshot?.profileId,
    mainAgentMode: config.mainAgentMode,
    mainAgentName: config.mainAgentName,
    profileAgents: allProfiles,
    legacyAgents: config.acpAgents || [],
  })

  if (topLevelAcpSelection) {
    if ("error" in topLevelAcpSelection) {
      logLLM(`[processWithAgentMode] ${topLevelAcpSelection.error}`)
      return topLevelAcpSelection.error
    }

    const resolvedMainAgentName = topLevelAcpSelection.resolvedName
    if (
      topLevelAcpSelection.source === "main-agent"
      && topLevelAcpSelection.repairedName
      && topLevelAcpSelection.repairedName !== config.mainAgentName
    ) {
      const saveError = trySaveConfig({ ...config, mainAgentName: resolvedMainAgentName })
      if (saveError) {
        logLLM(
          `[processWithAgentMode] Failed to persist repaired ACP main agent name "${resolvedMainAgentName}": ${saveError.message}`
        )
      }
      logLLM(
        `[processWithAgentMode] ACP main agent \"${config.mainAgentName}\" not found. ` +
        `Auto-switched to \"${resolvedMainAgentName}\".`
      )
    }

    logLLM(`[processWithAgentMode] ACP routing via ${topLevelAcpSelection.source}, agent: ${resolvedMainAgentName}`)

    const conversationTitle = text
    const profileSnapshot = existingProfileSnapshot
      ?? (currentProfile ? createSessionSnapshotFromProfile(currentProfile) : undefined)

    const sessionId = existingSessionId
      || agentSessionTracker.startSession(conversationId, conversationTitle, startSnoozed, profileSnapshot)
    const runId = agentSessionStateManager.startSessionRun(sessionId, profileSnapshot)

    try {
      const result = await processTranscriptWithACPAgent(text, {
        agentName: resolvedMainAgentName,
        conversationId: conversationId || sessionId,
        sessionId,
        runId,
        profileSnapshot,
        onProgress: options.onProgress,
      })

      if (result.success) {
        logLLM(`[processWithAgentMode] ACP mode completed successfully for session ${sessionId}, conversation ${conversationId}`)
        agentSessionTracker.completeSession(sessionId, "ACP agent completed successfully")
      } else {
        logLLM(`[processWithAgentMode] ACP mode failed for session ${sessionId}: ${result.error}`)
        agentSessionTracker.errorSession(sessionId, result.error || "Unknown error")
      }

      logLLM(`[processWithAgentMode] ACP mode returning, queue processing should trigger in .finally()`)
      return result.response || result.error || "No response from agent"
    } finally {
      agentSessionStateManager.cleanupSession(sessionId)
    }
  }

  let profileSnapshot: SessionProfileSnapshot | undefined = existingProfileSnapshot

  if (!profileSnapshot && currentProfile) {
    profileSnapshot = createSessionSnapshotFromProfile(currentProfile)
  }

  const conversationTitle = text
  const sessionId = existingSessionId || agentSessionTracker.startSession(conversationId, conversationTitle, startSnoozed, profileSnapshot)
  const runId = agentSessionStateManager.startSessionRun(sessionId, profileSnapshot)

  try {
    await initializeMcpWithProgress(config, sessionId, runId, options.onProgress)

    const beforeExecuteToolCall = async (toolCall: MCPToolCall): Promise<MCPToolResult | void> => {
      if (config.mcpRequireApprovalBeforeToolCall) {
        const { approvalId, promise: approvalPromise } = toolApprovalManager.requestApproval(
          sessionId,
          toolCall.name,
          toolCall.arguments
        )

        await publishAgentProgress({
          sessionId,
          runId,
          currentIteration: 0,
          maxIterations: effectiveMaxIterations,
          steps: [],
          isComplete: false,
          pendingToolApproval: {
            approvalId,
            toolName: toolCall.name,
            arguments: toolCall.arguments,
          },
        }, options.onProgress)

        const approved = await approvalPromise

        await publishAgentProgress({
          sessionId,
          runId,
          currentIteration: 0,
          maxIterations: effectiveMaxIterations,
          steps: [],
          isComplete: false,
          pendingToolApproval: undefined,
        }, options.onProgress)

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

      return undefined
    }

    let previousConversationHistory:
      | Array<{
          role: "user" | "assistant" | "tool"
          content: string
          displayContent?: string
          toolCalls?: any[]
          toolResults?: any[]
          timestamp?: number
          branchMessageIndex?: number
        }>
      | undefined
    let previousConversationCompaction: ConversationCompactionMetadata | undefined

    if (conversationId) {
      logLLM(`[agent-loop-runner] Loading conversation history for conversationId: ${conversationId}`)
      const conversation = await conversationService.loadConversationWithCompaction(conversationId, sessionId)

      if (conversation && conversation.messages.length > 0) {
        logLLM(`[agent-loop-runner] Loaded conversation with ${conversation.messages.length} messages`)
        previousConversationCompaction = conversation.compaction

        const replayMessages = Array.isArray(conversation.rawMessages) && conversation.rawMessages.length > 0
          ? conversation.rawMessages
          : conversation.messages
        const messagesToConvert = replayMessages.slice(0, -1)
        const branchMessageIndexMap = getBranchMessageIndexMap(messagesToConvert)
        logLLM(`[agent-loop-runner] Converting ${messagesToConvert.length} messages (excluding last message)`)
        previousConversationHistory = messagesToConvert.map((msg, index) => ({
          role: msg.role,
          content: msg.content,
          ...(msg.displayContent ? { displayContent: msg.displayContent } : {}),
          toolCalls: msg.toolCalls,
          timestamp: msg.timestamp,
          toolResults: msg.toolResults?.map((tr) => ({
            content: [
              {
                type: "text" as const,
                text: tr.success ? tr.content : (tr.error || tr.content),
              },
            ],
            isError: !tr.success,
          })),
          branchMessageIndex: branchMessageIndexMap[index],
        }))

        logLLM(`[agent-loop-runner] previousConversationHistory roles: [${previousConversationHistory.map(m => m.role).join(", ")}]`)
      } else {
        logLLM("[agent-loop-runner] No conversation found or conversation is empty")
      }
    } else {
      logLLM("[agent-loop-runner] No conversationId provided, starting fresh conversation")
    }

    if (!startSnoozed) {
      try {
        getWindowRendererHandlers("panel")?.focusAgentSession.send(sessionId)
      } catch (error) {
        logApp("[agent-loop-runner] Failed to focus new agent session:", error)
      }
    }

    const agentResult = await agentRuntime.runAgentTurn({
      transcript: text,
      maxIterations: effectiveMaxIterations,
      previousConversationHistory,
      conversationId,
      sessionId,
      profileSnapshot,
      runId,
      previousConversationCompaction,
      initializeMcp: false,
      skipApprovalCheck: true,
      beforeExecuteToolCall,
      onProgress: options.onProgress,
    })

    agentSessionTracker.completeSession(sessionId, "Agent completed successfully")

    return agentResult.content
  } catch (error) {
    const errorMessage = getErrorMessage(error)
    agentSessionTracker.errorSession(sessionId, errorMessage)

    await publishAgentProgress({
      sessionId,
      runId,
      conversationId: conversationId || "",
      conversationTitle,
      currentIteration: 1,
      maxIterations: effectiveMaxIterations,
      steps: [{
        id: `error_${Date.now()}`,
        type: "thinking",
        title: "Error",
        description: errorMessage,
        status: "error",
        timestamp: Date.now(),
      }],
      isComplete: true,
      finalContent: `Error: ${errorMessage}`,
    }, options.onProgress)

    throw error
  }
}

export async function runAgentLoopSession(
  text: string,
  conversationId: string,
  existingSessionId: string,
  startSnoozed: boolean = true,
  maxIterationsOverride?: number,
): Promise<string> {
  return processWithAgentMode(text, conversationId, existingSessionId, startSnoozed, maxIterationsOverride)
}
