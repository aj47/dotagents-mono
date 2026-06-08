import { beforeEach, describe, expect, it, vi } from "vitest"

const mockRenameConversationTitle = vi.fn()
const mockGetSession = vi.fn()
const mockUpdateSession = vi.fn()
const mockFindSessionByConversationId = vi.fn()
const mockGetRootAppSessionForAcpSession = vi.fn()
const mockSetAcpSessionTitleOverride = vi.fn()
const mockEmitAgentProgress = vi.fn()
const mockGetSessionRunId = vi.fn()
const mockGetAlwaysOnSummaries = vi.fn()
const mockGetLoops = vi.fn()
const mockGetLoopStatuses = vi.fn()

vi.mock("./mcp-service", () => ({
  mcpService: { getAvailableTools: vi.fn(() => []) },
}))

vi.mock("./agent-session-tracker", () => ({
  agentSessionTracker: {
    getSession: mockGetSession,
    updateSession: mockUpdateSession,
    findSessionByConversationId: mockFindSessionByConversationId,
    getActiveSessions: vi.fn(() => []),
  },
}))

vi.mock("./state", () => ({
  agentSessionStateManager: { getSessionRunId: mockGetSessionRunId },
  toolApprovalManager: {},
}))

vi.mock("./emergency-stop", () => ({ emergencyStopAll: vi.fn() }))
vi.mock("./acp/acp-router-tools", () => ({ executeACPRouterTool: vi.fn(), isACPRouterTool: vi.fn(() => false) }))
vi.mock("./message-queue-service", () => ({ messageQueueService: {} }))
vi.mock("./session-user-response-store", () => ({ appendSessionUserResponse: vi.fn() }))
vi.mock("./conversation-service", () => ({ conversationService: { renameConversationTitle: mockRenameConversationTitle } }))
vi.mock("./context-budget", () => ({ readMoreContext: vi.fn() }))
vi.mock("./acp-session-state", () => ({
  getRootAppSessionForAcpSession: mockGetRootAppSessionForAcpSession,
  setAcpSessionTitleOverride: mockSetAcpSessionTitleOverride,
}))
vi.mock("./emit-agent-progress", () => ({ emitAgentProgress: mockEmitAgentProgress }))
vi.mock("./always-on-session-service", () => ({
  alwaysOnSessionService: {
    getSummaries: mockGetAlwaysOnSummaries,
    appendLog: vi.fn(),
    askQuestion: vi.fn(),
  },
}))
vi.mock("./loop-service", () => ({
  loopService: {
    getLoops: mockGetLoops,
    getLoopStatuses: mockGetLoopStatuses,
  },
}))

describe("runtime-tools set_session_title", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    mockGetRootAppSessionForAcpSession.mockReturnValue(undefined)
    mockGetAlwaysOnSummaries.mockReturnValue([])
    mockGetLoops.mockReturnValue([])
    mockGetLoopStatuses.mockReturnValue([])
    mockEmitAgentProgress.mockResolvedValue(undefined)
    mockGetSessionRunId.mockImplementation((sessionId: string) => {
      if (sessionId === "app-session-1") return 42
      return undefined
    })
    mockGetSession.mockImplementation((sessionId: string) =>
      sessionId === "app-session-1"
        ? { id: "app-session-1", conversationId: "conversation-1", conversationTitle: "Old title", status: "active" }
        : undefined,
    )
    mockFindSessionByConversationId.mockImplementation((conversationId: string) =>
      conversationId === "conversation-1" ? "app-session-1" : undefined,
    )
    mockRenameConversationTitle.mockResolvedValue({ id: "conversation-1", title: "Delegated title" })
  })

  it("updates the parent app session title when invoked from a delegated session", async () => {
    mockGetRootAppSessionForAcpSession.mockReturnValue("app-session-1")

    const { executeRuntimeTool } = await import("./runtime-tools")
    const result = await executeRuntimeTool("set_session_title", { title: "Delegated title" }, "delegated-session-1")

    expect(mockGetRootAppSessionForAcpSession).toHaveBeenCalledWith("delegated-session-1")
    expect(mockRenameConversationTitle).toHaveBeenCalledWith("conversation-1", "Delegated title", "server_generated")
    expect(mockUpdateSession).toHaveBeenCalledWith("app-session-1", { conversationTitle: "Delegated title" })
    expect(mockSetAcpSessionTitleOverride).toHaveBeenCalledWith("delegated-session-1", "Delegated title")
    expect(mockGetSessionRunId).toHaveBeenCalledWith("app-session-1")
    expect(mockEmitAgentProgress).toHaveBeenCalledWith({
      sessionId: "delegated-session-1",
      parentSessionId: "app-session-1",
      runId: 42,
      conversationTitle: "Delegated title",
      currentIteration: 0,
      maxIterations: 1,
      steps: [],
      isComplete: false,
      conversationState: "running",
    })
    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify({ success: true, title: "Delegated title" }, null, 2) }],
      isError: false,
    })
  })

  it("updates the tracked session when invoked with a conversation id context", async () => {
    const { executeRuntimeTool } = await import("./runtime-tools")
    const result = await executeRuntimeTool("set_session_title", { title: "Delegated title" }, "conversation-1")

    expect(mockFindSessionByConversationId).toHaveBeenCalledWith("conversation-1")
    expect(mockRenameConversationTitle).toHaveBeenCalledWith("conversation-1", "Delegated title", "server_generated")
    expect(mockUpdateSession).toHaveBeenCalledWith("app-session-1", { conversationTitle: "Delegated title" })
    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify({ success: true, title: "Delegated title" }, null, 2) }],
      isError: false,
    })
  })

  it("uses always-on session metadata when tracker linkage is missing", async () => {
    mockGetSession.mockReturnValue(undefined)
    mockFindSessionByConversationId.mockReturnValue(undefined)
    mockRenameConversationTitle.mockResolvedValueOnce({ id: "conversation-1", title: "Always-on title" })
    mockGetAlwaysOnSummaries.mockReturnValue([
      {
        id: "always-1",
        loopId: "loop-1",
        name: "Always-on",
        status: "running",
        enabled: true,
        isRunning: true,
        createdAt: 1,
        updatedAt: 2,
        currentSessionId: "session-1",
        conversationId: "conversation-1",
        logPath: "/tmp/attempts.jsonl",
        logCount: 0,
        pendingQuestionCount: 0,
        answeredQuestionCount: 0,
        questions: [],
      },
    ])

    const { executeRuntimeTool } = await import("./runtime-tools")
    const result = await executeRuntimeTool("set_session_title", { title: "Always-on title" }, "session-1")

    expect(mockRenameConversationTitle).toHaveBeenCalledWith("conversation-1", "Always-on title", "server_generated")
    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify({ success: true, title: "Always-on title" }, null, 2) }],
      isError: false,
    })
  })

  it("preserves terminal completion state for delegated title updates", async () => {
    mockGetRootAppSessionForAcpSession.mockReturnValue("app-session-1")
    mockGetSession.mockImplementation((sessionId: string) =>
      sessionId === "app-session-1"
        ? { id: "app-session-1", conversationId: "conversation-1", conversationTitle: "Old title", status: "completed" }
        : undefined,
    )

    const { executeRuntimeTool } = await import("./runtime-tools")
    await executeRuntimeTool("set_session_title", { title: "Delegated title" }, "delegated-session-1")

    expect(mockEmitAgentProgress).toHaveBeenCalledWith(expect.objectContaining({
      sessionId: "delegated-session-1",
      parentSessionId: "app-session-1",
      conversationTitle: "Delegated title",
      isComplete: true,
      conversationState: "complete",
    }))
  })

  it("emits blocked conversation state for delegated title updates from stopped sessions", async () => {
    mockGetRootAppSessionForAcpSession.mockReturnValue("app-session-1")
    mockGetSession.mockImplementation((sessionId: string) =>
      sessionId === "app-session-1"
        ? { id: "app-session-1", conversationId: "conversation-1", conversationTitle: "Old title", status: "stopped" }
        : undefined,
    )

    const { executeRuntimeTool } = await import("./runtime-tools")
    await executeRuntimeTool("set_session_title", { title: "Delegated title" }, "delegated-session-1")

    expect(mockEmitAgentProgress).toHaveBeenCalledWith(expect.objectContaining({
      sessionId: "delegated-session-1",
      parentSessionId: "app-session-1",
      conversationTitle: "Delegated title",
      isComplete: true,
      conversationState: "blocked",
    }))
  })
})
