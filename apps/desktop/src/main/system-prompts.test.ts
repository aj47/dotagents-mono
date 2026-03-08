import { describe, it, expect, vi, beforeEach } from "vitest"

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
    getByRole: () => [],
    getCurrentProfile: () => undefined,
  },
}))

describe("constructSystemPrompt", () => {
  beforeEach(() => {
    vi.resetModules()
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
})
