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
  checkOperatorUpdater,
  downloadLatestOperatorUpdateAsset,
  getOperatorUpdater,
  openOperatorReleasesPage,
  openOperatorUpdateAsset,
  revealOperatorUpdateAsset,
} from "./operator-updater-actions"
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
  restartOperatorApp,
  restartOperatorRemoteServer,
} from "./operator-restart-actions"
import { rotateOperatorRemoteServerApiKey } from "./operator-api-key-actions"

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
