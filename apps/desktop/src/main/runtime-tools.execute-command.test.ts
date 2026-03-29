import { beforeEach, describe, expect, it, vi } from "vitest"

const mockGetSkill = vi.fn()
const mockGetSkills = vi.fn()

vi.mock("./mcp-service", () => ({
  mcpService: { getAvailableTools: vi.fn(() => []) },
}))

vi.mock("./agent-session-tracker", () => ({ agentSessionTracker: { getActiveSessions: vi.fn(() => []) } }))
vi.mock("./state", () => ({ agentSessionStateManager: { getSessionRunId: vi.fn(() => 1) }, toolApprovalManager: {} }))
vi.mock("./emergency-stop", () => ({ emergencyStopAll: vi.fn() }))
vi.mock("./acp/acp-router-tools", () => ({ executeACPRouterTool: vi.fn(), isACPRouterTool: vi.fn(() => false) }))
vi.mock("./message-queue-service", () => ({ messageQueueService: {} }))
vi.mock("./session-user-response-store", () => ({ appendSessionUserResponse: vi.fn() }))
vi.mock("./conversation-service", () => ({ conversationService: {} }))
vi.mock("./context-budget", () => ({ readMoreContext: vi.fn() }))
vi.mock("./acp-session-state", () => ({ getAppSessionForAcpSession: vi.fn(() => undefined) }))
vi.mock("./skills-service", () => ({
  skillsService: {
    getSkill: mockGetSkill,
    getSkills: mockGetSkills,
    upgradeGitHubSkillToLocal: vi.fn(),
  },
}))

describe("runtime-tools execute_command", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mockGetSkill.mockReturnValue(undefined)
    mockGetSkills.mockReturnValue([{ id: "agent-skill-creation" }, { id: "frontend-design" }])
  })

  it("returns corrective guidance when skillId is not an exact loaded skill id", async () => {
    const { executeRuntimeTool } = await import("./runtime-tools")
    const result = await executeRuntimeTool("execute_command", {
      command: "pwd && ls -la",
      skillId: "aj47/dotagents-mono",
    })

    expect(result?.isError).toBe(true)
    const payload = JSON.parse(String(result?.content[0]?.text))
    expect(payload).toEqual(expect.objectContaining({
      success: false,
      error: "Invalid execute_command.skillId: aj47/dotagents-mono",
      retrySuggestion: expect.stringContaining("without skillId"),
      availableSkillIds: ["agent-skill-creation", "frontend-design"],
    }))
    expect(payload.guidance).toContain("Never use repo names")
  })
})