import { beforeEach, describe, expect, it, vi } from "vitest"
import { container, ServiceTokens, MockPathResolver } from "@dotagents/core"

let currentConfig: any

const mockGetAvailableTools = vi.fn()
const mockTestServerConnection = vi.fn()

// Register a mock PathResolver before anything else runs
// This is needed because DiagnosticsService (from core) uses configStore which needs PathResolver
if (!container.has(ServiceTokens.PathResolver)) {
  const tmpDir = require("os").tmpdir()
  const path = require("path")
  container.register(ServiceTokens.PathResolver, new MockPathResolver(
    path.join(tmpDir, ".test-diagnostics"),
  ))
}

vi.mock("./mcp-service", () => ({
  mcpService: {
    getAvailableTools: mockGetAvailableTools,
    testServerConnection: mockTestServerConnection,
  },
}))

describe("diagnostics service", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    currentConfig = { mcpConfig: { mcpServers: {} } }

    // Patch the configStore that DiagnosticsService uses
    const core = await import("@dotagents/core")
    ;(core.configStore as any).config = currentConfig

    const { diagnosticsService } = await import("./diagnostics")
    diagnosticsService.clearErrorLog()
  })

  it("includes MCP tool counts and server status in diagnostic reports", async () => {
    currentConfig = {
      mcpConfig: { mcpServers: { local: { transportType: "stdio" } } },
    }

    const core = await import("@dotagents/core")
    ;(core.configStore as any).config = currentConfig

    mockGetAvailableTools.mockReturnValue([{ name: "tool-a" }, { name: "tool-b" }])
    mockTestServerConnection.mockResolvedValue({ success: true, toolCount: 2 })

    const { diagnosticsService } = await import("./diagnostics")
    const report = await diagnosticsService.generateDiagnosticReport()

    expect(report.config.mcpServersCount).toBe(1)
    expect(report.mcp.availableTools).toBe(2)
    expect(report.mcp.toolDiscoveryError).toBeUndefined()
    expect(report.mcp.serverStatus).toEqual({
      local: { connected: true, toolCount: 2 },
    })
  })

  it("returns a degraded report when MCP tool discovery throws", async () => {
    currentConfig = {
      mcpConfig: { mcpServers: { remote: { transportType: "streamable-http" } } },
    }

    const core = await import("@dotagents/core")
    ;(core.configStore as any).config = currentConfig

    mockGetAvailableTools.mockImplementation(() => {
      throw new Error("MCP registry unavailable")
    })
    mockTestServerConnection.mockResolvedValue({ success: false, toolCount: 0 })

    const { diagnosticsService } = await import("./diagnostics")
    const report = await diagnosticsService.generateDiagnosticReport()

    expect(report.mcp.availableTools).toBe(0)
    expect(report.mcp.toolDiscoveryError).toBe("MCP registry unavailable")
    expect(report.mcp.serverStatus).toEqual({
      remote: { connected: false, toolCount: 0 },
    })
  })
})
