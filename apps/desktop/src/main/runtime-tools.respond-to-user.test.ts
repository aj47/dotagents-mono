import { beforeEach, describe, expect, it, vi } from "vitest"
import fs from "fs/promises"
import os from "os"
import path from "path"

const mockGetSession = vi.fn()
const mockGetAppSessionForAcpSession = vi.fn()
const mockGetRootAppSessionForAcpSession = vi.fn()
const mockAppendSessionUserResponse = vi.fn()
const mockGetSessionRunId = vi.fn()
const mockStoreDataImageUrlAsConversationAsset = vi.fn()
const mockStoreImagePathAsConversationAsset = vi.fn()

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
vi.mock("./conversation-service", () => ({
  conversationService: {
    storeDataImageUrlAsConversationAsset: mockStoreDataImageUrlAsConversationAsset,
    storeImagePathAsConversationAsset: mockStoreImagePathAsConversationAsset,
  },
}))
vi.mock("./context-budget", () => ({ readMoreContext: vi.fn() }))
vi.mock("./emit-agent-progress", () => ({ emitAgentProgress: vi.fn() }))
vi.mock("./acp-session-state", () => ({
  getAppSessionForAcpSession: mockGetAppSessionForAcpSession,
  getRootAppSessionForAcpSession: mockGetRootAppSessionForAcpSession,
  setAcpSessionTitleOverride: vi.fn(),
}))

describe("runtime-tools respond_to_user", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    mockGetAppSessionForAcpSession.mockReturnValue(undefined)
    mockGetRootAppSessionForAcpSession.mockReturnValue(undefined)
    mockGetSessionRunId.mockReturnValue(7)
    mockStoreDataImageUrlAsConversationAsset.mockImplementation(async (_conversationId: string, _url: string) => "assets://conversation-image/conversation-1/data.png")
    mockStoreImagePathAsConversationAsset.mockImplementation(async (_conversationId: string, _imagePath: string) => "assets://conversation-image/conversation-1/local.png")
    mockGetSession.mockImplementation((sessionId: string) =>
      sessionId === "app-session-1"
        ? { id: "app-session-1", conversationId: "conversation-1", conversationTitle: "Delegated session" }
        : undefined,
    )
  })

  it("stores delegated ACP responses against the mapped app session", async () => {
    mockGetRootAppSessionForAcpSession.mockReturnValue("app-session-1")

    const { executeRuntimeTool } = await import("./runtime-tools")
    const result = await executeRuntimeTool("respond_to_user", { text: "Hello from Augustus" }, "delegated-session-1")

    expect(mockGetRootAppSessionForAcpSession).toHaveBeenCalledWith("delegated-session-1")
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
            videoCount: 0,
            localImageCount: 0,
            localVideoCount: 0,
            embeddedImageBytes: 0,
            localVideoBytes: 0,
          }, null, 2),
        },
      ],
      isError: false,
    })
  })

  it("stores local image responses as lightweight conversation asset URLs", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "dotagents-respond-image-"))
    const imagePath = path.join(tempDir, "preview.png")
    await fs.writeFile(imagePath, Buffer.from([0x89, 0x50, 0x4e, 0x47]))

    const { executeRuntimeTool } = await import("./runtime-tools")
    const result = await executeRuntimeTool(
      "respond_to_user",
      { text: "Preview ready", images: [{ path: imagePath, alt: "Preview" }] },
      "app-session-1",
    )

    expect(mockStoreImagePathAsConversationAsset).toHaveBeenCalledWith("conversation-1", imagePath)
    expect(mockAppendSessionUserResponse).toHaveBeenCalledWith({
      sessionId: "app-session-1",
      runId: 7,
      text: "Preview ready\n\n![Preview](assets://conversation-image/conversation-1/local.png)",
    })
    expect(JSON.parse(String(result?.content[0]?.text))).toMatchObject({
      success: true,
      responseContentLength: 79,
      localImageCount: 1,
    })
  })

  it("rejects svg image paths before storing conversation assets", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "dotagents-respond-image-"))
    const imagePath = path.join(tempDir, "preview.svg")
    await fs.writeFile(imagePath, "<svg xmlns=\"http://www.w3.org/2000/svg\" />")

    const { executeRuntimeTool } = await import("./runtime-tools")
    const result = await executeRuntimeTool(
      "respond_to_user",
      { text: "Preview ready", images: [{ path: imagePath, alt: "Preview" }] },
      "app-session-1",
    )

    expect(mockStoreImagePathAsConversationAsset).not.toHaveBeenCalled()
    expect(mockAppendSessionUserResponse).not.toHaveBeenCalled()
    expect(JSON.parse(String(result?.content[0]?.text))).toMatchObject({
      success: false,
      error: expect.stringContaining("SVG images are not supported for conversation assets"),
    })
    expect(result?.isError).toBe(true)
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
