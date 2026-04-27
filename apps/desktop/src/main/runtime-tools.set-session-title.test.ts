import { beforeEach, describe, expect, it, vi } from "vitest"

const mockRenameConversationTitle = vi.fn()
const mockGetSession = vi.fn()
const mockUpdateSession = vi.fn()
const mockGetRootAppSessionForAcpSession = vi.fn()
const mockSetAcpSessionTitleOverride = vi.fn()
const mockEmitAgentProgress = vi.fn()

vi.mock("./mcp-service", () => ({
  mcpService: { getAvailableTools: vi.fn(() => []) },
}))

vi.mock("./agent-session-tracker", () => ({
  agentSessionTracker: {
    getSession: mockGetSession,
    updateSession: mockUpdateSession,
    getActiveSessions: vi.fn(() => []),
  },
}))

vi.mock("./state", () => ({
  agentSessionStateManager: { getSessionRunId: vi.fn(() => 1) },
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

describe("runtime-tools set_session_title", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    mockGetRootAppSessionForAcpSession.mockReturnValue(undefined)
    mockEmitAgentProgress.mockResolvedValue(undefined)
    mockGetSession.mockImplementation((sessionId: string) =>
      sessionId === "app-session-1"
        ? { id: "app-session-1", conversationId: "conversation-1", conversationTitle: "Old title", status: "active" }
        : undefined,
    )
    mockRenameConversationTitle.mockResolvedValue({ id: "conversation-1", title: "Delegated title" })
  })

  it("updates the parent app session title when invoked from a delegated session", async () => {
    mockGetRootAppSessionForAcpSession.mockReturnValue("app-session-1")

    const { executeRuntimeTool } = await import("./runtime-tools")
    const result = await executeRuntimeTool("set_session_title", { title: "Delegated title" }, "delegated-session-1")

    expect(mockGetRootAppSessionForAcpSession).toHaveBeenCalledWith("delegated-session-1")
    expect(mockRenameConversationTitle).toHaveBeenCalledWith("conversation-1", "Delegated title")
    expect(mockUpdateSession).toHaveBeenCalledWith("app-session-1", { conversationTitle: "Delegated title" })
    expect(mockSetAcpSessionTitleOverride).toHaveBeenCalledWith("delegated-session-1", "Delegated title")
    expect(mockEmitAgentProgress).toHaveBeenCalledWith({
      sessionId: "delegated-session-1",
      parentSessionId: "app-session-1",
      runId: 1,
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
})
