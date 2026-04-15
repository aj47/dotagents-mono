import { beforeEach, describe, expect, it, vi } from "vitest"

const mockGetSkill = vi.fn()
const mockGetSkills = vi.fn()
const mockGetAppSessionForAcpSession = vi.fn()

vi.mock("./mcp-service", () => ({
  mcpService: { getAvailableTools: vi.fn(() => []) },
}))

vi.mock("./agent-session-tracker", () => ({
  agentSessionTracker: { getSession: vi.fn(), getActiveSessions: vi.fn(() => []) },
}))

vi.mock("./state", () => ({
  agentSessionStateManager: { getSessionRunId: vi.fn(() => 1) },
  toolApprovalManager: {},
}))

vi.mock("./emergency-stop", () => ({ emergencyStopAll: vi.fn() }))
vi.mock("./acp/acp-router-tools", () => ({ executeACPRouterTool: vi.fn(), isACPRouterTool: vi.fn(() => false) }))
vi.mock("./message-queue-service", () => ({ messageQueueService: {} }))
vi.mock("./session-user-response-store", () => ({ appendSessionUserResponse: vi.fn() }))
vi.mock("./conversation-service", () => ({ conversationService: {} }))
vi.mock("./context-budget", () => ({ readMoreContext: vi.fn() }))
vi.mock("./acp-session-state", () => ({
  getAppSessionForAcpSession: mockGetAppSessionForAcpSession,
  setAcpSessionTitleOverride: vi.fn(),
}))
vi.mock("./skills-service", () => ({
  skillsService: {
    getSkill: mockGetSkill,
    getSkills: mockGetSkills,
    upgradeGitHubSkillToLocal: vi.fn(),
  },
}))

describe("runtime-tools load_skill_instructions", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mockGetAppSessionForAcpSession.mockImplementation((sessionId: string) => `app-${sessionId}`)
    mockGetSkill.mockImplementation((skillId: string) => {
      if (skillId === "video-editing") {
        return {
          id: "video-editing",
          name: "video-editing",
          description: "Video editing skill",
          instructions: "## Video Editing\nUse remotion best practices.",
        }
      }
      return undefined
    })
    mockGetSkills.mockReturnValue([
      {
        id: "video-editing",
        name: "video-editing",
        description: "Video editing skill",
        instructions: "## Video Editing\nUse remotion best practices.",
      },
    ])
  })

  it("returns a compact already-loaded response for repeated loads in the same session", async () => {
    const { executeRuntimeTool } = await import("./runtime-tools")

    const first = await executeRuntimeTool("load_skill_instructions", { skillId: "video-editing" }, "session-1")
    expect(first?.isError).toBe(false)
    expect(String(first?.content?.[0]?.text)).toContain("## Video Editing")

    const second = await executeRuntimeTool("load_skill_instructions", { skillId: "video-editing" }, "session-1")
    expect(second?.isError).toBe(false)
    expect(String(second?.content?.[0]?.text)).toContain("Skill already loaded in this session")
    expect(String(second?.content?.[0]?.text)).toContain("\"forceReload\": true")
  })

  it("reloads full instructions when forceReload is true", async () => {
    const { executeRuntimeTool } = await import("./runtime-tools")

    await executeRuntimeTool("load_skill_instructions", { skillId: "video-editing" }, "session-2")
    const reloaded = await executeRuntimeTool(
      "load_skill_instructions",
      { skillId: "video-editing", forceReload: true, reason: "Need the full rules again after scope changed" },
      "session-2",
    )

    expect(reloaded?.isError).toBe(false)
    expect(String(reloaded?.content?.[0]?.text)).toContain("## Video Editing")
    expect(String(reloaded?.content?.[0]?.text)).not.toContain("Skill already loaded in this session")
  })

  it("requires a reason before force reloading an already loaded skill", async () => {
    const { executeRuntimeTool } = await import("./runtime-tools")

    await executeRuntimeTool("load_skill_instructions", { skillId: "video-editing" }, "session-5")
    const blockedReload = await executeRuntimeTool(
      "load_skill_instructions",
      { skillId: "video-editing", forceReload: true },
      "session-5",
    )

    expect(blockedReload?.isError).toBe(false)
    expect(String(blockedReload?.content?.[0]?.text)).toContain("pass both {\"forceReload\": true} and a short {\"reason\": \"...\"}")
  })

  it("keeps skill load state isolated per session", async () => {
    const { executeRuntimeTool } = await import("./runtime-tools")

    await executeRuntimeTool("load_skill_instructions", { skillId: "video-editing" }, "session-3")
    const otherSessionLoad = await executeRuntimeTool("load_skill_instructions", { skillId: "video-editing" }, "session-4")

    expect(otherSessionLoad?.isError).toBe(false)
    expect(String(otherSessionLoad?.content?.[0]?.text)).toContain("## Video Editing")
    expect(String(otherSessionLoad?.content?.[0]?.text)).not.toContain("Skill already loaded in this session")
  })
})
