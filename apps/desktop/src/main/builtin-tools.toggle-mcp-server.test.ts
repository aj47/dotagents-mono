import { beforeEach, describe, expect, it, vi } from "vitest"

let currentConfig: any

const mockConfigSave = vi.fn()
const mockRestartServer = vi.fn()
const mockStopServer = vi.fn()
const mockGetServerStatus = vi.fn()

vi.mock("./config", () => ({
  configStore: {
    get: () => currentConfig,
    save: mockConfigSave,
  },
}))

vi.mock("./agent-profile-service", () => ({
  agentProfileService: {},
  toolConfigToMcpServerConfig: vi.fn(),
}))

vi.mock("./mcp-service", () => ({
  mcpService: {
    getServerStatus: mockGetServerStatus,
    restartServer: mockRestartServer,
    stopServer: mockStopServer,
  },
  handleWhatsAppToggle: vi.fn(),
}))

vi.mock("./agent-session-tracker", () => ({ agentSessionTracker: { getActiveSessions: vi.fn(() => []) } }))
vi.mock("./state", () => ({ agentSessionStateManager: {}, toolApprovalManager: {} }))
vi.mock("./emergency-stop", () => ({ emergencyStopAll: vi.fn() }))
vi.mock("./acp/acp-router-tools", () => ({ executeACPRouterTool: vi.fn(), isACPRouterTool: vi.fn(() => false) }))
vi.mock("./memory-service", () => ({ memoryService: {} }))
vi.mock("./message-queue-service", () => ({ messageQueueService: {} }))
vi.mock("./session-user-response-store", () => ({ setSessionUserResponse: vi.fn() }))

function parseTextResult(result: Awaited<ReturnType<typeof import("./builtin-tools")["executeBuiltinTool"]>>) {
  expect(result).not.toBeNull()
  expect(result?.content[0]?.type).toBe("text")
  return JSON.parse((result?.content[0] as { text: string }).text)
}

describe("builtin toggle_mcp_server", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    currentConfig = {
      mcpConfig: {
        mcpServers: {
          "auggie mcp": { command: "npx", args: ["auggie"] },
        },
      },
      mcpRuntimeDisabledServers: [],
    }

    mockRestartServer.mockResolvedValue({ success: true })
    mockStopServer.mockResolvedValue({ success: true })
    mockGetServerStatus.mockReturnValueOnce({
      "auggie mcp": { connected: false, toolCount: 0 },
    })
    mockGetServerStatus.mockReturnValue({
      "auggie mcp": { connected: true, toolCount: 3 },
    })
  })

  it("restarts an enabled disconnected server immediately", async () => {
    const { executeBuiltinTool } = await import("./builtin-tools")

    const result = await executeBuiltinTool("toggle_mcp_server", {
      serverName: "auggie mcp",
      enabled: true,
    })

    expect(mockConfigSave).toHaveBeenCalledWith({
      ...currentConfig,
      mcpRuntimeDisabledServers: [],
    })
    expect(mockRestartServer).toHaveBeenCalledWith("auggie mcp")
    expect(mockStopServer).not.toHaveBeenCalled()

    const payload = parseTextResult(result)
    expect(payload.success).toBe(true)
    expect(payload.connected).toBe(true)
    expect(payload.runtimeAction).toBe("restarted")
    expect(payload.message).toContain("Restarted immediately and the server is now connected")
  })

  it("stops a server immediately when disabling it", async () => {
    mockGetServerStatus.mockReset()
    mockGetServerStatus.mockReturnValue({
      "auggie mcp": { connected: true, toolCount: 3 },
    })

    const { executeBuiltinTool } = await import("./builtin-tools")

    const result = await executeBuiltinTool("toggle_mcp_server", {
      serverName: "auggie mcp",
      enabled: false,
    })

    expect(mockStopServer).toHaveBeenCalledWith("auggie mcp")
    expect(mockRestartServer).not.toHaveBeenCalled()

    const payload = parseTextResult(result)
    expect(payload.success).toBe(true)
    expect(payload.runtimeAction).toBe("stopped")
    expect(payload.message).toContain("Stopped immediately for the current session")
  })
})