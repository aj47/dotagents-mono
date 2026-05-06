import crypto from "crypto"
import type { OperatorRouteActions } from "./operator-routes"
import type { Config } from "../shared/types"
import {
  createOperatorModelPresetAction,
  deleteOperatorModelPresetAction,
  getOperatorModelPresetsAction,
  updateOperatorModelPresetAction,
  type ModelPresetActionOptions,
} from "@dotagents/shared/model-presets"
import {
  runOperatorAgent,
  stopOperatorAgentSession,
} from "./operator-agent-actions"
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
  downloadOperatorLocalSpeechModel,
  getOperatorLocalSpeechModelStatus,
  getOperatorLocalSpeechModelStatuses,
} from "./operator-local-speech-actions"
import {
  clearOperatorDiscordLogs,
  connectOperatorDiscord,
  connectOperatorWhatsApp,
  disconnectOperatorDiscord,
  getOperatorDiscord,
  getOperatorDiscordLogs,
  getOperatorIntegrations,
  getOperatorWhatsApp,
  logoutOperatorWhatsApp,
} from "./operator-integration-actions"
import {
  clearOperatorMessageQueue,
  getOperatorMessageQueues,
  pauseOperatorMessageQueue,
  removeOperatorQueuedMessage,
  resumeOperatorMessageQueue,
  retryOperatorQueuedMessage,
  updateOperatorQueuedMessage,
} from "./operator-message-queue-actions"
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
  downloadLatestOperatorUpdateAssetAction,
  getOperatorTunnelAction,
  getOperatorTunnelSetupAction,
  getOperatorUpdaterAction,
  openOperatorReleasesPageAction,
  openOperatorUpdateAssetAction,
  revealOperatorUpdateAssetAction,
  restartOperatorAppAction as restartOperatorApp,
  restartOperatorRemoteServerAction as restartOperatorRemoteServer,
  startOperatorTunnelAction,
  stopOperatorTunnelAction,
  type OperatorTunnelActionOptions,
  type OperatorUpdaterActionOptions,
} from "@dotagents/shared/operator-actions"
import { rotateOperatorRemoteServerApiKey } from "./operator-api-key-actions"
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
