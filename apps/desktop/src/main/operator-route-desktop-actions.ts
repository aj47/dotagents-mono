import crypto from "crypto"
import type { OperatorRouteActions } from "./operator-routes"
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
  clearOperatorMcpServerLogs,
  getOperatorMcpServerLogs,
  getOperatorMcpStatus,
  getOperatorMcpTools,
  restartOperatorMcpServer,
  setOperatorMcpToolEnabled,
  startOperatorMcpServer,
  stopOperatorMcpServer,
  testOperatorMcpServer,
} from "./operator-mcp-actions"
import {
  getOperatorConversations,
  getOperatorErrors,
  getOperatorHealth,
  getOperatorLogs,
  getOperatorRemoteServer,
  getOperatorStatus,
} from "./operator-observability-actions"
import {
  getOperatorAudit,
  recordOperatorAuditEvent,
  setOperatorAuditContext,
} from "./operator-audit-actions"
import {
  checkOperatorUpdaterAction,
  clearOperatorMessageQueueAction,
  clearOperatorDiscordLogsAction,
  connectOperatorDiscordAction,
  connectOperatorWhatsAppAction,
  disconnectOperatorDiscordAction,
  downloadLatestOperatorUpdateAssetAction,
  getOperatorDiscordAction,
  getOperatorDiscordLogsAction,
  getOperatorIntegrationsAction,
  getOperatorMessageQueuesAction,
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
  startOperatorTunnelAction,
  stopOperatorAgentSessionAction,
  stopOperatorTunnelAction,
  updateOperatorQueuedMessageAction,
  type OperatorAgentActionOptions,
  type OperatorIntegrationActionOptions,
  type OperatorMessageQueueActionOptions,
  type OperatorTunnelActionOptions,
  type OperatorUpdaterActionOptions,
} from "@dotagents/shared/operator-actions"
import { rotateOperatorRemoteServerApiKey } from "./operator-api-key-actions"
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

const modelPresetActionOptions: ModelPresetActionOptions<Config> = {
  config: {
    get: () => configStore.get(),
    save: (config) => configStore.save(config),
  },
  diagnostics: diagnosticsService,
  createPresetId: () => `custom-${crypto.randomUUID()}`,
  now: () => Date.now(),
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
