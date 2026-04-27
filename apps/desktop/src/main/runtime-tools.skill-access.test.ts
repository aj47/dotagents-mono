import { beforeEach, describe, expect, it, vi } from "vitest"

const mockGetSkill = vi.fn()
const mockGetSkills = vi.fn()
const mockRefreshFromDisk = vi.fn()
const mockGetSessionProfileSnapshot = vi.fn()
const mockGetTrackerSessionProfileSnapshot = vi.fn()
const mockGetCurrentProfile = vi.fn()

vi.mock("./mcp-service", () => ({
  mcpService: { getAvailableTools: vi.fn(() => []) },
}))
vi.mock("./agent-session-tracker", () => ({
  agentSessionTracker: {
    getActiveSessions: vi.fn(() => []),
    getSession: vi.fn(() => undefined),
    getSessionProfileSnapshot: mockGetTrackerSessionProfileSnapshot,
  },
}))
vi.mock("./state", () => ({
  agentSessionStateManager: {
    getSessionRunId: vi.fn(() => 1),
    getSessionProfileSnapshot: mockGetSessionProfileSnapshot,
  },
  toolApprovalManager: {},
}))
vi.mock("./emergency-stop", () => ({ emergencyStopAll: vi.fn() }))
vi.mock("./acp/acp-router-tools", () => ({ executeACPRouterTool: vi.fn(), isACPRouterTool: vi.fn(() => false) }))
vi.mock("./message-queue-service", () => ({ messageQueueService: {} }))
vi.mock("./session-user-response-store", () => ({ appendSessionUserResponse: vi.fn() }))
vi.mock("./conversation-service", () => ({ conversationService: {} }))
vi.mock("./context-budget", () => ({ readMoreContext: vi.fn() }))
vi.mock("./acp-session-state", () => ({
  getAppSessionForAcpSession: vi.fn(() => undefined),
  setAcpSessionTitleOverride: vi.fn(),
}))
vi.mock("./skills-service", () => ({
  skillsService: {
    getSkill: mockGetSkill,
    getSkills: mockGetSkills,
    refreshFromDisk: mockRefreshFromDisk,
    upgradeGitHubSkillToLocal: vi.fn(),
  },
}))
vi.mock("./agent-profile-service", () => ({
  agentProfileService: {
    getCurrentProfile: mockGetCurrentProfile,
  },
}))

describe("runtime-tools skill access", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mockGetSkill.mockReturnValue({
      id: "disabled-skill",
      name: "Disabled Skill",
      instructions: "secret instructions",
      filePath: "/tmp/disabled-skill/SKILL.md",
    })
    mockGetSkills.mockReturnValue([
      { id: "allowed-skill", name: "Allowed Skill", instructions: "allowed instructions" },
      { id: "disabled-skill", name: "Disabled Skill", instructions: "secret instructions" },
    ])
    mockRefreshFromDisk.mockReturnValue([
      { id: "allowed-skill", name: "Allowed Skill", instructions: "allowed instructions" },
      { id: "disabled-skill", name: "Disabled Skill", instructions: "secret instructions" },
    ])
    mockGetSessionProfileSnapshot.mockReturnValue({
      profileId: "main-agent",
      profileName: "Main Agent",
      guidelines: "",
      skillsConfig: { allSkillsDisabledByDefault: true, enabledSkillIds: ["allowed-skill"] },
    })
    mockGetTrackerSessionProfileSnapshot.mockReturnValue(undefined)
    mockGetCurrentProfile.mockReturnValue({
      id: "main-agent",
      name: "Main Agent",
      skillsConfig: { allSkillsDisabledByDefault: true, enabledSkillIds: ["allowed-skill"] },
    })
  })

  it("blocks loading instructions for a disabled skill id", async () => {
    const { executeRuntimeTool } = await import("./runtime-tools")
    const result = await executeRuntimeTool("load_skill_instructions", { skillId: "disabled-skill" }, "session-1")

    expect(result?.isError).toBe(true)
    const payload = JSON.parse(String(result?.content[0]?.text))
    expect(payload).toEqual(expect.objectContaining({ success: false, skillId: "disabled-skill" }))
    expect(payload.error).toContain("disabled for this agent")
  })

  it("blocks loading instructions for a disabled skill name fallback", async () => {
    mockGetSkill.mockReturnValue(undefined)

    const { executeRuntimeTool } = await import("./runtime-tools")
    const result = await executeRuntimeTool("load_skill_instructions", { skillId: "Disabled Skill" }, "session-1")

    expect(result?.isError).toBe(true)
    const payload = JSON.parse(String(result?.content[0]?.text))
    expect(payload.skillId).toBe("disabled-skill")
  })

  it("refreshes the skill registry before loading instructions", async () => {
    mockGetSessionProfileSnapshot.mockReturnValue({
      profileId: "main-agent",
      profileName: "Main Agent",
      guidelines: "",
      skillsConfig: { allSkillsDisabledByDefault: false },
    })
    mockGetSkill.mockReturnValue({
      id: "fresh-skill",
      name: "Fresh Skill",
      instructions: "fresh instructions",
      filePath: "/tmp/fresh-skill/skill.md",
    })

    const { executeRuntimeTool } = await import("./runtime-tools")
    const result = await executeRuntimeTool("load_skill_instructions", { skillId: "fresh-skill" }, "session-1")

    expect(mockRefreshFromDisk).toHaveBeenCalledTimes(1)
    expect(result?.isError).toBe(false)
    expect(String(result?.content[0]?.text)).toContain("fresh instructions")
  })

  it("blocks executing commands inside a disabled skill directory", async () => {
    const { executeRuntimeTool } = await import("./runtime-tools")
    const result = await executeRuntimeTool("execute_command", {
      command: "echo should-not-run",
      skillId: "disabled-skill",
    }, "session-1")

    expect(result?.isError).toBe(true)
    const payload = JSON.parse(String(result?.content[0]?.text))
    expect(payload).toEqual(expect.objectContaining({ success: false, skillId: "disabled-skill" }))
  })

  it("falls back to the current profile when loading a skill without a session id", async () => {
    const { executeRuntimeTool } = await import("./runtime-tools")
    const result = await executeRuntimeTool("load_skill_instructions", { skillId: "disabled-skill" })

    expect(result?.isError).toBe(true)
    const payload = JSON.parse(String(result?.content[0]?.text))
    expect(payload).toEqual(expect.objectContaining({ success: false, skillId: "disabled-skill" }))
    expect(mockGetSessionProfileSnapshot).not.toHaveBeenCalled()
    expect(mockGetTrackerSessionProfileSnapshot).not.toHaveBeenCalled()
    expect(mockGetCurrentProfile).toHaveBeenCalled()
  })

  it("falls back to the current profile when session snapshots are missing", async () => {
    mockGetSessionProfileSnapshot.mockReturnValue(undefined)

    const { executeRuntimeTool } = await import("./runtime-tools")
    const result = await executeRuntimeTool("load_skill_instructions", { skillId: "disabled-skill" }, "session-1")

    expect(result?.isError).toBe(true)
    const payload = JSON.parse(String(result?.content[0]?.text))
    expect(payload).toEqual(expect.objectContaining({ success: false, skillId: "disabled-skill" }))
    expect(mockGetSessionProfileSnapshot).toHaveBeenCalledWith("session-1")
    expect(mockGetTrackerSessionProfileSnapshot).toHaveBeenCalledWith("session-1")
    expect(mockGetCurrentProfile).toHaveBeenCalled()
  })

  it("fails closed when no current profile can be resolved", async () => {
    mockGetSessionProfileSnapshot.mockReturnValue(undefined)
    mockGetCurrentProfile.mockReturnValue(undefined)
    mockGetSkill.mockReturnValue({
      id: "allowed-skill",
      name: "Allowed Skill",
      instructions: "allowed instructions",
      filePath: "/tmp/allowed-skill/SKILL.md",
    })

    const { executeRuntimeTool } = await import("./runtime-tools")
    const result = await executeRuntimeTool("load_skill_instructions", { skillId: "allowed-skill" })

    expect(result?.isError).toBe(true)
    const payload = JSON.parse(String(result?.content[0]?.text))
    expect(payload).toEqual(expect.objectContaining({ success: false, skillId: "allowed-skill" }))
  })
})
