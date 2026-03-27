import { beforeEach, describe, expect, it, vi } from "vitest"

let sessionUpdateHandler: ((event: any) => void) | undefined
const mockGetByName = vi.fn((): any => undefined)
const mockGetById = vi.fn((): any => undefined)
const mockGetSessionProfileSnapshot = vi.fn((): any => undefined)

const mockAcpService = {
  on: vi.fn((eventName: string, handler: (event: any) => void) => {
    if (eventName === "sessionUpdate") {
      sessionUpdateHandler = handler
    }
  }),
  spawnAgent: vi.fn(async () => ({ reusedExistingProcess: true })),
  getOrCreateSession: vi.fn(async () => "acp-session-1"),
  getAgentSessionId: vi.fn(() => "acp-session-1"),
  sendPrompt: vi.fn(async () => {
    sessionUpdateHandler?.({
      agentName: "test-agent",
      sessionId: "acp-session-1",
      toolCall: {
        toolCallId: "tool-r1",
        title: "Tool: Respond to User",
        status: "completed",
        rawInput: { text: "Final user-facing answer" },
        rawOutput: { success: true },
      },
      isComplete: false,
      totalBlocks: 0,
    })

    return {
      success: true,
      response: "Internal trailing completion text",
    }
  }),
}

const mockSetAcpToAppSessionMapping = vi.fn()

vi.mock("../acp-service", () => ({
  acpService: mockAcpService,
}))

vi.mock("./acp-background-notifier", () => ({
  acpBackgroundNotifier: {
    setDelegatedRunsMap: vi.fn(),
    resumeParentSessionIfNeeded: vi.fn(() => Promise.resolve()),
  },
}))

vi.mock("../config", () => ({
  configStore: {
    get: vi.fn(() => ({
      acpAgents: [{
        name: "test-agent",
        enabled: true,
        connection: { type: "stdio" },
      }],
    })),
  },
}))

vi.mock("../emit-agent-progress", () => ({
  emitAgentProgress: vi.fn(() => Promise.resolve()),
}))

vi.mock("../state", () => ({
  agentSessionStateManager: {
    getSessionRunId: vi.fn(() => 7),
    getSessionProfileSnapshot: mockGetSessionProfileSnapshot,
  },
}))

vi.mock("../acp-session-state", () => ({
  setAcpToAppSessionMapping: mockSetAcpToAppSessionMapping,
  clearAcpToAppSessionMapping: vi.fn(),
}))

vi.mock("../agent-profile-service", () => ({
  agentProfileService: {
    getByName: mockGetByName,
    getById: mockGetById,
    getAll: vi.fn(() => []),
  },
}))

vi.mock("./internal-agent", () => ({
  runInternalSubSession: vi.fn(),
  cancelSubSession: vi.fn(),
  getInternalAgentInfo: vi.fn(() => ({
    name: "internal",
    displayName: "Internal",
    description: "Internal agent",
    maxRecursionDepth: 3,
    maxConcurrent: 5,
  })),
  getSessionDepth: vi.fn(() => 0),
  generateSubSessionId: vi.fn(() => "subsession-test"),
}))

describe("handleDelegateToAgent", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    sessionUpdateHandler = undefined
    mockGetByName.mockReturnValue(undefined)
    mockGetById.mockReturnValue(undefined)
    mockGetSessionProfileSnapshot.mockReturnValue(undefined)
  })

  it("prefers ACP respond_to_user tool-call content over trailing plain text", async () => {
    const { handleDelegateToAgent } = await import("./acp-router-tools")

    const result = await handleDelegateToAgent({
      agentName: "test-agent",
      task: "Say hello",
      waitForResult: true,
    }, "parent-session-1") as any

    expect(result).toEqual(expect.objectContaining({
      success: true,
      status: "completed",
      output: "Final user-facing answer",
    }))

    expect(result.conversation).toEqual(expect.arrayContaining([
      expect.objectContaining({
        role: "tool",
        toolName: "respond_to_user",
        content: "Final user-facing answer",
      }),
    ]))
  })

  it("links delegated ACP sessions back to the parent app session", async () => {
    const { handleDelegateToAgent } = await import("./acp-router-tools")

    await handleDelegateToAgent({
      agentName: "test-agent",
      task: "Rename the session",
      waitForResult: true,
    }, "parent-session-1")

    expect(mockAcpService.getOrCreateSession).toHaveBeenCalledWith(
      "test-agent",
      false,
      undefined,
      { appSessionId: "parent-session-1" },
    )
    expect(mockSetAcpToAppSessionMapping).toHaveBeenCalledWith("acp-session-1", "parent-session-1", 7)
  })

  it("blocks main-agent delegation for local workspace coding tasks", async () => {
    mockGetSessionProfileSnapshot.mockReturnValue({
      profileId: "profile-main-agent",
      profileName: "Main Agent",
      guidelines: "",
    })

    mockGetById.mockReturnValue({
      id: "profile-main-agent",
      name: "main-agent",
      displayName: "Main Agent",
    })

    mockGetByName.mockReturnValue({
      id: "augustus-profile",
      name: "augustus",
      displayName: "augustus",
      enabled: true,
      connection: { type: "stdio" },
      createdAt: 0,
      updatedAt: 0,
    })

    const { handleDelegateToAgent } = await import("./acp-router-tools")

    const result = await handleDelegateToAgent({
      agentName: "augustus",
      task: "Find and fix a bug in the mobile app at /Users/ajjoobandi/.codex/worktrees/23f7/dotagents-mono. Inspect the codebase and fix it.",
    }, "parent-session-1") as any

    expect(result).toEqual(expect.objectContaining({
      success: false,
    }))
    expect(result.error).toContain("Main Agent should handle local repo/workspace coding or debugging directly")
    expect(mockAcpService.spawnAgent).not.toHaveBeenCalled()
  })

  it("allows explicit user requests for a specific specialist agent", async () => {
    mockGetSessionProfileSnapshot.mockReturnValue({
      profileId: "profile-main-agent",
      profileName: "Main Agent",
      guidelines: "",
    })

    mockGetById.mockReturnValue({
      id: "profile-main-agent",
      name: "main-agent",
      displayName: "Main Agent",
    })

    mockGetByName.mockReturnValue({
      id: "augustus-profile",
      name: "augustus",
      displayName: "augustus",
      enabled: true,
      connection: { type: "stdio" },
      createdAt: 0,
      updatedAt: 0,
    })

    const { handleDelegateToAgent } = await import("./acp-router-tools")

    const result = await handleDelegateToAgent({
      agentName: "augustus",
      task: "Use augustus to debug /Users/ajjoobandi/.codex/worktrees/23f7/dotagents-mono/apps/mobile and report back.",
      waitForResult: true,
    }, "parent-session-1") as any

    expect(result).toEqual(expect.objectContaining({
      success: true,
      status: "completed",
      output: "Final user-facing answer",
    }))
    expect(mockAcpService.spawnAgent).toHaveBeenCalledWith("augustus", {
      workingDirectory: undefined,
    })
  })

  it("allows delegation for generic snippet tasks that only mention a file extension", async () => {
    mockGetSessionProfileSnapshot.mockReturnValue({
      profileId: "profile-main-agent",
      profileName: "Main Agent",
      guidelines: "",
    })

    mockGetById.mockReturnValue({
      id: "profile-main-agent",
      name: "main-agent",
      displayName: "Main Agent",
    })

    mockGetByName.mockReturnValue({
      id: "augustus-profile",
      name: "augustus",
      displayName: "augustus",
      enabled: true,
      connection: { type: "stdio" },
      createdAt: 0,
      updatedAt: 0,
    })

    const { handleDelegateToAgent } = await import("./acp-router-tools")

    const result = await handleDelegateToAgent({
      agentName: "augustus",
      task: "Debug this .ts snippet and tell me what is wrong.",
      waitForResult: true,
    }, "parent-session-1") as any

    expect(result).toEqual(expect.objectContaining({
      success: true,
      status: "completed",
      output: "Final user-facing answer",
    }))
    expect(mockAcpService.spawnAgent).toHaveBeenCalledWith("augustus", {
      workingDirectory: undefined,
    })
  })

  it("blocks local workspace delegation even when the main agent display name is customized", async () => {
    mockGetSessionProfileSnapshot.mockReturnValue({
      profileId: "profile-main-agent",
      profileName: "Pair Driver",
      guidelines: "",
    })

    mockGetById.mockReturnValue({
      id: "profile-main-agent",
      name: "main-agent",
      displayName: "Pair Driver",
    })

    mockGetByName.mockReturnValue({
      id: "augustus-profile",
      name: "augustus",
      displayName: "augustus",
      enabled: true,
      connection: { type: "stdio" },
      createdAt: 0,
      updatedAt: 0,
    })

    const { handleDelegateToAgent } = await import("./acp-router-tools")

    const result = await handleDelegateToAgent({
      agentName: "augustus",
      task: "Inspect /Users/dev/dotagents-mono/src/main.ts and fix the bug.",
    }, "parent-session-1") as any

    expect(result).toEqual(expect.objectContaining({ success: false }))
    expect(mockAcpService.spawnAgent).not.toHaveBeenCalled()
  })

  it("blocks local workspace coding tasks that use Linux home paths", async () => {
    mockGetSessionProfileSnapshot.mockReturnValue({
      profileId: "profile-main-agent",
      profileName: "Main Agent",
      guidelines: "",
    })

    mockGetById.mockReturnValue({
      id: "profile-main-agent",
      name: "main-agent",
      displayName: "Main Agent",
    })

    mockGetByName.mockReturnValue({
      id: "augustus-profile",
      name: "augustus",
      displayName: "augustus",
      enabled: true,
      connection: { type: "stdio" },
      createdAt: 0,
      updatedAt: 0,
    })

    const { handleDelegateToAgent } = await import("./acp-router-tools")

    const result = await handleDelegateToAgent({
      agentName: "augustus",
      task: "Debug /home/ubuntu/worktree/dotagents-mono/apps/mobile/src/app.tsx and fix the failure.",
    }, "parent-session-1") as any

    expect(result).toEqual(expect.objectContaining({ success: false }))
    expect(mockAcpService.spawnAgent).not.toHaveBeenCalled()
  })

  it("blocks local workspace coding tasks that use Windows-style relative paths", async () => {
    mockGetSessionProfileSnapshot.mockReturnValue({
      profileId: "profile-main-agent",
      profileName: "Main Agent",
      guidelines: "",
    })

    mockGetById.mockReturnValue({
      id: "profile-main-agent",
      name: "main-agent",
      displayName: "Main Agent",
    })

    mockGetByName.mockReturnValue({
      id: "augustus-profile",
      name: "augustus",
      displayName: "augustus",
      enabled: true,
      connection: { type: "stdio" },
      createdAt: 0,
      updatedAt: 0,
    })

    const { handleDelegateToAgent } = await import("./acp-router-tools")

    const result = await handleDelegateToAgent({
      agentName: "augustus",
      task: "Fix src\\main\\app.ts in the workspace before the release.",
    }, "parent-session-1") as any

    expect(result).toEqual(expect.objectContaining({ success: false }))
    expect(mockAcpService.spawnAgent).not.toHaveBeenCalled()
  })
})
