export type MCPTransportType = "stdio" | "websocket" | "streamableHttp"

export type MCPServerConfigLike = {
  transport?: MCPTransportType
  command?: string
  args?: string[]
  env?: Record<string, string>
  url?: string
  headers?: Record<string, string>
  timeout?: number
  disabled?: boolean
}

export type MCPConfigLike<TServerConfig extends MCPServerConfigLike = MCPServerConfigLike> = {
  mcpServers?: Record<string, TServerConfig>
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
