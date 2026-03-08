import { describe, it, expect, vi, beforeEach } from "vitest"

const mockGetByRole = vi.fn(() => [])
const mockGetCurrentProfile = vi.fn(() => undefined)

// Avoid pulling in real ACP/services (can have side effects / require Electron runtime)
vi.mock("./acp/acp-smart-router", () => ({
  acpSmartRouter: {
    generateDelegationPromptAddition: () => "",
  },
}))

vi.mock("./acp-service", () => ({
  acpService: {
    getAgents: () => [],
  },
}))

vi.mock("./acp/internal-agent", () => ({
  getInternalAgentInfo: () => ({
    maxRecursionDepth: 1,
    maxConcurrent: 1,
  }),
}))

vi.mock("./agent-profile-service", () => ({
  agentProfileService: {
    getByRole: mockGetByRole,
    getCurrentProfile: mockGetCurrentProfile,
  },
}))

describe("constructSystemPrompt", () => {
  beforeEach(() => {
    vi.resetModules()
    mockGetByRole.mockReturnValue([])
    mockGetCurrentProfile.mockReturnValue(undefined)
  })

  it("injects skillsInstructions only once", async () => {
    const { constructSystemPrompt } = await import("./system-prompts")

    const skills = "SKILLS_BLOCK_UNIQUE_12345"
    const prompt = constructSystemPrompt([], undefined, true, undefined, undefined, skills)

    expect(prompt.split(skills).length - 1).toBe(1)
  })

  it("teaches internal delegation to use waitForResult false for background work", async () => {
    const { getSubSessionPromptAddition } = await import("./system-prompts")

    const prompt = getSubSessionPromptAddition()

    expect(prompt).toContain("waitForResult: false")
    expect(prompt).toContain("keep working")
  })

  it("allows direct handling of terse coding follow-ups instead of forcing delegation", async () => {
    const { agentProfileService } = await import("./agent-profile-service")
    vi.mocked(agentProfileService.getByRole).mockReturnValue([
      {
        id: "augustus",
        enabled: true,
        displayName: "Augustus",
        description: "Coding agent",
      } as any,
    ])

    const { getAgentsPromptAddition } = await import("./system-prompts")

    const prompt = getAgentsPromptAddition()

    expect(prompt).toContain("terse follow-ups or current-workspace coding tasks")
    expect(prompt).toContain("If delegation fails to start")
    expect(prompt).not.toContain("ALWAYS delegate")
  })

  it("guides ad-hoc file creation away from repo root and toward collision-safe names", async () => {
    const { constructSystemPrompt } = await import("./system-prompts")

    const prompt = constructSystemPrompt([], undefined, true)

    expect(prompt).toContain("inspect nearby directories and existing naming patterns")
    expect(prompt).toContain("do not drop ad-hoc notes/exports in repo root")
    expect(prompt).toContain("collision-safe filenames")
  })

  it("teaches capability questions to inspect live tool and agent state before answering", async () => {
    const { constructSystemPrompt, constructMinimalSystemPrompt } = await import("./system-prompts")

    const prompt = constructSystemPrompt([], undefined, true)
    const minimalPrompt = constructMinimalSystemPrompt([], true)

    expect(prompt).toContain("CAPABILITY / TOOLING QUESTIONS")
    expect(prompt).toContain("do not guess from memory")
    expect(prompt).toContain("list_mcp_servers")
    expect(prompt).toContain("list_running_agents")
    expect(prompt).toContain("list_agent_profiles")

    expect(minimalPrompt).toContain("instead of guessing")
    expect(minimalPrompt).toContain("list_server_tools")
    expect(minimalPrompt).toContain("get_tool_schema")
  })

  it("guides guideline and notes update requests to edit the likely target directly", async () => {
    const { constructSystemPrompt, constructMinimalSystemPrompt } = await import("./system-prompts")

    const prompt = constructSystemPrompt([], undefined, true)
    const minimalPrompt = constructMinimalSystemPrompt([], true)

    expect(prompt).toContain("INSTRUCTION / NOTES UPDATES")
    expect(prompt).toContain("update your own guidelines")
    expect(prompt).toContain("make that edit directly")
    expect(prompt).toContain("broad repo-status checks")
    expect(prompt).toContain("do not concatenate an entire notes tree")

    expect(minimalPrompt).toContain("update your own guidelines")
    expect(minimalPrompt).toContain("edit it directly")
    expect(minimalPrompt).toContain("dumping entire notes trees")
  })

  it("guides obvious probe payloads toward concrete acknowledgment instead of clarification bounce", async () => {
    const { constructSystemPrompt, constructMinimalSystemPrompt } = await import("./system-prompts")

    const prompt = constructSystemPrompt([], undefined, true)
    const minimalPrompt = constructMinimalSystemPrompt([], true)

    expect(prompt).toContain("TEST / PROBE PAYLOADS")
    expect(prompt).toContain('line-numbered "scroll/jump/focus probe" text blocks')
    expect(prompt).toContain("concrete observed result first")
    expect(prompt).toContain("What would you like me to do with it?")

    expect(minimalPrompt).toContain("obvious test/probe payloads")
    expect(minimalPrompt).toContain("confirm the observable result directly")
  })

  it("omits delegation guidance for specialist sub-sessions that should execute directly", async () => {
    const { agentProfileService } = await import("./agent-profile-service")
    vi.mocked(agentProfileService.getByRole).mockReturnValue([
      {
        id: "web-browser",
        enabled: true,
        displayName: "Web Browser",
        description: "Specialized browsing agent",
      } as any,
    ])

    const { constructSystemPrompt } = await import("./system-prompts")

    const prompt = constructSystemPrompt([], undefined, true, undefined, undefined, undefined, undefined, undefined, undefined, false)

    expect(prompt).not.toContain("DELEGATION RULES")
    expect(prompt).not.toContain("AVAILABLE AGENTS")
    expect(prompt).not.toContain("INTERNAL AGENT:")
  })
})
