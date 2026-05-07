import type {
  AgentRunOptions,
  AgentRunResult,
} from "@dotagents/shared/agent-run-utils"
import {
  createRemoteAgentRunActionService,
  createRemoteAgentRunExecutor,
  type RemoteAgentRunActionOptions,
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

function createRemoteAgentRunActionOptions(
  notifyConversationHistoryChanged: () => void,
): RemoteAgentRunActionOptions {
  return {
    diagnostics: {
      logInfo: (source, message) => diagnosticsService.logInfo(source, message),
    },
    service: createRemoteAgentRunActionService({
      config: {
        getConfig: () => configStore.get(),
      },
      state: {
        setAgentModeState: (nextState) => {
          state.isAgentModeActive = nextState.isAgentModeActive
          state.shouldStopAgent = nextState.shouldStopAgent
          state.agentIterationCount = nextState.agentIterationCount
        },
      },
      conversations: {
        addMessageToConversation: (conversationId, prompt, role) =>
          conversationService.addMessageToConversation(conversationId, prompt, role),
        createConversationWithId: (conversationId, prompt, role) =>
          conversationService.createConversationWithId(conversationId, prompt, role),
        generateConversationId: () => conversationService.generateConversationIdPublic(),
        loadConversation: (conversationId) => conversationService.loadConversation(conversationId),
        notifyConversationHistoryChanged,
      },
      sessions: {
        findSessionByConversationId: (conversationId) => agentSessionTracker.findSessionByConversationId(conversationId),
        getSession: (sessionId) => agentSessionTracker.getSession(sessionId),
        reviveSession: (sessionId, startSnoozed) => agentSessionTracker.reviveSession(sessionId, startSnoozed),
      },
      processor: {
        processAgentMode: (prompt, conversationId, existingSessionId, startSnoozed, runOptions) =>
          processWithAgentMode(
            prompt,
            conversationId,
            existingSessionId,
            startSnoozed,
            undefined,
            runOptions,
          ),
      },
    }),
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
