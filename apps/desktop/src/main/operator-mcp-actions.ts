import {
  clearOperatorMcpServerLogsAction,
  getOperatorMcpServerLogsAction,
  getOperatorMcpStatusAction,
  getOperatorMcpToolsAction,
  setOperatorMcpToolEnabledAction,
  startOperatorMcpServerAction,
  stopOperatorMcpServerAction,
  testOperatorMcpServerAction,
  restartOperatorMcpServerAction,
  type OperatorMcpLifecycleActionOptions,
  type OperatorMcpMutationActionOptions,
  type OperatorMcpReadActionOptions,
  type OperatorMcpTestActionOptions,
} from "@dotagents/shared/mcp-api"
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
  type OperatorActionAuditContext,
} from "@dotagents/shared/operator-actions"
import type { OperatorRouteActionResult } from "@dotagents/shared/remote-server-route-contracts"
import type { MCPServerConfig } from "@dotagents/shared/mcp-utils"
import { configStore } from "./config"
import { diagnosticsService } from "./diagnostics"
import { getErrorMessage } from "@dotagents/shared/error-utils"
import { mcpService } from "./mcp-service"

export type OperatorMcpActionResult = OperatorRouteActionResult

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

export function getOperatorMcpStatus(): OperatorMcpActionResult {
  return getOperatorMcpStatusAction(operatorMcpReadActionOptions)
}

export function getOperatorMcpServerLogs(
  serverName: string | undefined,
  count: string | number | undefined,
): OperatorMcpActionResult {
  return getOperatorMcpServerLogsAction(serverName, count, operatorMcpReadActionOptions)
}

export function clearOperatorMcpServerLogs(serverName: string | undefined): OperatorMcpActionResult {
  return clearOperatorMcpServerLogsAction(serverName, operatorMcpMutationActionOptions)
}

export async function testOperatorMcpServer(serverName: string | undefined): Promise<OperatorMcpActionResult> {
  return testOperatorMcpServerAction(serverName, operatorMcpTestActionOptions)
}

export function getOperatorMcpTools(server: unknown): OperatorMcpActionResult {
  return getOperatorMcpToolsAction(server, operatorMcpReadActionOptions)
}

export function setOperatorMcpToolEnabled(
  toolName: string | undefined,
  body: unknown,
): OperatorMcpActionResult {
  return setOperatorMcpToolEnabledAction(toolName, body, operatorMcpMutationActionOptions)
}

export async function startOperatorMcpServer(body: unknown): Promise<OperatorMcpActionResult> {
  return startOperatorMcpServerAction(body, operatorMcpLifecycleActionOptions)
}

export async function stopOperatorMcpServer(body: unknown): Promise<OperatorMcpActionResult> {
  return stopOperatorMcpServerAction(body, operatorMcpLifecycleActionOptions)
}

export async function restartOperatorMcpServer(body: unknown): Promise<OperatorMcpActionResult> {
  return restartOperatorMcpServerAction(body, operatorMcpLifecycleActionOptions)
}
