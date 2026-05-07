import crypto from "crypto"
import { app } from "electron"
import os from "os"
import { createOperatorRouteActions } from "@dotagents/shared/remote-server-route-contracts"
import type { Config } from "../shared/types"
import { getErrorMessage } from "@dotagents/shared/error-utils"
import {
  createLocalSpeechModelActionService,
  createOperatorLocalSpeechModelRouteActions,
  type LocalSpeechModelActionOptions,
} from "@dotagents/shared/local-speech-models"
import {
  createModelPresetActionService,
  createOperatorModelPresetRouteActions,
  type ModelPresetActionOptions,
} from "@dotagents/shared/model-presets"
import {
  createOperatorMcpLifecycleActionService,
  createOperatorMcpMutationActionService,
  createOperatorMcpReadActionService,
  createOperatorMcpRouteActions,
  createOperatorMcpTestActionService,
  type OperatorMcpLifecycleActionOptions,
  type OperatorMcpMutationActionOptions,
  type OperatorMcpReadActionOptions,
  type OperatorMcpTestActionOptions,
} from "@dotagents/shared/mcp-api"
import type { MCPServerConfig } from "@dotagents/shared/mcp-utils"
import {
  operatorAuditRouteActionBundle,
} from "./operator-audit-actions"
import {
  buildOperatorActionAuditContext,
  buildOperatorMcpClearLogsAuditContext,
  buildOperatorMcpClearLogsFailureAuditContext,
  buildOperatorMcpRestartAuditContext,
  buildOperatorMcpRestartFailureAuditContext,
  buildOperatorMcpStartAuditContext,
  buildOperatorMcpStartFailureAuditContext,
  buildOperatorMcpStopAuditContext,
  buildOperatorMcpStopFailureAuditContext,
  buildOperatorMcpTestAuditContext,
  buildOperatorMcpTestFailureAuditContext,
  createOperatorAgentActionService,
  createOperatorApiKeyActionService,
  createOperatorApiKeyRouteActions,
  createOperatorAgentRouteActions,
  createOperatorChatGptWebAuthActionService,
  createOperatorChatGptWebAuthRouteActions,
  createOperatorDesktopWindowActionService,
  createOperatorDesktopWindowRouteActions,
  createOperatorIntegrationActionService,
  createOperatorIntegrationRouteActions,
  createOperatorMessageQueueActionService,
  createOperatorMessageQueueRouteActions,
  createOperatorObservabilityActionService,
  createOperatorObservabilityRouteActions,
  createOperatorRestartRouteActions,
  createOperatorSystemMetricsCollector,
  createOperatorTunnelActionService,
  createOperatorTunnelRouteActions,
  createOperatorTtsPlaybackActionService,
  createOperatorTtsPlaybackRouteActions,
  createOperatorUpdaterActionService,
  createOperatorUpdaterRouteActions,
  type OperatorActionAuditContext,
  type OperatorApiKeyActionOptions,
  type OperatorAgentActionOptions,
  type OperatorChatGptWebAuthActionOptions,
  type OperatorDesktopWindowActionOptions,
  type OperatorIntegrationActionOptions,
  type OperatorMessageQueueActionOptions,
  type OperatorObservabilityActionOptions,
  type OperatorTunnelActionOptions,
  type OperatorTtsPlaybackActionOptions,
  type OperatorUpdaterActionOptions,
} from "@dotagents/shared/operator-actions"
import { agentSessionTracker } from "./agent-session-tracker"
import { stopAgentSessionById } from "./agent-session-actions"
import {
  checkCloudflaredInstalled,
  checkCloudflaredLoggedIn,
  getCloudflareTunnelStatus,
  listCloudflareTunnels,
  startCloudflareTunnel,
  startNamedCloudflareTunnel,
  stopCloudflareTunnel,
} from "./cloudflare-tunnel"
import { configStore } from "./config"
import { conversationService } from "./conversation-service"
import { diagnosticsService } from "./diagnostics"
import { discordService } from "./discord-service"
import {
  setTrackedAgentSessionSnoozed,
  snoozeAgentSessionsAndHidePanelWindow,
} from "./floating-panel-session-state"
import {
  pauseMessageQueueByConversationId,
  removeQueuedMessageById,
  retryQueuedMessageById,
  resumeMessageQueueByConversationId,
  updateQueuedMessageTextById,
} from "./message-queue-actions"
import { messageQueueService } from "./message-queue-service"
import { mcpService, WHATSAPP_SERVER_NAME } from "./mcp-service"
import {
  buildOperatorIntegrationsSummary,
  getOperatorWhatsAppIntegrationSummary,
} from "./operator-integration-summary"
import {
  MANUAL_RELEASES_URL,
  checkForUpdatesAndDownload,
  downloadLatestReleaseAsset,
  getUpdateInfo,
  openDownloadedReleaseAsset,
  openManualReleasesPage,
  revealDownloadedReleaseAsset,
} from "./updater"
import {
  getWindowRendererHandlers,
  hideFloatingPanelWindow,
  setPanelMode,
  showMainWindow,
  showPanelWindow,
} from "./window"
import { stopAllTtsPlayback } from "./tts-playback-actions"
import { clearSessionUserResponse } from "./session-user-response-store"

const getOperatorSystemMetrics = createOperatorSystemMetricsCollector({
  getPlatform: () => os.platform(),
  getArch: () => os.arch(),
  getNodeVersion: () => process.version,
  getElectronVersion: () => process.versions.electron,
  getAppVersion: () => app.getVersion(),
  getOsUptimeSeconds: () => os.uptime(),
  getProcessUptimeSeconds: () => process.uptime(),
  getMemoryUsageBytes: () => process.memoryUsage(),
  getCpuCount: () => os.cpus().length,
  getTotalMemoryBytes: () => os.totalmem(),
  getFreeMemoryBytes: () => os.freemem(),
  getHostname: () => os.hostname(),
})

const modelPresetActionOptions: ModelPresetActionOptions<Config> = {
  diagnostics: diagnosticsService,
  service: createModelPresetActionService<Config>({
    config: {
      get: () => configStore.get(),
      save: (config) => configStore.save(config),
    },
    createUniqueId: crypto.randomUUID,
    now: () => Date.now(),
  }),
}

const operatorModelPresetRouteActions = createOperatorModelPresetRouteActions(modelPresetActionOptions)

const apiKeyActionOptions: OperatorApiKeyActionOptions = {
  diagnostics: diagnosticsService,
  service: createOperatorApiKeyActionService<Config>({
    config: {
      get: () => configStore.get(),
      save: (config) => configStore.save(config),
    },
    generateApiKey: () => crypto.randomBytes(32).toString("hex"),
  }),
}

const operatorApiKeyRouteActions = createOperatorApiKeyRouteActions(apiKeyActionOptions)

const agentActionOptions: OperatorAgentActionOptions = {
  diagnostics: {
    logInfo: (...args) => diagnosticsService.logInfo(...args),
    logError: (...args) => diagnosticsService.logError(...args),
    getErrorMessage,
  },
  service: createOperatorAgentActionService({
    showAgentSession: (sessionId) => {
      setTrackedAgentSessionSnoozed(sessionId, false)
      try {
        getWindowRendererHandlers("panel")?.focusAgentSession.send(sessionId)
      } catch (error) {
        diagnosticsService.logError(
          "operator-route-desktop-actions",
          `Failed to focus agent session ${sessionId} in panel`,
          error,
        )
      }
      setPanelMode("agent")
      showPanelWindow({})
      return { sessionId }
    },
    stopAgentSessionById,
    setAgentSessionSnoozed: (sessionId, isSnoozed) => {
      setTrackedAgentSessionSnoozed(sessionId, isSnoozed)
      return { sessionId, isSnoozed }
    },
    clearInactiveAgentSessions: () => {
      const shouldClear = (session: { conversationId?: string }) => {
        if (!session.conversationId) return true
        return messageQueueService.getQueue(session.conversationId).length === 0
      }
      const clearedCount = agentSessionTracker.getRecentSessions(100).filter(shouldClear).length
      agentSessionTracker.clearCompletedSessions(shouldClear)
      for (const id of ["main", "panel"] as const) {
        try {
          getWindowRendererHandlers(id)?.clearInactiveSessions?.send()
        } catch (error) {
          diagnosticsService.logError(
            "operator-route-desktop-actions",
            `Failed to notify ${id} window after clearing inactive sessions`,
            error,
          )
        }
      }
      return { clearedCount }
    },
    snoozeAgentSessionsAndHidePanel: (sessionIds) => ({
      sessionIds: snoozeAgentSessionsAndHidePanelWindow(sessionIds),
    }),
    clearAgentSessionProgress: (sessionId) => {
      clearSessionUserResponse(sessionId)
      const removed = agentSessionTracker.removeCompletedSession(sessionId)
      for (const id of ["main", "panel"] as const) {
        try {
          getWindowRendererHandlers(id)?.clearAgentSessionProgress?.send(sessionId)
        } catch (error) {
          diagnosticsService.logError(
            "operator-route-desktop-actions",
            `Failed to notify ${id} window after clearing agent session ${sessionId}`,
            error,
          )
        }
      }
      return { sessionId, removed }
    },
  }),
}

const operatorAgentRouteActions = createOperatorAgentRouteActions(agentActionOptions)

const ttsPlaybackActionOptions: OperatorTtsPlaybackActionOptions = {
  diagnostics: {
    logError: (...args) => diagnosticsService.logError(...args),
    getErrorMessage,
  },
  service: createOperatorTtsPlaybackActionService({
    stopAllTtsPlayback,
  }),
}

const operatorTtsPlaybackRouteActions = createOperatorTtsPlaybackRouteActions(ttsPlaybackActionOptions)

const desktopWindowActionOptions: OperatorDesktopWindowActionOptions = {
  diagnostics: {
    logError: (...args) => diagnosticsService.logError(...args),
    getErrorMessage,
  },
  service: createOperatorDesktopWindowActionService({
    showMainWindow: () => showMainWindow(),
    showPanelWindow: () => showPanelWindow({}),
    hidePanelWindow: () => hideFloatingPanelWindow(),
  }),
}

const operatorDesktopWindowRouteActions = createOperatorDesktopWindowRouteActions(desktopWindowActionOptions)

const localSpeechModelService = createLocalSpeechModelActionService({
  diagnostics: {
    logError: (...args) => diagnosticsService.logError(...args),
  },
  logSource: "operator-route-desktop-actions",
  providers: {
    parakeet: {
      getStatus: async () => {
        const parakeetStt = await import("./parakeet-stt")
        return parakeetStt.getModelStatus()
      },
      download: async () => {
        const parakeetStt = await import("./parakeet-stt")
        await parakeetStt.downloadModel()
      },
    },
    kitten: {
      getStatus: async () => {
        const { getKittenModelStatus } = await import("./kitten-tts")
        return getKittenModelStatus()
      },
      download: async () => {
        const { downloadKittenModel } = await import("./kitten-tts")
        await downloadKittenModel()
      },
    },
    supertonic: {
      getStatus: async () => {
        const { getSupertonicModelStatus } = await import("./supertonic-tts")
        return getSupertonicModelStatus()
      },
      download: async () => {
        const { downloadSupertonicModel } = await import("./supertonic-tts")
        await downloadSupertonicModel()
      },
    },
  },
})

const localSpeechModelActionOptions: LocalSpeechModelActionOptions = {
  diagnostics: {
    logError: (...args) => diagnosticsService.logError(...args),
    getErrorMessage,
  },
  service: localSpeechModelService,
}

const operatorLocalSpeechModelRouteActions = createOperatorLocalSpeechModelRouteActions(localSpeechModelActionOptions)

const operatorMcpReadActionOptions: OperatorMcpReadActionOptions = {
  diagnostics: {
    logError: (...args) => diagnosticsService.logError(...args),
    getErrorMessage,
  },
  service: createOperatorMcpReadActionService({
    getServerStatus: () => mcpService.getServerStatus(),
    getServerLogs: (serverName) => mcpService.getServerLogs(serverName),
    getDetailedToolList: () => mcpService.getDetailedToolList(),
  }),
}

const operatorMcpMutationActionOptions: OperatorMcpMutationActionOptions<OperatorActionAuditContext> = {
  diagnostics: {
    logError: (...args) => diagnosticsService.logError(...args),
    getErrorMessage,
  },
  service: createOperatorMcpMutationActionService({
    getServerStatus: () => mcpService.getServerStatus(),
    clearServerLogs: (serverName) => mcpService.clearServerLogs(serverName),
    setToolEnabled: (toolName, enabled) => mcpService.setToolEnabled(toolName, enabled),
  }),
  audit: {
    buildClearLogsAuditContext: (serverName) => buildOperatorMcpClearLogsAuditContext(serverName),
    buildClearLogsFailureAuditContext: (failureReason) => buildOperatorMcpClearLogsFailureAuditContext(failureReason),
    buildToolToggleAuditContext: (response) => buildOperatorActionAuditContext(response),
  },
}

const operatorMcpTestActionOptions: OperatorMcpTestActionOptions<MCPServerConfig, OperatorActionAuditContext> = {
  diagnostics: {
    logError: (...args) => diagnosticsService.logError(...args),
    getErrorMessage,
  },
  service: createOperatorMcpTestActionService<MCPServerConfig>({
    getServerConfig: (serverName) => configStore.get().mcpConfig?.mcpServers?.[serverName] as MCPServerConfig | undefined,
    testServerConnection: (serverName, serverConfig) => mcpService.testServerConnection(serverName, serverConfig),
  }),
  audit: {
    buildTestAuditContext: (response) => buildOperatorMcpTestAuditContext(response),
    buildTestFailureAuditContext: (failureReason) => buildOperatorMcpTestFailureAuditContext(failureReason),
  },
}

const operatorMcpLifecycleActionOptions: OperatorMcpLifecycleActionOptions<OperatorActionAuditContext> = {
  diagnostics: {
    logError: (...args) => diagnosticsService.logError(...args),
    logInfo: (...args) => diagnosticsService.logInfo(...args),
    getErrorMessage,
  },
  service: createOperatorMcpLifecycleActionService({
    getServerStatus: () => mcpService.getServerStatus(),
    setServerRuntimeEnabled: (serverName, enabled) => mcpService.setServerRuntimeEnabled(serverName, enabled),
    restartServer: (serverName) => mcpService.restartServer(serverName),
    stopServer: (serverName) => mcpService.stopServer(serverName),
  }),
  audit: {
    buildStartAuditContext: (serverName) => buildOperatorMcpStartAuditContext(serverName),
    buildStartFailureAuditContext: (failureReason) => buildOperatorMcpStartFailureAuditContext(failureReason),
    buildStopAuditContext: (serverName) => buildOperatorMcpStopAuditContext(serverName),
    buildStopFailureAuditContext: (failureReason) => buildOperatorMcpStopFailureAuditContext(failureReason),
    buildRestartAuditContext: (serverName) => buildOperatorMcpRestartAuditContext(serverName),
    buildRestartFailureAuditContext: (failureReason) => buildOperatorMcpRestartFailureAuditContext(failureReason),
  },
}

const operatorMcpRouteActions = createOperatorMcpRouteActions({
  read: operatorMcpReadActionOptions,
  mutation: operatorMcpMutationActionOptions,
  test: operatorMcpTestActionOptions,
  lifecycle: operatorMcpLifecycleActionOptions,
})

const integrationActionOptions: OperatorIntegrationActionOptions = {
  diagnostics: {
    logError: (...args) => diagnosticsService.logError(...args),
    getErrorMessage,
  },
  service: createOperatorIntegrationActionService({
    getIntegrationsSummary: buildOperatorIntegrationsSummary,
    discord: discordService,
    getWhatsAppSummary: getOperatorWhatsAppIntegrationSummary,
    whatsapp: {
      serverName: WHATSAPP_SERVER_NAME,
      mcp: mcpService,
    },
  }),
}

const operatorIntegrationRouteActions = createOperatorIntegrationRouteActions(integrationActionOptions)

const chatGptWebAuthActionOptions: OperatorChatGptWebAuthActionOptions = {
  diagnostics: {
    logError: (...args) => diagnosticsService.logError(...args),
  },
  service: createOperatorChatGptWebAuthActionService({
    getAuthStatus: async () => {
      const { getChatGptWebAuthStatus } = await import("./chatgpt-web-provider")
      return getChatGptWebAuthStatus()
    },
    loginOAuth: async () => {
      const { loginChatGptWebOAuth } = await import("./chatgpt-web-provider")
      return loginChatGptWebOAuth()
    },
    logoutOAuth: async () => {
      const { logoutChatGptWebOAuth } = await import("./chatgpt-web-provider")
      await logoutChatGptWebOAuth()
    },
  }),
}

const operatorChatGptWebAuthRouteActions = createOperatorChatGptWebAuthRouteActions(chatGptWebAuthActionOptions)

const messageQueueActionOptions: OperatorMessageQueueActionOptions = {
  service: createOperatorMessageQueueActionService({
    queue: messageQueueService,
    mutations: {
      pauseQueue: pauseMessageQueueByConversationId,
      resumeQueue: resumeMessageQueueByConversationId,
      removeQueuedMessage: removeQueuedMessageById,
      retryQueuedMessage: retryQueuedMessageById,
      updateQueuedMessageText: updateQueuedMessageTextById,
    },
  }),
}

const operatorMessageQueueRouteActions = createOperatorMessageQueueRouteActions(messageQueueActionOptions)

const observabilityActionOptions: OperatorObservabilityActionOptions = {
  manualReleasesUrl: MANUAL_RELEASES_URL,
  diagnostics: diagnosticsService,
  service: createOperatorObservabilityActionService({
    getCurrentVersion: () => app.getVersion(),
    diagnostics: diagnosticsService,
    getTunnelStatus: getCloudflareTunnelStatus,
    getIntegrationsSummary: buildOperatorIntegrationsSummary,
    getUpdateInfo,
    getSystemMetrics: getOperatorSystemMetrics,
    sessions: agentSessionTracker,
    conversations: conversationService,
  }),
}

const operatorObservabilityRouteActions = createOperatorObservabilityRouteActions(observabilityActionOptions)

const tunnelActionOptions: OperatorTunnelActionOptions = {
  diagnostics: diagnosticsService,
  service: createOperatorTunnelActionService({
    getConfig: () => configStore.get(),
    getStatus: getCloudflareTunnelStatus,
    checkCloudflaredInstalled,
    checkCloudflaredLoggedIn,
    listCloudflareTunnels,
    startCloudflareTunnel,
    startNamedCloudflareTunnel,
    stopCloudflareTunnel,
  }),
}

const operatorTunnelRouteActions = createOperatorTunnelRouteActions(tunnelActionOptions)

const updaterActionOptions: OperatorUpdaterActionOptions = {
  service: createOperatorUpdaterActionService({
    getUpdateInfo,
    checkForUpdatesAndDownload,
    downloadLatestReleaseAsset,
    revealDownloadedReleaseAsset,
    openDownloadedReleaseAsset,
    openManualReleasesPage,
  }),
}

const operatorUpdaterRouteActions = createOperatorUpdaterRouteActions(MANUAL_RELEASES_URL, updaterActionOptions)

const operatorRestartRouteActions = createOperatorRestartRouteActions()

export const operatorRouteDesktopActions = createOperatorRouteActions({
  agent: operatorAgentRouteActions,
  ttsPlayback: operatorTtsPlaybackRouteActions,
  desktopWindow: operatorDesktopWindowRouteActions,
  apiKey: operatorApiKeyRouteActions,
  mcp: operatorMcpRouteActions,
  localSpeechModels: operatorLocalSpeechModelRouteActions,
  modelPresets: operatorModelPresetRouteActions,
  tunnel: operatorTunnelRouteActions,
  updater: operatorUpdaterRouteActions,
  integrations: operatorIntegrationRouteActions,
  providerAuth: operatorChatGptWebAuthRouteActions,
  messageQueue: operatorMessageQueueRouteActions,
  observability: operatorObservabilityRouteActions,
  restart: operatorRestartRouteActions,
  audit: operatorAuditRouteActionBundle,
})
