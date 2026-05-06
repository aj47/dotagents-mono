import { app } from "electron"
import os from "os"
import {
  getOperatorConversationsAction,
  getOperatorErrorsAction,
  getOperatorHealthAction,
  getOperatorLogsAction,
  getOperatorRemoteServerAction,
  getOperatorStatusAction,
  type OperatorObservabilityActionOptions,
  type OperatorRemoteServerStatusLike,
  type OperatorSystemMetricsLike,
} from "@dotagents/shared/operator-actions"
import type { OperatorRouteActionResult } from "@dotagents/shared/remote-server-route-contracts"
import { agentSessionTracker } from "./agent-session-tracker"
import { getCloudflareTunnelStatus } from "./cloudflare-tunnel"
import { conversationService } from "./conversation-service"
import { diagnosticsService } from "./diagnostics"
import { buildOperatorIntegrationsSummary } from "./operator-integration-summary"
import {
  MANUAL_RELEASES_URL,
  getUpdateInfo,
} from "./updater"

export type OperatorObservabilityActionResult = OperatorRouteActionResult

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

export async function getOperatorStatus(
  remoteServerStatus: OperatorRemoteServerStatusLike,
): Promise<OperatorObservabilityActionResult> {
  return getOperatorStatusAction(remoteServerStatus, observabilityActionOptions)
}

export async function getOperatorHealth(): Promise<OperatorObservabilityActionResult> {
  return getOperatorHealthAction(observabilityActionOptions)
}

export function getOperatorErrors(count: string | number | undefined): OperatorObservabilityActionResult {
  return getOperatorErrorsAction(count, observabilityActionOptions)
}

export function getOperatorLogs(
  count: string | number | undefined,
  level: string | undefined,
): OperatorObservabilityActionResult {
  return getOperatorLogsAction(count, level, observabilityActionOptions)
}

export async function getOperatorConversations(count: string | number | undefined): Promise<OperatorObservabilityActionResult> {
  return getOperatorConversationsAction(count, observabilityActionOptions)
}

export function getOperatorRemoteServer(
  remoteServerStatus: OperatorRemoteServerStatusLike,
): OperatorObservabilityActionResult {
  return getOperatorRemoteServerAction(remoteServerStatus)
}
