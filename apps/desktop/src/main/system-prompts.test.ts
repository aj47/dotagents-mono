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
})
