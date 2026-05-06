import type { OperatorRouteActions } from "./operator-routes"
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
  createOperatorModelPreset,
  deleteOperatorModelPreset,
  getOperatorModelPresets,
  updateOperatorModelPreset,
} from "./operator-model-preset-actions"
import {
  getOperatorTunnel,
  getOperatorTunnelSetup,
  startOperatorTunnel,
  stopOperatorTunnel,
} from "./operator-tunnel-actions"
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
  getOperatorUpdaterAction,
  openOperatorReleasesPageAction,
  openOperatorUpdateAssetAction,
  revealOperatorUpdateAssetAction,
  restartOperatorAppAction as restartOperatorApp,
  restartOperatorRemoteServerAction as restartOperatorRemoteServer,
  type OperatorUpdaterActionOptions,
} from "@dotagents/shared/operator-actions"
import { rotateOperatorRemoteServerApiKey } from "./operator-api-key-actions"
import {
  MANUAL_RELEASES_URL,
  checkForUpdatesAndDownload,
  downloadLatestReleaseAsset,
  getUpdateInfo,
  openDownloadedReleaseAsset,
  openManualReleasesPage,
  revealDownloadedReleaseAsset,
} from "./updater"

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
