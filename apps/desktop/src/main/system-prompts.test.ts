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

  it("formats the Now timestamp without slicing locale output", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2025-04-05T06:07:08.000Z"))
    const toLocaleStringSpy = vi.spyOn(Date.prototype, "toLocaleString").mockReturnValue("not-a-fixed-width-timestamp")

    try {
      const { constructSystemPrompt } = await import("./system-prompts")

      const prompt = constructSystemPrompt([], undefined, false)
      const nowLine = prompt.match(/^Now: .+$/m)?.[0]

      expect(toLocaleStringSpy).not.toHaveBeenCalled()
      expect(nowLine).toMatch(/^Now: [0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2} [A-Za-z_\/+-]+$/)
    } finally {
      toLocaleStringSpy.mockRestore()
      vi.useRealTimers()
    }
  })

  it("teaches the knowledge note storage contract in the default prompt", async () => {
    const { DEFAULT_SYSTEM_PROMPT } = await import("./system-prompts")

    expect(DEFAULT_SYSTEM_PROMPT).toContain("search relevant knowledge notes first and prior conversations second")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("Before asking the user for facts that may already be known")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("whenever the current task likely relates to prior work")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("Treat memory as layered")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("continuation/status/latest-state")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("search recent conversations (default last 7-14 days) before or alongside knowledge")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("resolve by freshness, domain, confidence, and source type")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("prefer knowledge notes for durable facts")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("prefer recent conversations for current state")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("surface the conflict explicitly when uncertain")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("personal legal/immigration")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("inspect both relevant knowledge notes and recent conversations with a shell/file tool")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("configured knowledge roots")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("global and workspace .agents/knowledge")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("<knowledge-root>/<slug>/<slug>.md")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("human-readable slug")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("kind: note")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("createdAt/updatedAt")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("context: search-only")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("context: auto")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("direct file editing")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("runtime-supplied conversations directory")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("RUNTIME METADATA")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("DOTAGENTS_RUNTIME_DIR")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("tools/index.json")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("OS-appropriate")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("index.json")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("conv_*.json")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("layered global and workspace .agents folders")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("dotagents-config-admin")
  })

  it("replaces save_memory guidance with note-first durable knowledge guidance", async () => {
    const { constructSystemPrompt } = await import("./system-prompts")

    const prompt = constructSystemPrompt([], undefined, true)

    expect(prompt).toContain("KNOWLEDGE NOTES:")
    expect(prompt).toContain("DOTAGENTS CONFIG")
    expect(prompt).toContain("configured knowledge roots")
    expect(prompt).toContain("<knowledge-root>/<slug>/<slug>.md")
    expect(prompt).toContain("kind: note")
    expect(prompt).toContain("createdAt/updatedAt")
    expect(prompt).toContain("PAST CONVERSATIONS")
    expect(prompt).toContain("Use index.json to discover relevant conversations")
    expect(prompt).toContain("read the dotagents-config-admin SKILL.md file")
    expect(prompt).not.toContain('load_skill_instructions with skillId: "dotagents-config-admin"')
    expect(prompt).not.toContain("Use save_memory")
  })

  it("teaches layered recency-aware memory retrieval in the agent-mode local memory section", async () => {
    const { constructSystemPrompt } = await import("./system-prompts")

    const prompt = constructSystemPrompt(
      [{ name: "execute_command", description: "Execute command", inputSchema: { type: "object", properties: {} } }] as any,
      undefined,
      true,
    )

    expect(prompt).toContain("LOCAL MEMORY & CONFIG:")
    expect(prompt).toContain("Memory is layered")
    expect(prompt).toContain("knowledge notes are canonical for durable facts")
    expect(prompt).toContain("recent conversation history is fresher working memory")
    expect(prompt).toContain('"continue"/"what happened"/"where are we"/"latest"/"status" style requests')
    expect(prompt).toContain("prefer recent conversations")
    expect(prompt).toContain("resolve conflicts by freshness, domain, and confidence")
  })

  it("preserves knowledge note guidance in the minimal fallback prompt when file tools are available", async () => {
    const { constructMinimalSystemPrompt } = await import("./system-prompts")

    const prompt = constructMinimalSystemPrompt([
      { name: "execute_command", description: "Execute command", inputSchema: { type: "object", properties: {} } },
    ], true)

    expect(prompt).toContain("personal legal/immigration")
    expect(prompt).toContain("use execute_command on both knowledge notes and recent conversations before generic advice")
    expect(prompt).toContain("ask one focused follow-up only if facts are missing")
    expect(prompt).toContain("configured knowledge roots")
    expect(prompt).toContain("<knowledge-root>/<slug>/<slug>.md")
    expect(prompt).toContain("context: search-only")
    expect(prompt).toContain("context: auto")
    expect(prompt).toContain("runtime-supplied conversations directory")
    expect(prompt).toContain("DOTAGENTS_RUNTIME_DIR")
    expect(prompt).toContain("DOTAGENTS_TOOL_MANIFEST")
    expect(prompt).toContain("index.json")
    expect(prompt).toContain("conv_*.json")
    expect(prompt).toContain("Memory is layered")
    expect(prompt).toContain("recent conversations for current state/continuation/status")
    expect(prompt).toContain("on conflict resolve by freshness, domain, and confidence")
    expect(prompt).toContain("layered global/workspace .agents folders")
    expect(prompt).toContain("dotagents-config-admin")
  })

  it("does not claim filesystem search in the minimal fallback prompt without file tools", async () => {
    const { constructMinimalSystemPrompt } = await import("./system-prompts")

    const prompt = constructMinimalSystemPrompt([], true)

    expect(prompt).toContain("When file tools are unavailable")
    expect(prompt).not.toContain("use execute_command on both knowledge notes")
    expect(prompt).not.toContain("DOTAGENTS_TOOL_MANIFEST")
  })

  it("separates MCP tools from DotAgents runtime tools in the full prompt", async () => {
    const { constructSystemPrompt } = await import("./system-prompts")

    const prompt = constructSystemPrompt([
      { name: "github:search_issues", description: "Search GitHub issues", inputSchema: { type: "object", properties: {} } },
      { name: "respond_to_user", description: "Send a user-facing response", inputSchema: { type: "object", properties: {} } },
      { name: "execute_command", description: "Execute command", inputSchema: { type: "object", properties: {} } },
    ] as any, undefined, true)

    expect(prompt).toContain("AVAILABLE MCP TOOLS (1 tools total)")
    expect(prompt).toContain("- github (1 tools): search_issues")
    expect(prompt).toContain("DOTAGENTS TOOLS: respond_to_user, execute_command")
    expect(prompt).not.toContain("AVAILABLE MCP SERVERS")
    expect(prompt).not.toContain("- unknown")
  })

  it("allows plain assistant text even when response runtime tools are available", async () => {
    const { constructSystemPrompt } = await import("./system-prompts")

    const prompt = constructSystemPrompt([
      { name: "respond_to_user", description: "Send a user-facing response", inputSchema: { type: "object", properties: {} } },
      { name: "mark_work_complete", description: "Mark work complete", inputSchema: { type: "object", properties: {} } },
    ] as any, undefined, true)

    expect(prompt).toContain("Normal assistant text is valid user-facing output")
    expect(prompt).toContain("a normal assistant text final answer is valid and may be the only response")
    expect(prompt).toContain("call mark_work_complete with a concise internal completion summary after delivering the final answer")
    expect(prompt).not.toContain("Never put the final user-facing answer in plain assistant text")
    expect(prompt).not.toContain("ALWAYS call respond_to_user")
  })

  it("keeps mark_work_complete-only completion guidance as consistently formatted list items", async () => {
    const { constructSystemPrompt } = await import("./system-prompts")

    const prompt = constructSystemPrompt([
      { name: "mark_work_complete", description: "Mark work complete", inputSchema: { type: "object", properties: {} } },
    ] as any, undefined, true)

    expect(prompt).toContain("provide the complete final user-facing answer in normal assistant text first")
    expect(prompt).toContain("may then call mark_work_complete")
    expect(prompt).not.toContain("\n - When all requested work")
    expect(prompt).not.toContain("\n - Do not send a second recap")
  })

  it("only advertises execute_command guidance when execute_command is available", async () => {
    const { constructSystemPrompt } = await import("./system-prompts")

    const withoutExecute = constructSystemPrompt([
      { name: "respond_to_user", description: "Send a user-facing response", inputSchema: { type: "object", properties: {} } },
    ] as any, undefined, true)

    expect(withoutExecute).not.toContain("AGENT FILE & COMMAND EXECUTION")

    const withExecute = constructSystemPrompt([
      { name: "respond_to_user", description: "Send a user-facing response", inputSchema: { type: "object", properties: {} } },
      { name: "execute_command", description: "Execute any shell command", inputSchema: { type: "object", properties: {} } },
    ] as any, undefined, true)

    expect(withExecute).toContain("AGENT FILE & COMMAND EXECUTION")
    expect(withExecute).toContain("Use execute_command for shell/file automation")
    expect(withExecute).toContain("pnpm-lock.yaml")
    expect(withExecute).toContain("do not default to npm")
    expect(withExecute).toContain("Do not run install/test/build/lint/typecheck unless asked")
    expect(withExecute).toContain("DOTAGENTS_RUNTIME_DIR")
    expect(withExecute).toContain("DOTAGENTS_TOOL_SCHEMA_DIR")
  })

  it("advertises early title updates only when set_session_title is available", async () => {
    const { constructSystemPrompt } = await import("./system-prompts")

    const withoutTitleTool = constructSystemPrompt([
      { name: "execute_command", description: "Execute any shell command", inputSchema: { type: "object", properties: {} } },
    ] as any, undefined, true)

    const withTitleTool = constructSystemPrompt([
      { name: "set_session_title", description: "Set session title", inputSchema: { type: "object", properties: {} } },
      { name: "execute_command", description: "Execute any shell command", inputSchema: { type: "object", properties: {} } },
    ] as any, undefined, true)

    expect(withoutTitleTool).not.toContain("SESSION TITLE")
    expect(withTitleTool).toContain("SESSION TITLE")
    expect(withTitleTool).toContain("set a concise useful title with set_session_title early")
    expect(withTitleTool).toContain("do not call set_session_title again with the same title")
  })

  it("prefers direct compacted-context search when the query is known", async () => {
    const { constructSystemPrompt } = await import("./system-prompts")

    const prompt = constructSystemPrompt([
      { name: "read_more_context", description: "Read compacted context", inputSchema: { type: "object", properties: {} } },
    ] as any, undefined, true)

    expect(prompt).toContain('call read_more_context(mode: "search") directly')
    expect(prompt).toContain('use mode: "overview" first only when you need orientation')
    expect(prompt).not.toContain('Prefer read_more_context(mode: "overview") first')
  })

  it("does not advertise delegation tools when delegation is unavailable", async () => {
    const { constructSystemPrompt } = await import("./system-prompts")

    const prompt = constructSystemPrompt([
      { name: "respond_to_user", description: "Send a user-facing response", inputSchema: { type: "object", properties: {} } },
    ] as any, undefined, true)

    expect(prompt).not.toContain("INTERNAL AGENT: Use `delegate_to_agent`")
    expect(prompt).not.toContain("To delegate: `delegate_to_agent")
  })

  it("uses filesystem-first skill guidance when skills are listed", async () => {
    const { constructSystemPrompt } = await import("./system-prompts")

    const skills = `# Available Skills

Skills are filesystem instructions. When a task matches a skill below, read its \`SKILL.md\` path with \`execute_command\` before using it.

- \`dotagents-config-admin\` — DotAgents config edits
  Path: \`/tmp/.agents/skills/dotagents-config-admin/SKILL.md\``

    const prompt = constructSystemPrompt([
      { name: "execute_command", description: "Execute command", inputSchema: { type: "object", properties: {} } },
    ] as any, undefined, true, undefined, undefined, skills)

    expect(prompt).toContain("read its `SKILL.md` path with `execute_command`")
    expect(prompt).toContain("Path: `/tmp/.agents/skills/dotagents-config-admin/SKILL.md`")
    expect(prompt).not.toContain("load_skill_instructions")
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
