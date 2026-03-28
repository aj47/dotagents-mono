import { inferTransportType } from "../shared/mcp-utils"
import {
  listMcpServerStatusSummaries,
  type McpServerStatusSnapshot,
  type McpServerStatusSummary,
} from "../shared/mcp-server-status"
import type { MCPServerConfig, ServerLogEntry } from "../shared/types"

type ManagedMcpTransport = ReturnType<typeof inferTransportType> | "unknown"

interface McpServerSelectionCandidate {
  name: string
}

export interface ManagedMcpServerSummary extends McpServerStatusSummary {
  transport: ManagedMcpTransport
}

export interface ManagedMcpServerDetails extends ManagedMcpServerSummary {
  config?: MCPServerConfig
  envCount: number
  headerCount: number
}

export interface ResolvedManagedMcpServerSelection<
  T extends McpServerSelectionCandidate,
> {
  selectedServer?: T
  ambiguousServers?: T[]
}

export interface McpServerOperationResult {
  success: boolean
  error?: string
}

export interface ManagedMcpServerActionResult extends McpServerOperationResult {
  server?: ManagedMcpServerDetails
}

export interface ManagedMcpServerLogsResult
  extends ManagedMcpServerActionResult {
  logs?: ServerLogEntry[]
}

export interface McpManagementStore {
  getServerConfigs(): Record<string, MCPServerConfig>
  getServerStatus(): Record<string, McpServerStatusSnapshot>
  setServerRuntimeEnabled(serverName: string, enabled: boolean): boolean
  restartServer(serverName: string): Promise<McpServerOperationResult>
  stopServer(serverName: string): Promise<McpServerOperationResult>
  getServerLogs(serverName: string): ServerLogEntry[]
}

function normalizeManagedMcpServerQuery(value: string): string {
  return value.trim().toLowerCase()
}

function buildManagedMcpServerDetails(
  serverName: string,
  status: McpServerStatusSnapshot | undefined,
  config: MCPServerConfig | undefined,
): ManagedMcpServerDetails {
  const snapshot: McpServerStatusSnapshot = {
    connected: status?.connected === true,
    toolCount: status?.toolCount ?? 0,
    error: status?.error,
    runtimeEnabled: status?.runtimeEnabled,
    configDisabled: status?.configDisabled ?? config?.disabled === true,
  }
  const [summary] = listMcpServerStatusSummaries({
    [serverName]: snapshot,
  })

  return {
    ...summary,
    transport: config ? inferTransportType(config) : "unknown",
    config,
    envCount: Object.keys(config?.env || {}).length,
    headerCount: Object.keys(config?.headers || {}).length,
  }
}

function summarizeManagedMcpServer(
  details: ManagedMcpServerDetails,
): ManagedMcpServerSummary {
  return {
    name: details.name,
    connected: details.connected,
    toolCount: details.toolCount,
    error: details.error,
    runtimeEnabled: details.runtimeEnabled,
    configDisabled: details.configDisabled,
    enabled: details.enabled,
    state: details.state,
    transport: details.transport,
  }
}

function buildManagedMcpServerNotFound(
  serverName: string,
): ManagedMcpServerActionResult {
  return {
    success: false,
    error: `Server '${serverName}' not found`,
  }
}

export function getManagedMcpServerSummaries(
  store: Pick<McpManagementStore, "getServerConfigs" | "getServerStatus">,
): ManagedMcpServerSummary[] {
  const serverConfigs = store.getServerConfigs()
  const statusByServer = store.getServerStatus()
  const serverNames = [
    ...new Set([
      ...Object.keys(serverConfigs),
      ...Object.keys(statusByServer),
    ]),
  ].sort((a, b) => a.localeCompare(b))

  return serverNames.map((serverName) =>
    summarizeManagedMcpServer(
      buildManagedMcpServerDetails(
        serverName,
        statusByServer[serverName],
        serverConfigs[serverName],
      ),
    ),
  )
}

export function getManagedMcpServerSummary(
  serverName: string,
  store: Pick<McpManagementStore, "getServerConfigs" | "getServerStatus">,
): ManagedMcpServerDetails | undefined {
  const serverConfigs = store.getServerConfigs()
  const statusByServer = store.getServerStatus()

  if (!(serverName in serverConfigs) && !(serverName in statusByServer)) {
    return undefined
  }

  return buildManagedMcpServerDetails(
    serverName,
    statusByServer[serverName],
    serverConfigs[serverName],
  )
}

export function resolveManagedMcpServerSelection<
  T extends McpServerSelectionCandidate,
>(
  servers: readonly T[],
  query: string,
): ResolvedManagedMcpServerSelection<T> {
  const normalizedQuery = normalizeManagedMcpServerQuery(query)
  if (!normalizedQuery) {
    return {}
  }

  const exactMatch = servers.find(
    (server) => normalizeManagedMcpServerQuery(server.name) === normalizedQuery,
  )
  if (exactMatch) {
    return { selectedServer: exactMatch }
  }

  const prefixMatches = servers.filter((server) =>
    normalizeManagedMcpServerQuery(server.name).startsWith(normalizedQuery),
  )

  if (prefixMatches.length === 1) {
    return { selectedServer: prefixMatches[0] }
  }

  if (prefixMatches.length > 1) {
    return { ambiguousServers: prefixMatches }
  }

  return {}
}

export function setManagedMcpServerRuntimeEnabled(
  serverName: string,
  enabled: boolean,
  store: Pick<
    McpManagementStore,
    "getServerConfigs" | "getServerStatus" | "setServerRuntimeEnabled"
  >,
): ManagedMcpServerActionResult {
  if (!store.setServerRuntimeEnabled(serverName, enabled)) {
    return buildManagedMcpServerNotFound(serverName)
  }

  return {
    success: true,
    server: getManagedMcpServerSummary(serverName, store),
  }
}

export async function restartManagedMcpServer(
  serverName: string,
  store: Pick<
    McpManagementStore,
    "getServerConfigs" | "getServerStatus" | "restartServer"
  >,
): Promise<ManagedMcpServerActionResult> {
  const existingServer = getManagedMcpServerSummary(serverName, store)
  if (!existingServer) {
    return buildManagedMcpServerNotFound(serverName)
  }

  const result = await store.restartServer(serverName)
  if (!result.success) {
    return {
      ...result,
      server: getManagedMcpServerSummary(serverName, store) || existingServer,
    }
  }

  return {
    success: true,
    server: getManagedMcpServerSummary(serverName, store) || existingServer,
  }
}

export async function stopManagedMcpServer(
  serverName: string,
  store: Pick<
    McpManagementStore,
    "getServerConfigs" | "getServerStatus" | "stopServer"
  >,
): Promise<ManagedMcpServerActionResult> {
  const existingServer = getManagedMcpServerSummary(serverName, store)
  if (!existingServer) {
    return buildManagedMcpServerNotFound(serverName)
  }

  const result = await store.stopServer(serverName)
  if (!result.success) {
    return {
      ...result,
      server: getManagedMcpServerSummary(serverName, store) || existingServer,
    }
  }

  return {
    success: true,
    server: getManagedMcpServerSummary(serverName, store) || existingServer,
  }
}

export function getManagedMcpServerLogs(
  serverName: string,
  store: Pick<
    McpManagementStore,
    "getServerConfigs" | "getServerStatus" | "getServerLogs"
  >,
): ManagedMcpServerLogsResult {
  const server = getManagedMcpServerSummary(serverName, store)
  if (!server) {
    return {
      ...buildManagedMcpServerNotFound(serverName),
      logs: [],
    }
  }

  return {
    success: true,
    server,
    logs: store.getServerLogs(serverName),
  }
}
