import { inferTransportType } from "../shared/mcp-utils"
import type { MCPServerConfig } from "../shared/types"

interface ManagedMcpOAuthSelectionCandidate {
  name: string
}

interface ManagedMcpOAuthStatus {
  configured: boolean
  authenticated: boolean
  tokenExpiry?: number
  error?: string
}

export interface ManagedMcpOAuthServerSummary extends ManagedMcpOAuthStatus {
  name: string
  url: string
  transport: "streamableHttp"
}

export interface ManagedMcpOAuthActionResult {
  success: boolean
  error?: string
  server?: ManagedMcpOAuthServerSummary
}

export interface ManagedMcpOAuthStartResult
  extends ManagedMcpOAuthActionResult {
  authorizationUrl?: string
  state?: string
}

export interface ResolvedManagedMcpOAuthSelection<
  T extends ManagedMcpOAuthSelectionCandidate,
> {
  selectedServer?: T
  ambiguousServers?: T[]
}

export interface McpOAuthManagementStore {
  getServerConfigs(): Record<string, MCPServerConfig>
  getOAuthStatus(serverName: string): Promise<ManagedMcpOAuthStatus>
  initiateOAuthFlow(
    serverName: string,
    options?: {
      openBrowser?: boolean
    },
  ): Promise<{ authorizationUrl: string; state: string }>
  completeOAuthFlow(
    serverName: string,
    code: string,
    state: string,
  ): Promise<{ success: boolean; error?: string }>
  revokeOAuthTokens(
    serverName: string,
  ): Promise<{ success: boolean; error?: string }>
}

function normalizeManagedMcpOAuthQuery(value: string): string {
  return value.trim().toLowerCase()
}

function getManagedMcpOAuthConfig(
  serverName: string,
  store: Pick<McpOAuthManagementStore, "getServerConfigs">,
): MCPServerConfig | undefined {
  return store.getServerConfigs()[serverName]
}

function getManagedMcpOAuthServerUrl(
  config: MCPServerConfig | undefined,
): string | undefined {
  const url = config?.url?.trim()
  return url ? url : undefined
}

function supportsManagedMcpOAuth(config: MCPServerConfig | undefined): boolean {
  return (
    !!getManagedMcpOAuthServerUrl(config) &&
    inferTransportType(config!) === "streamableHttp"
  )
}

function buildManagedMcpOAuthNotFoundError(serverName: string): string {
  return `MCP server '${serverName}' does not support OAuth management`
}

export async function getManagedMcpOAuthStatus(
  serverName: string,
  store: Pick<McpOAuthManagementStore, "getOAuthStatus">,
): Promise<ManagedMcpOAuthStatus> {
  return store.getOAuthStatus(serverName)
}

export async function getManagedMcpOAuthServers(
  store: Pick<McpOAuthManagementStore, "getServerConfigs" | "getOAuthStatus">,
): Promise<ManagedMcpOAuthServerSummary[]> {
  const entries = Object.entries(store.getServerConfigs())
    .filter(([, config]) => supportsManagedMcpOAuth(config))
    .sort(([left], [right]) => left.localeCompare(right))

  return Promise.all(
    entries.map(async ([serverName, config]) => ({
      name: serverName,
      url: getManagedMcpOAuthServerUrl(config)!,
      transport: "streamableHttp" as const,
      ...(await getManagedMcpOAuthStatus(serverName, store)),
    })),
  )
}

export async function getManagedMcpOAuthServer(
  serverName: string,
  store: Pick<McpOAuthManagementStore, "getServerConfigs" | "getOAuthStatus">,
): Promise<ManagedMcpOAuthServerSummary | undefined> {
  const config = getManagedMcpOAuthConfig(serverName, store)
  if (!supportsManagedMcpOAuth(config)) {
    return undefined
  }

  return {
    name: serverName,
    url: getManagedMcpOAuthServerUrl(config)!,
    transport: "streamableHttp",
    ...(await getManagedMcpOAuthStatus(serverName, store)),
  }
}

export function resolveManagedMcpOAuthServerSelection<
  T extends ManagedMcpOAuthSelectionCandidate,
>(
  servers: readonly T[],
  query: string,
): ResolvedManagedMcpOAuthSelection<T> {
  const normalizedQuery = normalizeManagedMcpOAuthQuery(query)
  if (!normalizedQuery) {
    return {}
  }

  const exactMatch = servers.find(
    (server) => normalizeManagedMcpOAuthQuery(server.name) === normalizedQuery,
  )
  if (exactMatch) {
    return { selectedServer: exactMatch }
  }

  const prefixMatches = servers.filter((server) =>
    normalizeManagedMcpOAuthQuery(server.name).startsWith(normalizedQuery),
  )

  if (prefixMatches.length === 1) {
    return { selectedServer: prefixMatches[0] }
  }

  if (prefixMatches.length > 1) {
    return { ambiguousServers: prefixMatches }
  }

  return {}
}

export async function startManagedMcpOAuthFlow(
  serverName: string,
  store: Pick<
    McpOAuthManagementStore,
    "getServerConfigs" | "getOAuthStatus" | "initiateOAuthFlow"
  >,
  options: {
    openBrowser?: boolean
  } = {},
): Promise<ManagedMcpOAuthStartResult> {
  const existingServer = await getManagedMcpOAuthServer(serverName, store)
  if (!existingServer) {
    return {
      success: false,
      error: buildManagedMcpOAuthNotFoundError(serverName),
    }
  }

  try {
    const result = await store.initiateOAuthFlow(serverName, options)
    return {
      success: true,
      server: (await getManagedMcpOAuthServer(serverName, store)) || existingServer,
      authorizationUrl: result.authorizationUrl,
      state: result.state,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      server: (await getManagedMcpOAuthServer(serverName, store)) || existingServer,
    }
  }
}

export async function completeManagedMcpOAuthFlow(
  serverName: string,
  code: string,
  state: string,
  store: Pick<
    McpOAuthManagementStore,
    "getServerConfigs" | "getOAuthStatus" | "completeOAuthFlow"
  >,
): Promise<ManagedMcpOAuthActionResult> {
  const existingServer = await getManagedMcpOAuthServer(serverName, store)
  if (!existingServer) {
    return {
      success: false,
      error: buildManagedMcpOAuthNotFoundError(serverName),
    }
  }

  const result = await store.completeOAuthFlow(serverName, code, state)
  return {
    success: result.success,
    error: result.error,
    server: (await getManagedMcpOAuthServer(serverName, store)) || existingServer,
  }
}

export async function revokeManagedMcpOAuthTokens(
  serverName: string,
  store: Pick<
    McpOAuthManagementStore,
    "getServerConfigs" | "getOAuthStatus" | "revokeOAuthTokens"
  >,
): Promise<ManagedMcpOAuthActionResult> {
  const existingServer = await getManagedMcpOAuthServer(serverName, store)
  if (!existingServer) {
    return {
      success: false,
      error: buildManagedMcpOAuthNotFoundError(serverName),
    }
  }

  const result = await store.revokeOAuthTokens(serverName)
  return {
    success: result.success,
    error: result.error,
    server: (await getManagedMcpOAuthServer(serverName, store)) || existingServer,
  }
}
