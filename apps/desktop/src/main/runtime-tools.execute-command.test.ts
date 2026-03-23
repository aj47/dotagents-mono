import { beforeEach, describe, expect, it, vi } from "vitest"

const mockRegisterProcess = vi.fn()

vi.mock("./mcp-service", () => ({
  mcpService: { getAvailableTools: vi.fn(() => []) },
}))

vi.mock("./agent-session-tracker", () => ({
  agentSessionTracker: {
    getSession: vi.fn(),
    updateSession: vi.fn(),
    getActiveSessions: vi.fn(() => []),
  },
}))

vi.mock("./state", () => ({
  agentSessionStateManager: {
    getSessionRunId: vi.fn(() => 1),
    registerProcess: mockRegisterProcess,
  },
  toolApprovalManager: {},
}))

vi.mock("./emergency-stop", () => ({ emergencyStopAll: vi.fn() }))
vi.mock("./acp/acp-router-tools", () => ({
  executeACPRouterTool: vi.fn(),
  isACPRouterTool: vi.fn(() => false),
}))
vi.mock("./message-queue-service", () => ({ messageQueueService: {} }))
vi.mock("./session-user-response-store", () => ({
  appendSessionUserResponse: vi.fn(),
}))
vi.mock("./conversation-service", () => ({
  conversationService: {
    renameConversationTitle: vi.fn(),
    addMessageToConversation: vi.fn(),
  },
}))
vi.mock("./context-budget", () => ({ readMoreContext: vi.fn() }))
vi.mock("./acp-session-state", () => ({ getAppSessionForAcpSession: vi.fn() }))
vi.mock("./skills-service", () => ({
  skillsService: {
    getSkill: vi.fn(),
    getSkills: vi.fn(() => []),
  },
}))

describe("runtime-tools execute_command", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it("registers the spawned shell process with the active session", async () => {
    const { executeRuntimeTool } = await import("./runtime-tools")
    const command = `${JSON.stringify(process.execPath)} -e "process.stdout.write(\\\"ready\\\")"`

    const result = await executeRuntimeTool(
      "execute_command",
      { command },
      "session-timeout-test",
    )

    expect(mockRegisterProcess).toHaveBeenCalledTimes(1)
    expect(mockRegisterProcess).toHaveBeenCalledWith(
      "session-timeout-test",
      expect.objectContaining({ pid: expect.any(Number) }),
    )

    expect(result?.isError).toBe(false)
    expect(JSON.parse(result!.content[0].text)).toMatchObject({
      success: true,
      command,
      stdout: "ready",
    })
  })
})
