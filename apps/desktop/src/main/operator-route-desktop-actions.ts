import crypto from "crypto"
import { app } from "electron"
import os from "os"
import type { OperatorRouteActions } from "@dotagents/shared/remote-server-route-contracts"
import type { Config } from "../shared/types"
import type {
  LocalSpeechModelProviderId,
  LocalSpeechModelStatus,
} from "@dotagents/shared/api-types"
import type { AgentRunExecutor } from "@dotagents/shared/agent-run-utils"
import { getErrorMessage } from "@dotagents/shared/error-utils"
import {
  downloadOperatorLocalSpeechModelAction,
  getOperatorLocalSpeechModelStatusAction,
  getOperatorLocalSpeechModelStatusesAction,
  type LocalSpeechModelActionOptions,
} from "@dotagents/shared/local-speech-models"
import {
  createOperatorModelPresetAction,
  deleteOperatorModelPresetAction,
  getOperatorModelPresetsAction,
  updateOperatorModelPresetAction,
  type ModelPresetActionOptions,
} from "@dotagents/shared/model-presets"
import {
  clearOperatorMcpServerLogsAction,
  getOperatorMcpServerLogsAction,
  getOperatorMcpStatusAction,
  getOperatorMcpToolsAction,
  restartOperatorMcpServerAction,
  setOperatorMcpToolEnabledAction,
  startOperatorMcpServerAction,
  stopOperatorMcpServerAction,
  testOperatorMcpServerAction,
  type OperatorMcpLifecycleActionOptions,
  type OperatorMcpMutationActionOptions,
  type OperatorMcpReadActionOptions,
  type OperatorMcpTestActionOptions,
} from "@dotagents/shared/mcp-api"
import type { MCPServerConfig } from "@dotagents/shared/mcp-utils"
import {
  getOperatorAudit,
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
  checkOperatorUpdaterAction,
  clearOperatorMessageQueueAction,
  clearOperatorDiscordLogsAction,
  connectOperatorDiscordAction,
  connectOperatorWhatsAppAction,
  disconnectOperatorDiscordAction,
  downloadLatestOperatorUpdateAssetAction,
  getOperatorConversationsAction,
  getOperatorDiscordAction,
  getOperatorDiscordLogsAction,
  getOperatorErrorsAction,
  getOperatorHealthAction,
  getOperatorIntegrationsAction,
  getOperatorLogsAction,
  getOperatorMessageQueuesAction,
  getOperatorRemoteServerAction,
  getOperatorStatusAction,
  getOperatorTunnelAction,
  getOperatorTunnelSetupAction,
  getOperatorUpdaterAction,
  getOperatorWhatsAppAction,
  logoutOperatorWhatsAppAction,
  openOperatorReleasesPageAction,
  openOperatorUpdateAssetAction,
  pauseOperatorMessageQueueAction,
  removeOperatorQueuedMessageAction,
  resumeOperatorMessageQueueAction,
  retryOperatorQueuedMessageAction,
  revealOperatorUpdateAssetAction,
  runOperatorAgentAction,
  restartOperatorAppAction as restartOperatorApp,
  restartOperatorRemoteServerAction as restartOperatorRemoteServer,
  rotateOperatorRemoteServerApiKeyAction,
  startOperatorTunnelAction,
  stopOperatorAgentSessionAction,
  stopOperatorTunnelAction,
  updateOperatorQueuedMessageAction,
  type OperatorActionAuditContext,
  type OperatorApiKeyActionOptions,
  type OperatorAgentActionOptions,
  type OperatorIntegrationActionOptions,
  type OperatorMessageQueueActionOptions,
  type OperatorObservabilityActionOptions,
  type OperatorRemoteServerStatusLike,
  type OperatorSystemMetricsLike,
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

function getOperatorSystemMetrics(): OperatorSystemMetricsLike {
  return {
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version,
    electronVersion: process.versions.electron,
    appVersion: app.getVersion(),
    osUptimeSeconds: os.uptime(),
    processUptimeSeconds: process.uptime(),
    memoryUsageBytes: process.memoryUsage(),
    cpuCount: os.cpus().length,
    totalMemoryBytes: os.totalmem(),
    freeMemoryBytes: os.freemem(),
    hostname: os.hostname(),
  }
}

const modelPresetActionOptions: ModelPresetActionOptions<Config> = {
  config: {
    get: () => configStore.get(),
    save: (config) => configStore.save(config),
  },
  diagnostics: diagnosticsService,
  createPresetId: () => `custom-${crypto.randomUUID()}`,
  now: () => Date.now(),
}

const apiKeyActionOptions: OperatorApiKeyActionOptions<Config> = {
  config: {
    get: () => configStore.get(),
    save: (config) => configStore.save(config),
  },
  diagnostics: diagnosticsService,
  generateApiKey: () => crypto.randomBytes(32).toString("hex"),
}

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

async function getLocalSpeechModelStatus(providerId: LocalSpeechModelProviderId): Promise<LocalSpeechModelStatus> {
  if (providerId === "parakeet") {
    const parakeetStt = await import("./parakeet-stt")
    return parakeetStt.getModelStatus()
  }
  if (providerId === "kitten") {
    const { getKittenModelStatus } = await import("./kitten-tts")
    return getKittenModelStatus()
  }

  const { getSupertonicModelStatus } = await import("./supertonic-tts")
  return getSupertonicModelStatus()
}

async function downloadLocalSpeechModel(providerId: LocalSpeechModelProviderId): Promise<void> {
  if (providerId === "parakeet") {
    const parakeetStt = await import("./parakeet-stt")
    await parakeetStt.downloadModel()
    return
  }
  if (providerId === "kitten") {
    const { downloadKittenModel } = await import("./kitten-tts")
    await downloadKittenModel()
    return
  }

  const { downloadSupertonicModel } = await import("./supertonic-tts")
  await downloadSupertonicModel()
}

function startLocalSpeechModelDownload(providerId: LocalSpeechModelProviderId): void {
  void downloadLocalSpeechModel(providerId).catch((caughtError) => {
    diagnosticsService.logError(
      "operator-route-desktop-actions",
      `Failed to download ${providerId} local speech model`,
      caughtError,
    )
  })
}

const localSpeechModelActionOptions: LocalSpeechModelActionOptions = {
  diagnostics: {
    logError: (...args) => diagnosticsService.logError(...args),
    getErrorMessage,
  },
  service: {
    getStatus: getLocalSpeechModelStatus,
    startDownload: startLocalSpeechModelDownload,
  },
}

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

const integrationActionOptions: OperatorIntegrationActionOptions = {
  diagnostics: {
    logError: (...args) => diagnosticsService.logError(...args),
    getErrorMessage,
  },
  service: {
    getIntegrationsSummary: buildOperatorIntegrationsSummary,
    getDiscordStatus: () => discordService.getStatus(),
    getDiscordLogs: () => discordService.getLogs(),
    startDiscord: () => discordService.start(),
    stopDiscord: () => discordService.stop(),
    clearDiscordLogs: () => discordService.clearLogs(),
    getWhatsAppSummary: getOperatorWhatsAppIntegrationSummary,
    isWhatsAppServerConnected: () => !!mcpService.getServerStatus()[WHATSAPP_SERVER_NAME]?.connected,
    executeWhatsAppTool: (toolName) => mcpService.executeToolCall(
      { name: toolName, arguments: {} },
      undefined,
      true,
    ),
  },
}

const messageQueueActionOptions: OperatorMessageQueueActionOptions = {
  service: {
    getAllQueues: () => messageQueueService.getAllQueues(),
    isQueuePaused: (conversationId) => messageQueueService.isQueuePaused(conversationId),
    clearQueue: (conversationId) => messageQueueService.clearQueue(conversationId),
    pauseQueue: (conversationId) => pauseMessageQueueByConversationId(conversationId),
    resumeQueue: (conversationId) => resumeMessageQueueByConversationId(conversationId),
    removeQueuedMessage: (conversationId, messageId) => removeQueuedMessageById(conversationId, messageId),
    retryQueuedMessage: (conversationId, messageId) => retryQueuedMessageById(conversationId, messageId),
    updateQueuedMessageText: (conversationId, messageId, text) =>
      updateQueuedMessageTextById(conversationId, messageId, text),
  },
}

const observabilityActionOptions: OperatorObservabilityActionOptions = {
  manualReleasesUrl: MANUAL_RELEASES_URL,
  diagnostics: diagnosticsService,
  service: {
    getCurrentVersion: () => app.getVersion(),
    getRecentErrors: (count) => diagnosticsService.getRecentErrors(count),
    performHealthCheck: () => diagnosticsService.performHealthCheck(),
    getTunnelStatus: getCloudflareTunnelStatus,
    getIntegrationsSummary: buildOperatorIntegrationsSummary,
    getUpdateInfo,
    getSystemMetrics: getOperatorSystemMetrics,
    getActiveSessions: () => agentSessionTracker.getActiveSessions(),
    getRecentSessions: (count) => agentSessionTracker.getRecentSessions(count),
    getConversationHistory: () => conversationService.getConversationHistory(),
  },
}

const tunnelActionOptions: OperatorTunnelActionOptions = {
  config: {
    get: () => configStore.get(),
  },
  diagnostics: diagnosticsService,
  service: {
    getStatus: getCloudflareTunnelStatus,
    checkCloudflaredInstalled,
    checkCloudflaredLoggedIn,
    listCloudflareTunnels,
    startQuickTunnel: startCloudflareTunnel,
    startNamedTunnel: startNamedCloudflareTunnel,
    stopTunnel: stopCloudflareTunnel,
  },
}

const updaterActionOptions: OperatorUpdaterActionOptions = {
  service: {
    getUpdateInfo,
    checkForUpdatesAndDownload,
    downloadLatestReleaseAsset,
    revealDownloadedReleaseAsset,
    openDownloadedReleaseAsset,
    openManualReleasesPage,
  },
}

async function runOperatorAgent(body: unknown, runAgent: AgentRunExecutor) {
  return runOperatorAgentAction(body, runAgent, agentActionOptions)
}

async function stopOperatorAgentSession(sessionIdParam: string | undefined) {
  return stopOperatorAgentSessionAction(sessionIdParam, agentActionOptions)
}

async function getOperatorLocalSpeechModelStatuses() {
  return getOperatorLocalSpeechModelStatusesAction(localSpeechModelActionOptions)
}

async function getOperatorLocalSpeechModelStatus(providerId: unknown) {
  return getOperatorLocalSpeechModelStatusAction(providerId, localSpeechModelActionOptions)
}

async function downloadOperatorLocalSpeechModel(providerId: unknown) {
  return downloadOperatorLocalSpeechModelAction(providerId, localSpeechModelActionOptions)
}

function getOperatorMcpStatus() {
  return getOperatorMcpStatusAction(operatorMcpReadActionOptions)
}

function getOperatorMcpServerLogs(
  serverName: string | undefined,
  count: string | number | undefined,
) {
  return getOperatorMcpServerLogsAction(serverName, count, operatorMcpReadActionOptions)
}

function clearOperatorMcpServerLogs(serverName: string | undefined) {
  return clearOperatorMcpServerLogsAction(serverName, operatorMcpMutationActionOptions)
}

async function testOperatorMcpServer(serverName: string | undefined) {
  return testOperatorMcpServerAction(serverName, operatorMcpTestActionOptions)
}

function getOperatorMcpTools(server: unknown) {
  return getOperatorMcpToolsAction(server, operatorMcpReadActionOptions)
}

function setOperatorMcpToolEnabled(
  toolName: string | undefined,
  body: unknown,
) {
  return setOperatorMcpToolEnabledAction(toolName, body, operatorMcpMutationActionOptions)
}

async function startOperatorMcpServer(body: unknown) {
  return startOperatorMcpServerAction(body, operatorMcpLifecycleActionOptions)
}

async function stopOperatorMcpServer(body: unknown) {
  return stopOperatorMcpServerAction(body, operatorMcpLifecycleActionOptions)
}

async function restartOperatorMcpServer(body: unknown) {
  return restartOperatorMcpServerAction(body, operatorMcpLifecycleActionOptions)
}

async function getOperatorIntegrations() {
  return getOperatorIntegrationsAction(integrationActionOptions)
}

function getOperatorDiscord() {
  return getOperatorDiscordAction(integrationActionOptions)
}

function getOperatorDiscordLogs(count: string | number | undefined) {
  return getOperatorDiscordLogsAction(count, integrationActionOptions)
}

async function connectOperatorDiscord() {
  return connectOperatorDiscordAction(integrationActionOptions)
}

async function disconnectOperatorDiscord() {
  return disconnectOperatorDiscordAction(integrationActionOptions)
}

function clearOperatorDiscordLogs() {
  return clearOperatorDiscordLogsAction(integrationActionOptions)
}

async function getOperatorWhatsApp() {
  return getOperatorWhatsAppAction(integrationActionOptions)
}

async function connectOperatorWhatsApp() {
  return connectOperatorWhatsAppAction(integrationActionOptions)
}

async function logoutOperatorWhatsApp() {
  return logoutOperatorWhatsAppAction(integrationActionOptions)
}

async function getOperatorStatus(remoteServerStatus: OperatorRemoteServerStatusLike) {
  return getOperatorStatusAction(remoteServerStatus, observabilityActionOptions)
}

async function getOperatorHealth() {
  return getOperatorHealthAction(observabilityActionOptions)
}

function getOperatorErrors(count: string | number | undefined) {
  return getOperatorErrorsAction(count, observabilityActionOptions)
}

function getOperatorLogs(count: string | number | undefined, level: string | undefined) {
  return getOperatorLogsAction(count, level, observabilityActionOptions)
}

async function getOperatorConversations(count: string | number | undefined) {
  return getOperatorConversationsAction(count, observabilityActionOptions)
}

function getOperatorRemoteServer(remoteServerStatus: OperatorRemoteServerStatusLike) {
  return getOperatorRemoteServerAction(remoteServerStatus)
}

function getOperatorMessageQueues() {
  return getOperatorMessageQueuesAction(messageQueueActionOptions)
}

function clearOperatorMessageQueue(conversationIdParam: string | undefined) {
  return clearOperatorMessageQueueAction(conversationIdParam, messageQueueActionOptions)
}

function pauseOperatorMessageQueue(conversationIdParam: string | undefined) {
  return pauseOperatorMessageQueueAction(conversationIdParam, messageQueueActionOptions)
}

function resumeOperatorMessageQueue(conversationIdParam: string | undefined) {
  return resumeOperatorMessageQueueAction(conversationIdParam, messageQueueActionOptions)
}

function removeOperatorQueuedMessage(conversationIdParam: string | undefined, messageIdParam: string | undefined) {
  return removeOperatorQueuedMessageAction(conversationIdParam, messageIdParam, messageQueueActionOptions)
}

function retryOperatorQueuedMessage(conversationIdParam: string | undefined, messageIdParam: string | undefined) {
  return retryOperatorQueuedMessageAction(conversationIdParam, messageIdParam, messageQueueActionOptions)
}

function updateOperatorQueuedMessage(
  conversationIdParam: string | undefined,
  messageIdParam: string | undefined,
  body: unknown,
) {
  return updateOperatorQueuedMessageAction(conversationIdParam, messageIdParam, body, messageQueueActionOptions)
}

async function getOperatorModelPresets(secretMask: string) {
  return getOperatorModelPresetsAction(secretMask, modelPresetActionOptions)
}

async function createOperatorModelPreset(body: unknown, secretMask: string) {
  return createOperatorModelPresetAction(body, secretMask, modelPresetActionOptions)
}

async function updateOperatorModelPreset(
  presetId: string | undefined,
  body: unknown,
  secretMask: string,
) {
  return updateOperatorModelPresetAction(presetId, body, secretMask, modelPresetActionOptions)
}

async function deleteOperatorModelPreset(presetId: string | undefined, secretMask: string) {
  return deleteOperatorModelPresetAction(presetId, secretMask, modelPresetActionOptions)
}

function rotateOperatorRemoteServerApiKey() {
  return rotateOperatorRemoteServerApiKeyAction(apiKeyActionOptions)
}

function getOperatorTunnel() {
  return getOperatorTunnelAction(tunnelActionOptions)
}

async function getOperatorTunnelSetup() {
  return getOperatorTunnelSetupAction(tunnelActionOptions)
}

async function startOperatorTunnel(remoteServerRunning: boolean) {
  return startOperatorTunnelAction(remoteServerRunning, tunnelActionOptions)
}

async function stopOperatorTunnel() {
  return stopOperatorTunnelAction(tunnelActionOptions)
}

function getOperatorUpdater(currentVersion: string) {
  return getOperatorUpdaterAction(currentVersion, MANUAL_RELEASES_URL, updaterActionOptions)
}

async function checkOperatorUpdater() {
  return checkOperatorUpdaterAction(MANUAL_RELEASES_URL, updaterActionOptions)
}

async function downloadLatestOperatorUpdateAsset() {
  return downloadLatestOperatorUpdateAssetAction(updaterActionOptions)
}

async function revealOperatorUpdateAsset() {
  return revealOperatorUpdateAssetAction(updaterActionOptions)
}

async function openOperatorUpdateAsset() {
  return openOperatorUpdateAssetAction(updaterActionOptions)
}

async function openOperatorReleasesPage() {
  return openOperatorReleasesPageAction(updaterActionOptions)
}

export const operatorRouteDesktopActions: OperatorRouteActions = {
  runOperatorAgent,
  stopOperatorAgentSession,
  clearOperatorMcpServerLogs,
  getOperatorMcpServerLogs,
  getOperatorMcpStatus,
  getOperatorMcpTools,
  restartOperatorMcpServer,
  setOperatorMcpToolEnabled,
  startOperatorMcpServer,
  stopOperatorMcpServer,
  testOperatorMcpServer,
  downloadOperatorLocalSpeechModel,
  getOperatorLocalSpeechModelStatus,
  getOperatorLocalSpeechModelStatuses,
  createOperatorModelPreset,
  deleteOperatorModelPreset,
  getOperatorModelPresets,
  updateOperatorModelPreset,
  getOperatorTunnel,
  getOperatorTunnelSetup,
  startOperatorTunnel,
  stopOperatorTunnel,
  checkOperatorUpdater,
  downloadLatestOperatorUpdateAsset,
  getOperatorUpdater,
  openOperatorReleasesPage,
  openOperatorUpdateAsset,
  revealOperatorUpdateAsset,
  clearOperatorDiscordLogs,
  connectOperatorDiscord,
  connectOperatorWhatsApp,
  disconnectOperatorDiscord,
  getOperatorDiscord,
  getOperatorDiscordLogs,
  getOperatorIntegrations,
  getOperatorWhatsApp,
  logoutOperatorWhatsApp,
  clearOperatorMessageQueue,
  getOperatorMessageQueues,
  pauseOperatorMessageQueue,
  removeOperatorQueuedMessage,
  resumeOperatorMessageQueue,
  retryOperatorQueuedMessage,
  updateOperatorQueuedMessage,
  getOperatorConversations,
  getOperatorErrors,
  getOperatorHealth,
  getOperatorLogs,
  getOperatorRemoteServer,
  getOperatorStatus,
  getOperatorAudit,
  recordOperatorAuditEvent,
  setOperatorAuditContext,
  restartOperatorApp,
  restartOperatorRemoteServer,
  rotateOperatorRemoteServerApiKey,
}
