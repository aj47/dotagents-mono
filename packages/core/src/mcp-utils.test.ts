import { describe, it, expect } from "vitest"
import { inferTransportType, normalizeMcpConfig, normalizeMcpServerConfig } from "./mcp-utils"
import type { MCPServerConfig, MCPConfig } from "./types"

describe("mcp-utils", () => {
  describe("inferTransportType", () => {
    it("returns explicit transport if set", () => {
      expect(inferTransportType({ transport: "websocket" })).toBe("websocket")
      expect(inferTransportType({ transport: "streamableHttp" })).toBe("streamableHttp")
      expect(inferTransportType({ transport: "stdio" })).toBe("stdio")
    })

    it("returns stdio when no url", () => {
      expect(inferTransportType({})).toBe("stdio")
      expect(inferTransportType({ command: "node server.js" })).toBe("stdio")
    })

    it("infers websocket from ws:// url", () => {
      expect(inferTransportType({ url: "ws://localhost:3000" })).toBe("websocket")
      expect(inferTransportType({ url: "wss://example.com/ws" })).toBe("websocket")
    })

    it("infers streamableHttp from http url", () => {
      expect(inferTransportType({ url: "https://example.com/mcp" })).toBe("streamableHttp")
      expect(inferTransportType({ url: "http://localhost:3000/api" })).toBe("streamableHttp")
    })
  })

  describe("normalizeMcpServerConfig", () => {
    it("returns unchanged when transport matches inferred", () => {
      const config: MCPServerConfig = { transport: "stdio", command: "node server.js" }
      const { normalized, changed } = normalizeMcpServerConfig(config)
      expect(changed).toBe(false)
      expect(normalized).toBe(config) // same reference
    })

    it("returns changed when transport differs from inferred", () => {
      const config: MCPServerConfig = { url: "wss://example.com" }
      const { normalized, changed } = normalizeMcpServerConfig(config)
      expect(changed).toBe(true)
      expect(normalized.transport).toBe("websocket")
    })
  })

  describe("normalizeMcpConfig", () => {
    it("normalizes all servers", () => {
      const config: MCPConfig = {
        mcpServers: {
          a: { url: "ws://localhost:3000" },
          b: { transport: "stdio", command: "node" },
        },
      }
      const { normalized, changed } = normalizeMcpConfig(config)
      expect(changed).toBe(true)
      expect(normalized.mcpServers.a.transport).toBe("websocket")
      expect(normalized.mcpServers.b.transport).toBe("stdio")
    })
  })
})
