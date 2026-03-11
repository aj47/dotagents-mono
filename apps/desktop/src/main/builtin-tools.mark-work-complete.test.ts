import { beforeEach, describe, expect, it, vi } from "vitest"

const mockGetSessionUserResponse = vi.fn()

vi.mock("./config", () => ({ configStore: { get: vi.fn(), save: vi.fn() } }))
vi.mock("./agent-profile-service", () => ({ agentProfileService: {}, toolConfigToMcpServerConfig: vi.fn() }))
vi.mock("./mcp-service", () => ({ mcpService: {}, handleWhatsAppToggle: vi.fn() }))
vi.mock("./agent-session-tracker", () => ({ agentSessionTracker: { getActiveSessions: vi.fn(() => []) } }))
vi.mock("./state", () => ({ agentSessionStateManager: {}, toolApprovalManager: {} }))
vi.mock("./emergency-stop", () => ({ emergencyStopAll: vi.fn() }))
vi.mock("./acp/acp-router-tools", () => ({ executeACPRouterTool: vi.fn(), isACPRouterTool: vi.fn(() => false) }))
vi.mock("./memory-service", () => ({ memoryService: {} }))
vi.mock("./message-queue-service", () => ({ messageQueueService: {} }))
vi.mock("./session-user-response-store", () => ({
  setSessionUserResponse: vi.fn(),
  getSessionUserResponse: mockGetSessionUserResponse,
}))
vi.mock("child_process", () => ({ exec: vi.fn() }))

function parseTextResult(result: Awaited<ReturnType<typeof import("./builtin-tools")["executeBuiltinTool"]>>) {
  expect(result).not.toBeNull()
  expect(result?.content[0]?.type).toBe("text")
  return JSON.parse((result?.content[0] as { text: string }).text)
}

describe("builtin mark_work_complete", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mockGetSessionUserResponse.mockReturnValue(undefined)
  })

  it("tells the agent to stop when a final user response is already recorded", async () => {
    mockGetSessionUserResponse.mockReturnValue("Done — triaged 10 unread unlabeled emails.")

    const { executeBuiltinTool } = await import("./builtin-tools")
    const result = await executeBuiltinTool(
      "mark_work_complete",
      { summary: "Triaged 10 unread unlabeled emails.", confidence: 0.96 },
      "session-1",
    )

    expect(result?.isError).toBe(false)

    const payload = parseTextResult(result)
    expect(payload.markedComplete).toBe(true)
    expect(payload.message).toContain("already stored")
    expect(payload.message).toContain("stop here")
  })

  it("tells the agent to call respond_to_user when no final response exists yet", async () => {
    const { executeBuiltinTool } = await import("./builtin-tools")
    const result = await executeBuiltinTool(
      "mark_work_complete",
      { summary: "Triaged 10 unread unlabeled emails.", confidence: 0.96 },
      "session-1",
    )

    expect(result?.isError).toBe(false)

    const payload = parseTextResult(result)
    expect(payload.markedComplete).toBe(true)
    expect(payload.message).toContain("respond_to_user")
    expect(payload.message).toContain("then stop")
  })
})