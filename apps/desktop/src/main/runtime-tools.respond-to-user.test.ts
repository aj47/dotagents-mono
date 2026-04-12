import { beforeEach, describe, expect, it, vi } from "vitest"

const mockGetSession = vi.fn()
const mockGetAppSessionForAcpSession = vi.fn()
const mockAppendSessionUserResponse = vi.fn()
const mockGetSessionRunId = vi.fn()

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
  agentSessionStateManager: { getSessionRunId: mockGetSessionRunId },
  toolApprovalManager: {},
}))

vi.mock("./emergency-stop", () => ({ emergencyStopAll: vi.fn() }))
vi.mock("./acp/acp-router-tools", () => ({ executeACPRouterTool: vi.fn(), isACPRouterTool: vi.fn(() => false) }))
vi.mock("./message-queue-service", () => ({ messageQueueService: {} }))
vi.mock("./session-user-response-store", () => ({ appendSessionUserResponse: mockAppendSessionUserResponse }))
vi.mock("./conversation-service", () => ({ conversationService: {} }))
vi.mock("./context-budget", () => ({ readMoreContext: vi.fn() }))
vi.mock("./acp-session-state", () => ({
  getAppSessionForAcpSession: mockGetAppSessionForAcpSession,
  setAcpSessionTitleOverride: vi.fn(),
}))

describe("runtime-tools respond_to_user", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    mockGetAppSessionForAcpSession.mockReturnValue(undefined)
    mockGetSessionRunId.mockReturnValue(7)
    mockGetSession.mockImplementation((sessionId: string) =>
      sessionId === "app-session-1"
        ? { id: "app-session-1", conversationId: "conversation-1", conversationTitle: "Delegated session" }
        : undefined,
    )
  })

  it("stores delegated ACP responses against the mapped app session", async () => {
    mockGetAppSessionForAcpSession.mockReturnValue("app-session-1")

    const { executeRuntimeTool } = await import("./runtime-tools")
    const result = await executeRuntimeTool("respond_to_user", { text: "Hello from Augustus" }, "delegated-session-1")

    expect(mockGetAppSessionForAcpSession).toHaveBeenCalledWith("delegated-session-1")
    expect(mockGetSession).toHaveBeenCalledWith("app-session-1")
    expect(mockGetSessionRunId).toHaveBeenCalledWith("app-session-1")
    expect(mockAppendSessionUserResponse).toHaveBeenCalledWith({
      sessionId: "app-session-1",
      runId: 7,
      text: "Hello from Augustus",
    })
    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            message: "Response recorded for delivery to user.",
            textLength: 19,
            responseContentLength: 19,
            responseContentBytes: 19,
            imageCount: 0,
            localImageCount: 0,
            embeddedImageBytes: 0,
          }, null, 2),
        },
      ],
      isError: false,
    })
  })

  it("does not instruct the model to send another final response after mark_work_complete", async () => {
    const { executeRuntimeTool } = await import("./runtime-tools")
    const result = await executeRuntimeTool("mark_work_complete", { summary: "Done", confidence: 0.8 }, "app-session-1")

    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: true,
            markedComplete: true,
            summary: "Done",
            confidence: 0.8,
            message: "Completion signal recorded. The runtime will verify completion and finalize the turn without requiring another user-facing response.",
          }, null, 2),
        },
      ],
      isError: false,
    })
  })
})
