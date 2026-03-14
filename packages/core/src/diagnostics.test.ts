import { beforeEach, describe, expect, it, vi } from "vitest"
import { DiagnosticsService, type DiagnosticsMcpProvider } from "./diagnostics"

let currentConfig: any

vi.mock("./config", () => ({
  configStore: {
    get: () => currentConfig,
  },
}))

describe("DiagnosticsService", () => {
  let service: DiagnosticsService

  beforeEach(() => {
    vi.clearAllMocks()
    currentConfig = { mcpConfig: { mcpServers: {} } }
    service = new DiagnosticsService()
    service.clearErrorLog()
  })

  it("includes MCP tool counts and server status in diagnostic reports", async () => {
    currentConfig = {
      mcpConfig: { mcpServers: { local: { transportType: "stdio" } } },
    }

    const mockProvider: DiagnosticsMcpProvider = {
      getAvailableTools: () => [{ name: "tool-a" }, { name: "tool-b" }],
      testServerConnection: vi.fn().mockResolvedValue({ success: true, toolCount: 2 }),
    }
    service.setMcpProvider(mockProvider)

    const report = await service.generateDiagnosticReport()

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

    const mockProvider: DiagnosticsMcpProvider = {
      getAvailableTools: () => {
        throw new Error("MCP registry unavailable")
      },
      testServerConnection: vi.fn().mockResolvedValue({ success: false, toolCount: 0 }),
    }
    service.setMcpProvider(mockProvider)

    const report = await service.generateDiagnosticReport()

    expect(report.mcp.availableTools).toBe(0)
    expect(report.mcp.toolDiscoveryError).toBe("MCP registry unavailable")
    expect(report.mcp.serverStatus).toEqual({
      remote: { connected: false, toolCount: 0 },
    })
  })

  it("works without MCP provider", async () => {
    // No provider set
    const report = await service.generateDiagnosticReport()

    expect(report.mcp.availableTools).toBe(0)
    expect(report.mcp.toolDiscoveryError).toBeUndefined()
    expect(report.mcp.serverStatus).toEqual({})
  })

  it("logs and retrieves errors", () => {
    service.logError("test", "Test error message")
    service.logWarning("test", "Test warning")
    service.logInfo("test", "Test info")

    const errors = service.getRecentErrors(10)
    expect(errors).toHaveLength(3)
    expect(errors[0].level).toBe("error")
    expect(errors[1].level).toBe("warning")
    expect(errors[2].level).toBe("info")
  })

  it("clears error log", () => {
    service.logError("test", "Error")
    service.clearErrorLog()
    const errors = service.getRecentErrors()
    expect(errors).toHaveLength(0)
  })

  it("performs health check", async () => {
    const mockProvider: DiagnosticsMcpProvider = {
      getAvailableTools: () => [{ name: "tool-a" }],
      testServerConnection: vi.fn(),
    }
    service.setMcpProvider(mockProvider)

    const result = await service.performHealthCheck()

    expect(result.overall).toBeDefined()
    expect(result.checks.mcpService).toBeDefined()
    expect(result.checks.mcpService.status).toBe("pass")
    expect(result.checks.recentErrors).toBeDefined()
    expect(result.checks.configuration).toBeDefined()
  })

  it("reports warning when MCP provider not set for health check", async () => {
    const result = await service.performHealthCheck()
    expect(result.checks.mcpService.status).toBe("warning")
    expect(result.checks.mcpService.message).toBe("MCP provider not configured")
  })

  it("includes system information in diagnostic report", async () => {
    const report = await service.generateDiagnosticReport()
    expect(report.system.platform).toBe(process.platform)
    expect(report.system.nodeVersion).toBe(process.version)
    expect(report.timestamp).toBeGreaterThan(0)
  })
})
