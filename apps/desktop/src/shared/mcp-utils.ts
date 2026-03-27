import { MCPConfig, MCPServerConfig, MCPTransportType } from "./types"

export function inferTransportType(config: MCPServerConfig): MCPTransportType {
  if (config.transport) return config.transport
  const normalizedUrl = config.url?.trim()
  if (!normalizedUrl) return "stdio"
  const lower = normalizedUrl.toLowerCase()
  if (lower.startsWith("ws://") || lower.startsWith("wss://")) return "websocket"
  return "streamableHttp"
}

export function normalizeMcpConfig(mcpConfig: MCPConfig): {
  normalized: MCPConfig
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
  ) as MCPConfig["mcpServers"]

  return {
    normalized: {
      ...mcpConfig,
      mcpServers: normalizedServers,
    },
    changed,
  }
}
