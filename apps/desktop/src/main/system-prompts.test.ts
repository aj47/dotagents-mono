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

  it("teaches the knowledge note storage contract in the default prompt", async () => {
    const { DEFAULT_SYSTEM_PROMPT } = await import("./system-prompts")

    expect(DEFAULT_SYSTEM_PROMPT).toContain("check relevant knowledge notes and prior conversations first")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("Before asking the user for facts that may already be known")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("~/.agents/knowledge/")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("./.agents/knowledge/")
    expect(DEFAULT_SYSTEM_PROMPT).toContain(".agents/knowledge/<slug>/<slug>.md")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("human-readable slug")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("context: search-only")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("context: auto")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("direct file editing")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("<appData>/<appId>/conversations/")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("~/Library/Application Support/<appId>/conversations/")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("%APPDATA%/<appId>/conversations/")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("~/.config/<appId>/conversations/")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("index.json")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("conv_*.json")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("app.dotagents")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("layered ~/.agents/ and ./.agents/ filesystem")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("dotagents-config-admin")
  })

  it("replaces save_memory guidance with note-first durable knowledge guidance", async () => {
    const { constructSystemPrompt } = await import("./system-prompts")

    const prompt = constructSystemPrompt([], undefined, true)

    expect(prompt).toContain("KNOWLEDGE NOTES (durable context)")
    expect(prompt).toContain("DOTAGENTS CONFIG")
    expect(prompt).toContain("Prefer direct file editing there over special-purpose note tools")
    expect(prompt).toContain(".agents/knowledge/<slug>/<slug>.md")
    expect(prompt).toContain("PAST CONVERSATIONS")
    expect(prompt).toContain("If AJ says \"pick up where we left off\"")
    expect(prompt).toContain("search the conversation store with python3 or shell tools")
    expect(prompt).toContain("load the dotagents-config-admin skill before changing unfamiliar DotAgents config")
    expect(prompt).not.toContain('load_skill_instructions with skillId: "dotagents-config-admin"')
    expect(prompt).not.toContain("Use save_memory")
  })

  it("preserves knowledge note guidance in the minimal fallback prompt", async () => {
    const { constructMinimalSystemPrompt } = await import("./system-prompts")

    const prompt = constructMinimalSystemPrompt([], true)

    expect(prompt).toContain("check relevant knowledge notes and prior conversations first")
    expect(prompt).toContain("user/project-specific facts are still missing")
    expect(prompt).toContain("~/.agents/knowledge/")
    expect(prompt).toContain(".agents/knowledge/<slug>/<slug>.md")
    expect(prompt).toContain("context: search-only")
    expect(prompt).toContain("context: auto")
    expect(prompt).toContain("<appData>/<appId>/conversations/")
    expect(prompt).toContain("index.json")
    expect(prompt).toContain("conv_*.json")
    expect(prompt).toContain("app.dotagents")
    expect(prompt).toContain("layered ~/.agents/ and ./.agents/ filesystem")
    expect(prompt).toContain("dotagents-config-admin")
  })

  it("separates MCP tools from DotAgents runtime tools in the full prompt", async () => {
    const { constructSystemPrompt } = await import("./system-prompts")

    const prompt = constructSystemPrompt([
      { name: "github:search_issues", description: "Search GitHub issues", inputSchema: { type: "object", properties: {} } },
      { name: "respond_to_user", description: "Send a user-facing response", inputSchema: { type: "object", properties: {} } },
      { name: "load_skill_instructions", description: "Load a skill", inputSchema: { type: "object", properties: {} } },
    ] as any, undefined, true)

    expect(prompt).toContain("AVAILABLE MCP TOOLS (1 tools total)")
    expect(prompt).toContain("- github (1 tools): search_issues")
    expect(prompt).toContain("AVAILABLE DOTAGENTS RUNTIME TOOLS (2)")
    expect(prompt).toContain("- respond_to_user — Send a user-facing response")
    expect(prompt).toContain("- load_skill_instructions — Load a skill")
    expect(prompt).not.toContain("AVAILABLE MCP SERVERS")
    expect(prompt).not.toContain("unknown")
  })

  it("only advertises discovery helpers that are actually available", async () => {
    const { constructSystemPrompt } = await import("./system-prompts")

    const withoutHelpers = constructSystemPrompt([
      { name: "respond_to_user", description: "Send a user-facing response", inputSchema: { type: "object", properties: {} } },
    ] as any, undefined, true)

    expect(withoutHelpers).not.toContain("list_server_tools(serverName)")
    expect(withoutHelpers).not.toContain("get_tool_schema(toolName)")

    const withHelpers = constructSystemPrompt([
      { name: "respond_to_user", description: "Send a user-facing response", inputSchema: { type: "object", properties: {} } },
      { name: "list_server_tools", description: "List tools for a server", inputSchema: { type: "object", properties: {} } },
      { name: "get_tool_schema", description: "Inspect a tool schema", inputSchema: { type: "object", properties: {} } },
    ] as any, undefined, true)

    expect(withHelpers).toContain("list_server_tools(serverName)")
    expect(withHelpers).toContain("get_tool_schema(toolName)")
  })

  it("only advertises execute_command guidance when execute_command is available", async () => {
    const { constructSystemPrompt } = await import("./system-prompts")

    const withoutExecute = constructSystemPrompt([
      { name: "respond_to_user", description: "Send a user-facing response", inputSchema: { type: "object", properties: {} } },
    ] as any, undefined, true)

    expect(withoutExecute).not.toContain("Use execute_command as your primary tool")

    const withExecute = constructSystemPrompt([
      { name: "respond_to_user", description: "Send a user-facing response", inputSchema: { type: "object", properties: {} } },
      { name: "execute_command", description: "Execute any shell command", inputSchema: { type: "object", properties: {} } },
    ] as any, undefined, true)

    expect(withExecute).toContain("Use execute_command as your primary tool")
    expect(withExecute).toContain("pnpm-lock.yaml => pnpm")
    expect(withExecute).toContain("Do not default to npm")
    expect(withExecute).toContain("Do not run package-manager install/test/build/lint/typecheck commands")
  })

  it("does not advertise delegation tools when delegation is unavailable", async () => {
    const { constructSystemPrompt } = await import("./system-prompts")

    const prompt = constructSystemPrompt([
      { name: "respond_to_user", description: "Send a user-facing response", inputSchema: { type: "object", properties: {} } },
    ] as any, undefined, true)

    expect(prompt).not.toContain("INTERNAL AGENT: Use `delegate_to_agent`")
    expect(prompt).not.toContain("To delegate: `delegate_to_agent")
  })

  it("advertises load_skill_instructions only when that tool is available", async () => {
    const { constructSystemPrompt } = await import("./system-prompts")

    const prompt = constructSystemPrompt([
      { name: "load_skill_instructions", description: "Load a skill", inputSchema: { type: "object", properties: {} } },
    ] as any, undefined, true)

    expect(prompt).toContain('load_skill_instructions with skillId: "dotagents-config-admin"')
    expect(prompt).toContain("at most once per skill per agent session")
    expect(prompt).toContain("If it already returned successfully, reuse the prior instructions")
  })

  it("separates MCP tools from DotAgents runtime tools in the minimal prompt", async () => {
    const { constructMinimalSystemPrompt } = await import("./system-prompts")

    const prompt = constructMinimalSystemPrompt([
      { name: "github:search_issues", inputSchema: { type: "object", properties: { query: { type: "string" } } } },
      { name: "respond_to_user", inputSchema: { type: "object", properties: { content: { type: "string" } } } },
    ] as any, true)

    expect(prompt).toContain("AVAILABLE MCP TOOLS:")
    expect(prompt).toContain("- github:search_issues(query)")
    expect(prompt).toContain("AVAILABLE DOTAGENTS RUNTIME TOOLS:")
    expect(prompt).toContain("- respond_to_user(content)")
    expect(prompt).not.toContain("AVAILABLE TOOLS:")
  })

  it("formats injected working notes from knowledge notes", async () => {
    const { constructSystemPrompt } = await import("./system-prompts")

    const prompt = constructSystemPrompt([], undefined, false, undefined, undefined, undefined, undefined, [
      {
        id: "project-architecture",
        title: "Project Architecture",
        context: "auto",
        updatedAt: 2,
        tags: ["architecture"],
        summary: "Layered Electron app with workspace-overrides-global note loading.",
        body: "Longer details here.",
      } as any,
      {
        id: "release-plan",
        title: "Release Plan",
        context: "auto",
        updatedAt: 1,
        tags: ["release"],
        body: "# Milestones\nShip the staged rollout next week.",
      } as any,
    ])

    expect(prompt).toContain("WORKING NOTES")
    expect(prompt).toContain("context: auto")
    expect(prompt).toContain("[project-architecture] Layered Electron app with workspace-overrides-global note loading.")
    expect(prompt).toContain("[release-plan] Release Plan: Milestones Ship the staged rollout next week.")
    expect(prompt).not.toContain("KNOWLEDGE FROM PREVIOUS SESSIONS")
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
