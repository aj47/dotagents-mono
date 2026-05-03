import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

let currentConfig: any
let currentProfileEnabledRuntimeTools: string[] | undefined

const mockConfigSave = vi.fn()
const mockSaveCurrentMcpStateToProfile = vi.fn()
const mockExecuteRuntimeTool = vi.fn(async (name: string) => ({ content: [{ type: "text", text: `ran ${name}` }], isError: false }))

const runtimeTools = [
  { name: "mark_work_complete", description: "essential", inputSchema: {} },
  { name: "execute_command", description: "command", inputSchema: {} },
  { name: "load_skill_instructions", description: "skill", inputSchema: {} },
]

vi.mock("electron", () => ({ app: { getPath: vi.fn(() => "/tmp"), getAppPath: vi.fn(() => "/tmp/app"), getVersion: vi.fn(() => "0.0.0-test") }, dialog: { showMessageBox: vi.fn(async () => ({ response: 0 })) } }))
vi.mock("./config", () => ({ dataFolder: "/tmp/dotagents-test", configStore: { get: () => currentConfig, save: mockConfigSave } }))
vi.mock("./debug", () => ({ isDebugTools: () => false, logTools: vi.fn(), logMCP: vi.fn() }))
vi.mock("./diagnostics", () => ({ diagnosticsService: { logError: vi.fn(), logWarning: vi.fn(), logInfo: vi.fn() } }))
vi.mock("./state", () => ({ state: {}, agentProcessManager: {} }))
vi.mock("./oauth-client", () => ({ OAuthClient: class {} }))
vi.mock("./oauth-storage", () => ({ oauthStorage: {} }))
vi.mock("./mcp-elicitation", () => ({ requestElicitation: vi.fn(), handleElicitationComplete: vi.fn(), cancelAllElicitations: vi.fn() }))
vi.mock("./mcp-sampling", () => ({ requestSampling: vi.fn(), cancelAllSamplingRequests: vi.fn() }))
vi.mock("./langfuse-service", () => ({ isLangfuseEnabled: vi.fn(() => false), shouldRecordObservations: vi.fn(() => false), getActiveRunTrace: vi.fn(() => undefined), createToolSpan: vi.fn(), endToolSpan: vi.fn(), getAgentTrace: vi.fn(() => null) }))
vi.mock("./agent-profile-service", () => ({ agentProfileService: { getCurrentProfile: () => ({ id: "profile_1", toolConfig: { enabledRuntimeTools: currentProfileEnabledRuntimeTools } }), saveCurrentMcpStateToProfile: mockSaveCurrentMcpStateToProfile } }))
vi.mock("./runtime-tools", () => ({ runtimeTools, isRuntimeTool: (n: string) => runtimeTools.some((tool) => tool.name === n), executeRuntimeTool: mockExecuteRuntimeTool }))

const flushPromises = async (): Promise<void> => {
  await Promise.resolve(); await Promise.resolve()
}

describe("MCPService Option B (runtime tool allowlist)", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.resetModules()

    vi.clearAllMocks()

    currentProfileEnabledRuntimeTools = undefined
    currentConfig = {
      mcpRequireApprovalBeforeToolCall: false,
      mcpConfig: { mcpServers: {} },
      mcpRuntimeDisabledServers: [],
      mcpDisabledTools: [],
    }
  })

  afterEach(() => {
    vi.clearAllTimers(); vi.useRealTimers()
  })

  it("ignores runtime-tool entries in persisted mcpDisabledTools", async () => {
    currentConfig.mcpDisabledTools = ["execute_command", "server:external_tool"]
    const { mcpService } = await import("./mcp-service")
    expect(mcpService.getDisabledTools()).toEqual(["server:external_tool"])
  })

  it("applyProfileMcpConfig ignores runtime tools in disabledTools and persists only external", async () => {
    const { mcpService } = await import("./mcp-service")
    mockConfigSave.mockClear()

    mcpService.applyProfileMcpConfig(undefined, ["load_skill_instructions", "server:external_tool"], false, undefined, undefined)

    expect(mcpService.getDisabledTools()).toEqual(["server:external_tool"])
    expect(mockConfigSave).toHaveBeenCalledWith(
      expect.objectContaining({ mcpDisabledTools: ["server:external_tool"] }),
    )
  })

  it("getAvailableTools filters runtime tools by enabledRuntimeTools allowlist (essential always included)", async () => {
    const { mcpService } = await import("./mcp-service")

    mcpService.applyProfileMcpConfig(undefined, undefined, false, undefined, ["execute_command"])

    expect(mcpService.getAvailableTools().map((t) => t.name)).toEqual([
      "mark_work_complete",
      "execute_command",
    ])

    const detailed = mcpService.getDetailedToolList()
    expect(detailed.find((t) => t.name === "mark_work_complete")?.enabled).toBe(true)
    expect(detailed.find((t) => t.name === "execute_command")?.enabled).toBe(true)
    expect(detailed.find((t) => t.name === "load_skill_instructions")?.enabled).toBe(false)
    expect(detailed.find((t) => t.name === "execute_command")?.sourceKind).toBe("runtime")
    expect(detailed.find((t) => t.name === "execute_command")?.sourceLabel).toBe("DotAgents Runtime Tools")
    expect(detailed.find((t) => t.name === "execute_command")?.serverName).toBeUndefined()
  })

  it("setToolEnabled(runtime tool) updates allowlist and auto-saves to profile without touching mcpDisabledTools", async () => {
    const { mcpService } = await import("./mcp-service")
    mockConfigSave.mockClear()
    mockSaveCurrentMcpStateToProfile.mockClear()

    expect(mcpService.setToolEnabled("load_skill_instructions", false)).toBe(true)
    expect(mockConfigSave).not.toHaveBeenCalled()

    await flushPromises()
    expect(mockSaveCurrentMcpStateToProfile).toHaveBeenCalledTimes(1)
    const enabledRuntimeTools = mockSaveCurrentMcpStateToProfile.mock.calls[0][4] as string[]
    expect(enabledRuntimeTools.slice().sort()).toEqual([
      "execute_command",
      "mark_work_complete",
    ])
  })

  it("executeToolCall rejects disabled runtime tools but allows essential runtime tools", async () => {
    const { mcpService } = await import("./mcp-service")
    mockExecuteRuntimeTool.mockClear()

    mcpService.applyProfileMcpConfig(undefined, undefined, false, undefined, ["execute_command"])

    const denied = await mcpService.executeToolCall(
      { name: "load_skill_instructions", arguments: {} } as any,
      undefined,
      true,
    )
    expect(denied.isError).toBe(true)
    expect(mockExecuteRuntimeTool).not.toHaveBeenCalled()

    const ok = await mcpService.executeToolCall(
      { name: "mark_work_complete", arguments: {} } as any,
      undefined,
      true,
    )
    expect(ok.isError).toBe(false)
    expect(mockExecuteRuntimeTool).toHaveBeenCalledTimes(1)
  })
})

