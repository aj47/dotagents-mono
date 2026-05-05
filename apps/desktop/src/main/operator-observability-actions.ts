import { app } from "electron"
import os from "os"
import {
  buildOperatorConversationsResponse,
  buildOperatorHealthSnapshot,
  buildOperatorLogsResponse,
  buildOperatorRecentErrorsResponse,
  buildOperatorRemoteServerStatus,
  buildOperatorRuntimeStatus,
  clampOperatorCount,
  normalizeOperatorLogLevel,
  type OperatorRemoteServerStatusLike,
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

function ok(body: unknown): OperatorObservabilityActionResult {
  return {
    statusCode: 200,
    body,
  }
}

function error(statusCode: number, message: string): OperatorObservabilityActionResult {
  return {
    statusCode,
    body: { error: message },
  }
}

export async function getOperatorStatus(
  remoteServerStatus: OperatorRemoteServerStatusLike,
): Promise<OperatorObservabilityActionResult> {
  try {
    const now = Date.now()
    const recentErrors = diagnosticsService.getRecentErrors(100)
    const health = await diagnosticsService.performHealthCheck()

    return ok(buildOperatorRuntimeStatus({
      timestamp: now,
      remoteServer: remoteServerStatus,
      health,
      tunnel: getCloudflareTunnelStatus(),
      integrations: await buildOperatorIntegrationsSummary(),
      updater: {
        currentVersion: app.getVersion(),
        updateInfo: getUpdateInfo(),
        manualReleasesUrl: MANUAL_RELEASES_URL,
      },
      system: {
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
      },
      activeSessions: agentSessionTracker.getActiveSessions(),
      recentSessions: agentSessionTracker.getRecentSessions(10),
      recentErrors,
    }))
  } catch (caughtError) {
    diagnosticsService.logError("operator-observability-actions", "Failed to build operator runtime status", caughtError)
    return error(500, "Failed to build operator runtime status")
  }
}

export async function getOperatorHealth(): Promise<OperatorObservabilityActionResult> {
  try {
    const health = await diagnosticsService.performHealthCheck()
    return ok(buildOperatorHealthSnapshot(health))
  } catch (caughtError) {
    diagnosticsService.logError("operator-observability-actions", "Failed to build operator health snapshot", caughtError)
    return error(500, "Failed to build operator health snapshot")
  }
}

export function getOperatorErrors(count: string | number | undefined): OperatorObservabilityActionResult {
  try {
    const errors = diagnosticsService.getRecentErrors(clampOperatorCount(count, 10, 50))
    return ok(buildOperatorRecentErrorsResponse(errors))
  } catch (caughtError) {
    diagnosticsService.logError("operator-observability-actions", "Failed to build operator recent errors", caughtError)
    return error(500, "Failed to build operator recent errors")
  }
}

export function getOperatorLogs(
  count: string | number | undefined,
  level: string | undefined,
): OperatorObservabilityActionResult {
  try {
    const normalizedCount = clampOperatorCount(count, 20, 100)
    const normalizedLevel = normalizeOperatorLogLevel(level)
    const allEntries = diagnosticsService.getRecentErrors(normalizedCount)
    return ok(buildOperatorLogsResponse(allEntries, normalizedLevel))
  } catch (caughtError) {
    diagnosticsService.logError("operator-observability-actions", "Failed to build operator logs", caughtError)
    return error(500, "Failed to build operator logs")
  }
}

export async function getOperatorConversations(count: string | number | undefined): Promise<OperatorObservabilityActionResult> {
  try {
    const history = await conversationService.getConversationHistory()
    return ok(buildOperatorConversationsResponse(history, count))
  } catch (caughtError) {
    diagnosticsService.logError("operator-observability-actions", "Failed to build operator conversations response", caughtError)
    return error(500, "Failed to build operator conversations response")
  }
}

export function getOperatorRemoteServer(
  remoteServerStatus: OperatorRemoteServerStatusLike,
): OperatorObservabilityActionResult {
  return ok(buildOperatorRemoteServerStatus(remoteServerStatus))
}
