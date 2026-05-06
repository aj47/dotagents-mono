export type MCPTransportType = "stdio" | "websocket" | "streamableHttp"

export interface OAuthClientMetadata {
  client_name: string
  redirect_uris: string[]
  grant_types: string[]
  response_types: string[]
  scope?: string
  token_endpoint_auth_method?: string
}

export interface OAuthTokens {
  access_token: string
  token_type: string
  expires_in?: number
  refresh_token?: string
  scope?: string
  expires_at?: number
}

export interface OAuthServerMetadata {
  issuer: string
  authorization_endpoint: string
  token_endpoint: string
  registration_endpoint?: string
  jwks_uri?: string
  scopes_supported?: string[]
  response_types_supported?: string[]
  grant_types_supported?: string[]
  token_endpoint_auth_methods_supported?: string[]
  code_challenge_methods_supported?: string[]
}

export interface OAuthConfig {
  serverMetadata?: OAuthServerMetadata
  clientId?: string
  clientSecret?: string
  clientMetadata?: OAuthClientMetadata
  tokens?: OAuthTokens
  scope?: string
  useDiscovery?: boolean
  useDynamicRegistration?: boolean
  redirectUri?: string
  pendingAuth?: {
    codeVerifier: string
    state: string
  }
}

export interface MCPServerConfig {
  transport?: MCPTransportType
  command?: string
  args?: string[]
  env?: Record<string, string>
  url?: string
  headers?: Record<string, string>
  oauth?: OAuthConfig
  timeout?: number
  disabled?: boolean
}

export type MCPServerConfigLike = MCPServerConfig

export interface MCPConfig {
  mcpServers: Record<string, MCPServerConfig>
}

export type MCPConfigLike<TServerConfig extends MCPServerConfigLike = MCPServerConfigLike> = {
  mcpServers?: Record<string, TServerConfig>
}

export interface ServerLogEntry {
  timestamp: number
  message: string
}

export interface DetailedToolInfo {
  name: string
  description: string
  sourceKind: "mcp" | "runtime"
  sourceName: string
  sourceLabel: string
  serverName?: string
  enabled: boolean
  serverEnabled: boolean
  inputSchema: any
}

export function inferTransportType(config: MCPServerConfigLike): MCPTransportType {
  if (config.transport) return config.transport
  const normalizedUrl = config.url?.trim()
  if (!normalizedUrl) return "stdio"
  const lower = normalizedUrl.toLowerCase()
  if (lower.startsWith("ws://") || lower.startsWith("wss://")) return "websocket"
  return "streamableHttp"
}

export function normalizeMcpConfig<
  TServerConfig extends MCPServerConfigLike,
  TConfig extends MCPConfigLike<TServerConfig>,
>(mcpConfig: TConfig): {
  normalized: TConfig
  changed: boolean
} {
  let changed = false

  const normalizedServers = Object.fromEntries(
    Object.entries(mcpConfig.mcpServers || {}).map(([name, serverConfig]) => {
      const inferredTransport = inferTransportType(serverConfig)
      const serverChanged = serverConfig.transport !== inferredTransport
      const normalized = serverChanged
        ? { ...serverConfig, transport: inferredTransport }
        : serverConfig
      if (serverChanged) changed = true
      return [name, normalized]
    }),
  ) as TConfig["mcpServers"]

  return {
    normalized: {
      ...mcpConfig,
      mcpServers: normalizedServers,
    },
    changed,
  }
}
