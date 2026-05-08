import { parseShellCommand } from "./shell-parse"

export type MCPTransportType = "stdio" | "websocket" | "streamableHttp"

export type McpTransportOption = {
  value: MCPTransportType
  label: string
}

export const MCP_TRANSPORT_OPTIONS: readonly McpTransportOption[] = [
  { value: "stdio", label: "stdio" },
  { value: "streamableHttp", label: "HTTP" },
  { value: "websocket", label: "websocket" },
]

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

export type McpServerConfigDraft = {
  name: string
  transport: MCPTransportType
  command: string
  args: string
  url: string
  env: string
  headers: string
  timeout: string
  disabled: boolean
  oauthEnabled: boolean
  oauthScope: string
  oauthClientId: string
  oauthUseDiscovery: boolean
  oauthUseDynamicRegistration: boolean
  oauthConfig?: OAuthConfig
}

export const EMPTY_MCP_SERVER_CONFIG_DRAFT: McpServerConfigDraft = {
  name: "",
  transport: "stdio",
  command: "",
  args: "",
  url: "",
  env: "",
  headers: "",
  timeout: "",
  disabled: false,
  oauthEnabled: false,
  oauthScope: "",
  oauthClientId: "",
  oauthUseDiscovery: true,
  oauthUseDynamicRegistration: true,
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

export type McpToolEnabledLike = {
  name: string
  enabled: boolean
}

export type McpSourceToolEnabledLike = McpToolEnabledLike & {
  sourceName: string
}

export function setMcpToolEnabledInList<TTool extends McpToolEnabledLike>(
  tools: readonly TTool[],
  toolName: string,
  enabled: boolean,
): TTool[] {
  return tools.map((tool) => (
    tool.name === toolName ? { ...tool, enabled } : tool
  ))
}

export function setMcpToolsEnabledByNameInList<TTool extends McpToolEnabledLike>(
  tools: readonly TTool[],
  toolNames: readonly string[],
  enabled: boolean,
): TTool[] {
  const toolNameSet = new Set(toolNames)
  return tools.map((tool) => (
    toolNameSet.has(tool.name) ? { ...tool, enabled } : tool
  ))
}

export function restoreMcpToolEnabledStatesInList<TTool extends McpToolEnabledLike>(
  tools: readonly TTool[],
  enabledByToolName: ReadonlyMap<string, boolean>,
): TTool[] {
  return tools.map((tool) => (
    enabledByToolName.has(tool.name)
      ? { ...tool, enabled: enabledByToolName.get(tool.name) ?? tool.enabled }
      : tool
  ))
}

export function setMcpSourceToolsEnabledInList<TTool extends McpSourceToolEnabledLike>(
  tools: readonly TTool[],
  sourceName: string,
  enabled: boolean,
): TTool[] {
  return tools.map((tool) => (
    tool.sourceName === sourceName ? { ...tool, enabled } : tool
  ))
}

export function countEnabledMcpTools(tools: readonly Pick<McpToolEnabledLike, "enabled">[]): number {
  return tools.filter((tool) => tool.enabled).length
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

export function normalizeMcpServerNameForComparison(serverName: string): string {
  return serverName.trim().toLowerCase()
}

export function isReservedMcpServerName(
  serverName: string,
  reservedServerNames: readonly string[],
): boolean {
  const normalizedServerName = normalizeMcpServerNameForComparison(serverName)
  return reservedServerNames.some(
    (reservedServerName) =>
      normalizeMcpServerNameForComparison(reservedServerName) === normalizedServerName,
  )
}

export type McpKeyValueDraftParseResult = {
  value: Record<string, string>
  error?: string
}

export type BuildMcpServerConfigFromDraftOptions = {
  mode?: "create" | "replace"
  existingServerNames?: readonly string[]
  reservedServerNames?: readonly string[]
  commandDraftMode?: "command-and-newline-args" | "shell-command"
  includeEmptyStdioArgs?: boolean
  includeRemoteEnv?: boolean
  headerTransports?: readonly MCPTransportType[]
}

export type BuildMcpServerConfigFromDraftResult =
  | { ok: true; name: string; config: MCPServerConfig }
  | { ok: false; error: string }

export function formatMcpKeyValueDraft(value?: Record<string, string>): string {
  if (!value) return ""
  return Object.entries(value)
    .map(([key, entryValue]) => `${key}=${entryValue}`)
    .join("\n")
}

export function parseMcpKeyValueDraft(text: string, label: string): McpKeyValueDraftParseResult {
  const value: Record<string, string> = {}
  for (const line of text.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const separatorIndex = trimmed.indexOf("=")
    if (separatorIndex <= 0) {
      return { value, error: `${label} entries must use KEY=value` }
    }
    const key = trimmed.slice(0, separatorIndex).trim()
    if (!key) {
      return { value, error: `${label} entries must include a key` }
    }
    value[key] = trimmed.slice(separatorIndex + 1).trim()
  }
  return { value }
}

export function buildMcpServerConfigFromDraft(
  draft: McpServerConfigDraft,
  options: BuildMcpServerConfigFromDraftOptions = {},
): BuildMcpServerConfigFromDraftResult {
  const name = draft.name.trim()
  if (!name) return { ok: false, error: "MCP server name is required" }

  if (isReservedMcpServerName(name, options.reservedServerNames ?? [])) {
    return { ok: false, error: `MCP server name "${name}" is reserved` }
  }

  const mode = options.mode ?? "create"
  const existingServerNames = options.existingServerNames ?? []
  if (mode === "create" && existingServerNames.includes(name)) {
    return { ok: false, error: `MCP server "${name}" already exists` }
  }

  const config: MCPServerConfig = {
    transport: draft.transport,
  }

  const commandDraftMode = options.commandDraftMode ?? "command-and-newline-args"
  const headerTransports = options.headerTransports ?? ["websocket", "streamableHttp"]

  if (draft.transport === "stdio") {
    const parsedShellCommand = commandDraftMode === "shell-command" ? parseShellCommand(draft.command.trim()) : null
    const command = parsedShellCommand?.command ?? draft.command.trim()
    if (!command) return { ok: false, error: "Command is required for stdio MCP servers" }
    config.command = command

    const args = parsedShellCommand
      ? parsedShellCommand.args
      : draft.args
          .split("\n")
          .map((arg) => arg.trim())
          .filter(Boolean)
    if (args.length > 0 || options.includeEmptyStdioArgs) config.args = args

    const envResult = parseMcpKeyValueDraft(draft.env, "Environment")
    if (envResult.error) return { ok: false, error: envResult.error }
    if (Object.keys(envResult.value).length > 0) config.env = envResult.value
  } else {
    const url = draft.url.trim()
    if (!url) return { ok: false, error: "URL is required for remote MCP servers" }
    try {
      new URL(url)
    } catch {
      return { ok: false, error: "MCP server URL is invalid" }
    }
    config.url = url

    if (options.includeRemoteEnv) {
      const envResult = parseMcpKeyValueDraft(draft.env, "Environment")
      if (envResult.error) return { ok: false, error: envResult.error }
      if (Object.keys(envResult.value).length > 0) config.env = envResult.value
    }

    const headersResult = parseMcpKeyValueDraft(draft.headers, "Header")
    if (headersResult.error) return { ok: false, error: headersResult.error }
    if (headerTransports.includes(draft.transport) && Object.keys(headersResult.value).length > 0) {
      config.headers = headersResult.value
    }

    if (draft.transport === "streamableHttp" && draft.oauthEnabled) {
      const scope = draft.oauthScope.trim()
      const clientId = draft.oauthClientId.trim()
      config.oauth = {
        ...(draft.oauthConfig ?? {}),
        ...(scope ? { scope } : {}),
        ...(clientId ? { clientId } : {}),
        useDiscovery: draft.oauthUseDiscovery,
        useDynamicRegistration: draft.oauthUseDynamicRegistration,
      }
    }
  }

  const timeout = draft.timeout.trim()
  if (timeout) {
    const parsedTimeout = Number(timeout)
    if (!Number.isFinite(parsedTimeout) || parsedTimeout <= 0) {
      return { ok: false, error: "Timeout must be a positive number" }
    }
    config.timeout = Math.floor(parsedTimeout)
  }

  if (draft.disabled) config.disabled = true

  return { ok: true, name, config }
}

export function upsertMcpServerConfig<
  TServerConfig extends MCPServerConfigLike,
  TConfig extends MCPConfigLike<TServerConfig>,
>(
  mcpConfig: TConfig,
  serverName: string,
  serverConfig: TServerConfig,
): TConfig {
  return {
    ...mcpConfig,
    mcpServers: {
      ...(mcpConfig.mcpServers || {}),
      [serverName]: serverConfig,
    },
  }
}

export function renameMcpServerConfig<
  TServerConfig extends MCPServerConfigLike,
  TConfig extends MCPConfigLike<TServerConfig>,
>(
  mcpConfig: TConfig,
  oldServerName: string,
  newServerName: string,
  serverConfig: TServerConfig,
): TConfig {
  const mcpServers = { ...(mcpConfig.mcpServers || {}) }
  if (oldServerName !== newServerName) {
    delete mcpServers[oldServerName]
  }
  mcpServers[newServerName] = serverConfig

  return {
    ...mcpConfig,
    mcpServers,
  }
}

export function removeMcpServerConfig<
  TServerConfig extends MCPServerConfigLike,
  TConfig extends MCPConfigLike<TServerConfig>,
>(
  mcpConfig: TConfig,
  serverName: string,
): TConfig {
  const mcpServers = { ...(mcpConfig.mcpServers || {}) }
  delete mcpServers[serverName]

  return {
    ...mcpConfig,
    mcpServers,
  }
}

export type MergeImportedMcpServersResult<
  TServerConfig extends MCPServerConfigLike,
  TConfig extends MCPConfigLike<TServerConfig>,
> = {
  config: TConfig
  importedCount: number
  skippedReservedServerNames: string[]
}

export function mergeImportedMcpServers<
  TServerConfig extends MCPServerConfigLike,
  TConfig extends MCPConfigLike<TServerConfig>,
>(
  currentConfig: TConfig,
  importedConfig: MCPConfigLike<TServerConfig>,
  options: { reservedServerNames?: readonly string[] } = {},
): MergeImportedMcpServersResult<TServerConfig, TConfig> {
  const reservedServerNames = options.reservedServerNames || []
  const importedServers = Object.entries(importedConfig.mcpServers || {})
  const allowedServers: Record<string, TServerConfig> = {}
  const skippedReservedServerNames: string[] = []

  for (const [serverName, serverConfig] of importedServers) {
    if (isReservedMcpServerName(serverName, reservedServerNames)) {
      skippedReservedServerNames.push(serverName)
    } else {
      allowedServers[serverName] = serverConfig
    }
  }

  return {
    config: {
      ...currentConfig,
      mcpServers: {
        ...(currentConfig.mcpServers || {}),
        ...allowedServers,
      },
    },
    importedCount: Object.keys(allowedServers).length,
    skippedReservedServerNames,
  }
}
