import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

let currentConfig: any
let currentProfileEnabledBuiltinTools: string[] | undefined

const mockConfigSave = vi.fn()
const mockSaveCurrentMcpStateToProfile = vi.fn()
const mockExecuteBuiltinTool = vi.fn(async (name: string) => ({ content: [{ type: "text", text: `ran ${name}` }], isError: false }))

const builtinTools = [
  { name: "dotagents-builtin:mark_work_complete", description: "essential", inputSchema: {} },
  { name: "dotagents-builtin:save_memory", description: "save", inputSchema: {} },
  { name: "dotagents-builtin:list_memories", description: "list", inputSchema: {} },
]

vi.mock("electron", () => ({ app: { getPath: vi.fn(() => "/tmp"), getAppPath: vi.fn(() => "/tmp/app") }, dialog: { showMessageBox: vi.fn(async () => ({ response: 0 })) } }))
vi.mock("./config", () => ({ dataFolder: "/tmp/dotagents-test", configStore: { get: () => currentConfig, save: mockConfigSave } }))
vi.mock("./debug", () => ({ isDebugTools: () => false, logTools: vi.fn(), logMCP: vi.fn() }))
vi.mock("./diagnostics", () => ({ diagnosticsService: { logError: vi.fn(), logWarning: vi.fn(), logInfo: vi.fn() } }))
vi.mock("./state", () => ({ state: {}, agentProcessManager: {} }))
vi.mock("./oauth-client", () => ({ OAuthClient: class {} }))
vi.mock("./oauth-storage", () => ({ oauthStorage: {} }))
vi.mock("./mcp-elicitation", () => ({ requestElicitation: vi.fn(), handleElicitationComplete: vi.fn(), cancelAllElicitations: vi.fn() }))
vi.mock("./mcp-sampling", () => ({ requestSampling: vi.fn(), cancelAllSamplingRequests: vi.fn() }))
vi.mock("./langfuse-service", () => ({ isLangfuseEnabled: vi.fn(() => false), createToolSpan: vi.fn(), endToolSpan: vi.fn(), getAgentTrace: vi.fn(() => null) }))
vi.mock("./agent-profile-service", () => ({ agentProfileService: { getCurrentProfile: () => ({ id: "profile_1", toolConfig: { enabledBuiltinTools: currentProfileEnabledBuiltinTools } }), saveCurrentMcpStateToProfile: mockSaveCurrentMcpStateToProfile } }))
vi.mock("./builtin-tools", () => ({ BUILTIN_SERVER_NAME: "dotagents-builtin", builtinTools, isBuiltinTool: (n: string) => n.startsWith("dotagents-builtin:"), executeBuiltinTool: mockExecuteBuiltinTool }))

const flushPromises = async (): Promise<void> => {
  await Promise.resolve(); await Promise.resolve()
}

describe("MCPService Option B (builtin allowlist)", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.resetModules()

    vi.clearAllMocks()

    currentProfileEnabledBuiltinTools = undefined
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

  it("ignores built-in entries in persisted mcpDisabledTools", async () => {
    currentConfig.mcpDisabledTools = ["dotagents-builtin:save_memory", "server:external_tool"]
    const { mcpService } = await import("./mcp-service")
    expect(mcpService.getDisabledTools()).toEqual(["server:external_tool"])
  })

  it("applyProfileMcpConfig ignores builtins in disabledTools and persists only external", async () => {
    const { mcpService } = await import("./mcp-service")
    mockConfigSave.mockClear()

    mcpService.applyProfileMcpConfig(undefined, ["dotagents-builtin:list_memories", "server:external_tool"], false, undefined, undefined)

    expect(mcpService.getDisabledTools()).toEqual(["server:external_tool"])
    expect(mockConfigSave).toHaveBeenCalledWith(
      expect.objectContaining({ mcpDisabledTools: ["server:external_tool"] }),
    )
  })

  it("getAvailableTools filters builtin tools by enabledBuiltinTools allowlist (essential always included)", async () => {
    const { mcpService } = await import("./mcp-service")

    mcpService.applyProfileMcpConfig(undefined, undefined, false, undefined, ["dotagents-builtin:save_memory"])

    expect(mcpService.getAvailableTools().map((t) => t.name)).toEqual([
      "dotagents-builtin:mark_work_complete",
      "dotagents-builtin:save_memory",
    ])

    const detailed = mcpService.getDetailedToolList()
    expect(detailed.find((t) => t.name === "dotagents-builtin:mark_work_complete")?.enabled).toBe(true)
    expect(detailed.find((t) => t.name === "dotagents-builtin:save_memory")?.enabled).toBe(true)
    expect(detailed.find((t) => t.name === "dotagents-builtin:list_memories")?.enabled).toBe(false)
  })

  it("setToolEnabled(builtin) updates allowlist and auto-saves to profile without touching mcpDisabledTools", async () => {
    const { mcpService } = await import("./mcp-service")
    mockConfigSave.mockClear()
    mockSaveCurrentMcpStateToProfile.mockClear()

    expect(mcpService.setToolEnabled("dotagents-builtin:list_memories", false)).toBe(true)
    expect(mockConfigSave).not.toHaveBeenCalled()

    await flushPromises()
    expect(mockSaveCurrentMcpStateToProfile).toHaveBeenCalledTimes(1)
    const enabledBuiltinTools = mockSaveCurrentMcpStateToProfile.mock.calls[0][4] as string[]
    expect(enabledBuiltinTools).toEqual([
      "dotagents-builtin:mark_work_complete",
      "dotagents-builtin:save_memory",
    ])
  })

  it("executeToolCall rejects disabled builtins but allows essential builtins", async () => {
    const { mcpService } = await import("./mcp-service")
    mockExecuteBuiltinTool.mockClear()

    mcpService.applyProfileMcpConfig(undefined, undefined, false, undefined, ["dotagents-builtin:save_memory"])

    const denied = await mcpService.executeToolCall(
      { name: "dotagents-builtin:list_memories", arguments: {} } as any,
      undefined,
      true,
    )
    expect(denied.isError).toBe(true)
    expect(mockExecuteBuiltinTool).not.toHaveBeenCalled()

    const ok = await mcpService.executeToolCall(
      { name: "dotagents-builtin:mark_work_complete", arguments: {} } as any,
      undefined,
      true,
    )
    expect(ok.isError).toBe(false)
    expect(mockExecuteBuiltinTool).toHaveBeenCalledTimes(1)
  })

  it("strips github create_issue placeholder milestone and empty optional arrays before execution", async () => {
    const { mcpService } = await import("./mcp-service")
    const callTool = vi.fn(async () => ({ content: [{ type: "text", text: "created" }], isError: false }))

    ;(mcpService as any).clients.set("github", { callTool })
    ;(mcpService as any).availableTools = [
      {
        name: "github:create_issue",
        description: "Create a new issue in a GitHub repository",
        inputSchema: {
          type: "object",
          properties: {
            owner: { type: "string" },
            repo: { type: "string" },
            title: { type: "string" },
            body: { type: "string" },
            assignees: { type: "array" },
            milestone: { type: "number" },
            labels: { type: "array" },
          },
          required: ["owner", "repo", "title"],
        },
      },
    ]

    const result = await mcpService.executeToolCall(
      {
        name: "github:create_issue",
        arguments: {
          owner: "aj47",
          repo: "dotagents-mono",
          title: "Sessions tile can show duplicate maximize icons in some cases",
          body: "Observed from Langfuse trace replay.",
          assignees: [],
          milestone: 0,
          labels: [],
        },
      } as any,
      undefined,
      true,
    )

    expect(result.isError).toBe(false)
    expect(callTool).toHaveBeenCalledWith({
      name: "create_issue",
      arguments: {
        owner: "aj47",
        repo: "dotagents-mono",
        title: "Sessions tile can show duplicate maximize icons in some cases",
        body: "Observed from Langfuse trace replay.",
      },
    })
  })

  it("preserves legitimate github create_issue optional values on the same tool", async () => {
    const { mcpService } = await import("./mcp-service")
    const callTool = vi.fn(async () => ({ content: [{ type: "text", text: "created" }], isError: false }))

    ;(mcpService as any).clients.set("github", { callTool })
    ;(mcpService as any).availableTools = [
      {
        name: "github:create_issue",
        description: "Create a new issue in a GitHub repository",
        inputSchema: {
          type: "object",
          properties: {
            owner: { type: "string" },
            repo: { type: "string" },
            title: { type: "string" },
            body: { type: "string" },
            assignees: { type: "array" },
            milestone: { type: "number" },
            labels: { type: "array" },
          },
          required: ["owner", "repo", "title"],
        },
      },
    ]

    const result = await mcpService.executeToolCall(
      {
        name: "github:create_issue",
        arguments: {
          owner: "aj47",
          repo: "dotagents-mono",
          title: "Keep valid GitHub issue options intact",
          body: "Regression coverage for trace-backed placeholder sanitization.",
          assignees: ["aj47"],
          milestone: 12,
          labels: ["bug", "desktop"],
        },
      } as any,
      undefined,
      true,
    )

    expect(result.isError).toBe(false)
    expect(callTool).toHaveBeenCalledWith({
      name: "create_issue",
      arguments: {
        owner: "aj47",
        repo: "dotagents-mono",
        title: "Keep valid GitHub issue options intact",
        body: "Regression coverage for trace-backed placeholder sanitization.",
        assignees: ["aj47"],
        milestone: 12,
        labels: ["bug", "desktop"],
      },
    })
  })

  it("strips github list_issues empty since placeholder before execution", async () => {
    const { mcpService } = await import("./mcp-service")
    const callTool = vi.fn(async () => ({ content: [{ type: "text", text: "[]" }], isError: false }))

    ;(mcpService as any).clients.set("github", { callTool })
    ;(mcpService as any).availableTools = [
      {
        name: "github:list_issues",
        description: "List repository issues",
        inputSchema: {
          type: "object",
          properties: {
            owner: { type: "string" },
            repo: { type: "string" },
            state: { type: "string" },
            sort: { type: "string" },
            direction: { type: "string" },
            page: { type: "number" },
            per_page: { type: "number" },
            since: { type: "string" },
            labels: { type: "array" },
          },
          required: ["owner", "repo"],
        },
      },
    ]

    const result = await mcpService.executeToolCall(
      {
        name: "github:list_issues",
        arguments: {
          owner: "aj47",
          repo: "dotagents-mono",
          state: "open",
          sort: "updated",
          direction: "desc",
          page: 1,
          per_page: 30,
          labels: [],
          since: "",
        },
      } as any,
      undefined,
      true,
    )

    expect(result.isError).toBe(false)
    expect(callTool).toHaveBeenCalledWith({
      name: "list_issues",
      arguments: {
        owner: "aj47",
        repo: "dotagents-mono",
        state: "open",
        sort: "updated",
        direction: "desc",
        page: 1,
        per_page: 30,
        labels: [],
      },
    })
  })

  it("preserves legitimate github list_issues since values on the same tool", async () => {
    const { mcpService } = await import("./mcp-service")
    const callTool = vi.fn(async () => ({ content: [{ type: "text", text: "[]" }], isError: false }))

    ;(mcpService as any).clients.set("github", { callTool })
    ;(mcpService as any).availableTools = [
      {
        name: "github:list_issues",
        description: "List repository issues",
        inputSchema: {
          type: "object",
          properties: {
            owner: { type: "string" },
            repo: { type: "string" },
            state: { type: "string" },
            sort: { type: "string" },
            direction: { type: "string" },
            page: { type: "number" },
            per_page: { type: "number" },
            since: { type: "string" },
          },
          required: ["owner", "repo"],
        },
      },
    ]

    const result = await mcpService.executeToolCall(
      {
        name: "github:list_issues",
        arguments: {
          owner: "aj47",
          repo: "dotagents-mono",
          state: "open",
          sort: "updated",
          direction: "desc",
          page: 1,
          per_page: 100,
          since: "1970-01-01T00:00:00Z",
        },
      } as any,
      undefined,
      true,
    )

    expect(result.isError).toBe(false)
    expect(callTool).toHaveBeenCalledWith({
      name: "list_issues",
      arguments: {
        owner: "aj47",
        repo: "dotagents-mono",
        state: "open",
        sort: "updated",
        direction: "desc",
        page: 1,
        per_page: 100,
        since: "1970-01-01T00:00:00Z",
      },
    })
  })

  it("does not broadly prune empty optional values for unrelated tools", async () => {
    const { mcpService } = await import("./mcp-service")
    const callTool = vi.fn(async () => ({ content: [{ type: "text", text: "saved" }], isError: false }))

    ;(mcpService as any).clients.set("notes", { callTool })
    ;(mcpService as any).availableTools = [
      {
        name: "notes:save_draft",
        description: "Save a draft note",
        inputSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            body: { type: "string" },
            tags: { type: "array" },
            metadata: { type: "object" },
          },
          required: ["title"],
        },
      },
    ]

    const result = await mcpService.executeToolCall(
      {
        name: "notes:save_draft",
        arguments: {
          title: "Draft",
          body: "",
          tags: [],
          metadata: null,
        },
      } as any,
      undefined,
      true,
    )

    expect(result.isError).toBe(false)
    expect(callTool).toHaveBeenCalledWith({
      name: "save_draft",
      arguments: {
        title: "Draft",
        body: "",
        tags: [],
        metadata: null,
      },
    })
  })
})

