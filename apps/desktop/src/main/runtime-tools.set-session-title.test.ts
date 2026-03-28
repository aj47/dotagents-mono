import { beforeEach, describe, expect, it, vi } from "vitest"

const mockRenameConversationTitleAndSyncSession = vi.fn()
const mockGetSession = vi.fn()
const mockGetAppSessionForAcpSession = vi.fn()

vi.mock("./mcp-service", () => ({
  mcpService: { getAvailableTools: vi.fn(() => []) },
}))

vi.mock("./agent-session-tracker", () => ({
  agentSessionTracker: {
    getSession: mockGetSession,
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
vi.mock("./conversation-management", () => ({
  renameConversationTitleAndSyncSession: mockRenameConversationTitleAndSyncSession,
}))
vi.mock("./context-budget", () => ({ readMoreContext: vi.fn() }))
vi.mock("./acp-session-state", () => ({ getAppSessionForAcpSession: mockGetAppSessionForAcpSession }))

describe("runtime-tools set_session_title", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    mockGetAppSessionForAcpSession.mockReturnValue(undefined)
    mockGetSession.mockImplementation((sessionId: string) =>
      sessionId === "app-session-1"
        ? { id: "app-session-1", conversationId: "conversation-1", conversationTitle: "Old title" }
        : undefined,
    )
    mockRenameConversationTitleAndSyncSession.mockResolvedValue({ id: "conversation-1", title: "Delegated title" })
  })

  it("updates the parent app session title when invoked from a delegated session", async () => {
    mockGetAppSessionForAcpSession.mockReturnValue("app-session-1")

    const { executeRuntimeTool } = await import("./runtime-tools")
    const result = await executeRuntimeTool("set_session_title", { title: "Delegated title" }, "delegated-session-1")

    expect(mockGetAppSessionForAcpSession).toHaveBeenCalledWith("delegated-session-1")
    expect(mockRenameConversationTitleAndSyncSession).toHaveBeenCalledWith("conversation-1", "Delegated title")
    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify({ success: true, title: "Delegated title" }, null, 2) }],
      isError: false,
    })
  })
})
