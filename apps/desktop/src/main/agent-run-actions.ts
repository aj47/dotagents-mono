import { formatConversationHistoryForApi } from "@dotagents/shared/chat-utils"
import type {
  AgentRunOptions,
  AgentRunResult,
} from "@dotagents/shared/agent-run-utils"
import { agentSessionTracker } from "./agent-session-tracker"
import { configStore } from "./config"
import { conversationService } from "./conversation-service"
import { diagnosticsService } from "./diagnostics"
import { processWithAgentMode } from "./agent-loop-runner"
import { state } from "./state"

export type RunAgentOptions = AgentRunOptions
export type RunAgentResult = AgentRunResult

export async function runRemoteAgent(
  options: RunAgentOptions,
  notifyConversationHistoryChanged: () => void,
): Promise<RunAgentResult> {
  const { prompt, conversationId: inputConversationId, profileId, onProgress } = options
  const cfg = configStore.get()

  state.isAgentModeActive = true
  state.shouldStopAgent = false
  state.agentIterationCount = 0

  let conversationId = inputConversationId

  if (conversationId) {
    const updatedConversation = await conversationService.addMessageToConversation(
      conversationId,
      prompt,
      "user"
    )

    if (updatedConversation) {
      diagnosticsService.logInfo("remote-server", `Continuing conversation ${conversationId} with ${Math.max(0, updatedConversation.messages.length - 1)} previous messages`)
    } else {
      diagnosticsService.logInfo("remote-server", `Conversation ${conversationId} not found, creating with provided ID`)
      const newConversation = await conversationService.createConversationWithId(conversationId, prompt, "user")
      conversationId = newConversation.id
      diagnosticsService.logInfo("remote-server", `Created new conversation with ID ${newConversation.id}`)
    }
  }

  if (!conversationId) {
    const newConversation = await conversationService.createConversationWithId(
      conversationService.generateConversationIdPublic(),
      prompt,
      "user"
    )
    conversationId = newConversation.id
    diagnosticsService.logInfo("remote-server", `Created new conversation ${conversationId}`)
  }

  const startSnoozed = !cfg.remoteServerAutoShowPanel
  let existingSessionId: string | undefined
  const foundSessionId = agentSessionTracker.findSessionByConversationId(conversationId)
  if (foundSessionId) {
    const existingSession = agentSessionTracker.getSession(foundSessionId)
    const isAlreadyActive = existingSession && existingSession.status === "active"
    const snoozeForRevive = isAlreadyActive ? existingSession.isSnoozed ?? false : startSnoozed
    const revived = agentSessionTracker.reviveSession(foundSessionId, snoozeForRevive)
    if (revived) {
      existingSessionId = foundSessionId
      diagnosticsService.logInfo("remote-server", `Revived existing session ${existingSessionId}`)
    }
  }

  const loadFormattedConversationHistory = async () => {
    const latestConversation = await conversationService.loadConversation(conversationId)
    return formatConversationHistoryForApi(latestConversation?.messages || [])
  }

  try {
    const content = await processWithAgentMode(
      prompt,
      conversationId,
      existingSessionId,
      startSnoozed,
      undefined,
      { profileId, onProgress },
    )

    const formattedHistory = await loadFormattedConversationHistory()
    notifyConversationHistoryChanged()

    return { content, conversationId, conversationHistory: formattedHistory }
  } catch (caughtError) {
    notifyConversationHistoryChanged()
    throw caughtError
  } finally {
    state.isAgentModeActive = false
    state.shouldStopAgent = false
    state.agentIterationCount = 0
  }
}
