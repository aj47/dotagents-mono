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
  createCustomModelPresetId,
  createOperatorModelPresetRouteActions,
  type ModelPresetActionOptions,
} from "@dotagents/shared/model-presets"
import {
  createOperatorMcpRouteActions,
  type OperatorMcpLifecycleActionOptions,
  type OperatorMcpMutationActionOptions,
  type OperatorMcpReadActionOptions,
  type OperatorMcpTestActionOptions,
} from "@dotagents/shared/mcp-api"
import type { MCPServerConfig } from "@dotagents/shared/mcp-utils"
import {
  operatorAuditRouteActions,
  recordOperatorAuditEvent,
  setOperatorAuditContext,
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
  createOperatorApiKeyRouteActions,
  createOperatorAgentRouteActions,
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
  createOperatorUpdaterActionService,
  createOperatorUpdaterRouteActions,
  type OperatorActionAuditContext,
  type OperatorApiKeyActionOptions,
  type OperatorAgentActionOptions,
  type OperatorIntegrationActionOptions,
  type OperatorMessageQueueActionOptions,
  type OperatorObservabilityActionOptions,
  type OperatorTunnelActionOptions,
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
  config: {
    get: () => configStore.get(),
    save: (config) => configStore.save(config),
  },
  diagnostics: diagnosticsService,
  createPresetId: () => createCustomModelPresetId(crypto.randomUUID),
  now: () => Date.now(),
}

const operatorModelPresetRouteActions = createOperatorModelPresetRouteActions(modelPresetActionOptions)

const apiKeyActionOptions: OperatorApiKeyActionOptions<Config> = {
  config: {
    get: () => configStore.get(),
    save: (config) => configStore.save(config),
  },
  diagnostics: diagnosticsService,
  generateApiKey: () => crypto.randomBytes(32).toString("hex"),
}

const operatorApiKeyRouteActions = createOperatorApiKeyRouteActions(apiKeyActionOptions)

const agentActionOptions: OperatorAgentActionOptions = {
  diagnostics: {
    logInfo: (...args) => diagnosticsService.logInfo(...args),
    logError: (...args) => diagnosticsService.logError(...args),
    getErrorMessage,
  },
  service: {
    stopAgentSessionById,
  },
}

const operatorAgentRouteActions = createOperatorAgentRouteActions(agentActionOptions)

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
  service: {
    getServerStatus: () => mcpService.getServerStatus(),
    getServerLogs: (serverName) => mcpService.getServerLogs(serverName),
    getDetailedToolList: () => mcpService.getDetailedToolList(),
  },
}

const operatorMcpMutationActionOptions: OperatorMcpMutationActionOptions<OperatorActionAuditContext> = {
  diagnostics: {
    logError: (...args) => diagnosticsService.logError(...args),
    getErrorMessage,
  },
  service: {
    getServerStatus: () => mcpService.getServerStatus(),
    clearServerLogs: (serverName) => mcpService.clearServerLogs(serverName),
    setToolEnabled: (toolName, enabled) => mcpService.setToolEnabled(toolName, enabled),
  },
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
  service: {
    getServerConfig: (serverName) => configStore.get().mcpConfig?.mcpServers?.[serverName] as MCPServerConfig | undefined,
    testServerConnection: (serverName, serverConfig) => mcpService.testServerConnection(serverName, serverConfig),
  },
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
  service: {
    getServerStatus: () => mcpService.getServerStatus(),
    setServerRuntimeEnabled: (serverName, enabled) => mcpService.setServerRuntimeEnabled(serverName, enabled),
    restartServer: (serverName) => mcpService.restartServer(serverName),
    stopServer: (serverName) => mcpService.stopServer(serverName),
  },
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
  config: {
    get: () => configStore.get(),
  },
  diagnostics: diagnosticsService,
  service: createOperatorTunnelActionService({
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
  apiKey: operatorApiKeyRouteActions,
  mcp: operatorMcpRouteActions,
  localSpeechModels: operatorLocalSpeechModelRouteActions,
  modelPresets: operatorModelPresetRouteActions,
  tunnel: operatorTunnelRouteActions,
  updater: operatorUpdaterRouteActions,
  integrations: operatorIntegrationRouteActions,
  messageQueue: operatorMessageQueueRouteActions,
  observability: operatorObservabilityRouteActions,
  restart: operatorRestartRouteActions,
  audit: {
    getOperatorAudit: operatorAuditRouteActions.getOperatorAudit,
    recordOperatorAuditEvent,
    setOperatorAuditContext,
  },
})
