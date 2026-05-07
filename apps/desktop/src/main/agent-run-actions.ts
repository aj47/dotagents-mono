import type {
  AgentRunOptions,
  AgentRunResult,
} from "@dotagents/shared/agent-run-utils"
import {
  createRemoteAgentRunExecutor,
  type RemoteAgentRunActionOptions,
  type RemoteAgentRunActionService,
} from "@dotagents/shared/agent-run-utils"
import { agentSessionTracker } from "./agent-session-tracker"
import { configStore } from "./config"
import { conversationService } from "./conversation-service"
import { diagnosticsService } from "./diagnostics"
import { processWithAgentMode } from "./agent-loop-runner"
import { state } from "@dotagents/core"
import { notifyConversationHistoryChanged } from "./conversation-history-notifier"

export type RunAgentOptions = AgentRunOptions
export type RunAgentResult = AgentRunResult

function createRemoteAgentRunActionService(
  notifyConversationHistoryChanged: () => void,
): RemoteAgentRunActionService {
  return {
    getConfig: () => configStore.get(),
    setAgentModeState: (nextState) => {
      state.isAgentModeActive = nextState.isAgentModeActive
      state.shouldStopAgent = nextState.shouldStopAgent
      state.agentIterationCount = nextState.agentIterationCount
    },
    addMessageToConversation: (conversationId, prompt, role) =>
      conversationService.addMessageToConversation(conversationId, prompt, role),
    createConversationWithId: (conversationId, prompt, role) =>
      conversationService.createConversationWithId(conversationId, prompt, role),
    generateConversationId: () => conversationService.generateConversationIdPublic(),
    findSessionByConversationId: (conversationId) => agentSessionTracker.findSessionByConversationId(conversationId),
    getSession: (sessionId) => agentSessionTracker.getSession(sessionId),
    reviveSession: (sessionId, startSnoozed) => agentSessionTracker.reviveSession(sessionId, startSnoozed),
    loadConversation: (conversationId) => conversationService.loadConversation(conversationId),
    processAgentMode: (prompt, conversationId, existingSessionId, startSnoozed, runOptions) =>
      processWithAgentMode(
        prompt,
        conversationId,
        existingSessionId,
        startSnoozed,
        undefined,
        runOptions,
      ),
    notifyConversationHistoryChanged,
  }
}

function createRemoteAgentRunActionOptions(
  notifyConversationHistoryChanged: () => void,
): RemoteAgentRunActionOptions {
  return {
    diagnostics: {
      logInfo: (source, message) => diagnosticsService.logInfo(source, message),
    },
    service: createRemoteAgentRunActionService(notifyConversationHistoryChanged),
  }
}

export async function runRemoteAgent(
  options: RunAgentOptions,
  notifyConversationHistoryChanged: () => void,
): Promise<RunAgentResult> {
  const remoteAgentRunExecutor = createRemoteAgentRunExecutor(
    createRemoteAgentRunActionOptions(notifyConversationHistoryChanged),
  )

  return remoteAgentRunExecutor(options)
}

export async function runAgent(options: RunAgentOptions): Promise<RunAgentResult> {
  return runRemoteAgent(options, notifyConversationHistoryChanged)
}
