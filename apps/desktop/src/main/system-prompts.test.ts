import { describe, it, expect, vi, beforeEach } from "vitest"
import type { AgentProfile, AgentProfileRole } from "../shared/types"

const mockAgentProfileService = {
  getByRole: vi.fn((_role: AgentProfileRole) => [] as AgentProfile[]),
  getCurrentProfile: vi.fn(() => undefined as AgentProfile | undefined),
}

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
  agentProfileService: mockAgentProfileService,
}))

describe("constructSystemPrompt", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mockAgentProfileService.getByRole.mockReturnValue([])
    mockAgentProfileService.getCurrentProfile.mockReturnValue(undefined)
  })

  it("injects skillsInstructions only once", async () => {
    const { constructSystemPrompt } = await import("./system-prompts")

    const skills = "SKILLS_BLOCK_UNIQUE_12345"
    const prompt = constructSystemPrompt([], undefined, true, undefined, undefined, skills)

    expect(prompt.split(skills).length - 1).toBe(1)
  })

  it("prefers direct execution over mandatory delegation for simple tasks", async () => {
    mockAgentProfileService.getByRole.mockReturnValue([
      {
        id: "augustus",
        name: "augustus",
        enabled: true,
        displayName: "augustus",
        description: "Augment Code's AI coding assistant with native ACP support",
        connection: { type: "internal" },
        createdAt: 0,
        updatedAt: 0,
      },
    ])

    const { getAgentsPromptAddition } = await import("./system-prompts")

    const prompt = getAgentsPromptAddition()

    expect(prompt).toContain("Prefer doing the work directly")
    expect(prompt).toContain("Delegate when the user explicitly asks for a specific agent")
    expect(prompt).toContain("incorporate the result into a complete answer")
    expect(prompt).not.toContain("ALWAYS delegate")
    expect(prompt).not.toContain("Only respond directly if NO agent matches")
  })
})
