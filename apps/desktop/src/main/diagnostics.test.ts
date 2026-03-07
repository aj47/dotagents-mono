import { beforeEach, describe, expect, it, vi } from "vitest"

let currentConfig: any

const mockGetAvailableTools = vi.fn()
const mockTestServerConnection = vi.fn()

vi.mock("./config", () => ({
  configStore: {
    get: () => currentConfig,
  },
}))

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

    const { diagnosticsService } = await import("./diagnostics")
    diagnosticsService.clearErrorLog()
  })

  it("includes MCP tool counts and server status in diagnostic reports", async () => {
    currentConfig = {
      mcpConfig: { mcpServers: { local: { transportType: "stdio" } } },
    }
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