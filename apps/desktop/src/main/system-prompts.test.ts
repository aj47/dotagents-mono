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

  it("instructs agents to search prior conversations whenever they need more context", async () => {
    const { DEFAULT_SYSTEM_PROMPT, constructSystemPrompt } = await import("./system-prompts")

    expect(DEFAULT_SYSTEM_PROMPT).toContain("Prior DotAgents conversations are JSON in the runtime-supplied conversations directory")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("searching the conversations index and relevant conv_*.json history is a standard context-gathering step")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("do this before asking the user")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("If recovered conversations contain enough facts to answer or continue, use them and respond")
    expect(DEFAULT_SYSTEM_PROMPT).toContain("only ask the user when prior conversations do not contain the needed information, or when credentials/approval are required")
    // The note-first lookup guarantee from #494 must remain intact.
    expect(DEFAULT_SYSTEM_PROMPT).toContain("search relevant knowledge notes first and prior conversations second")

    const agentPrompt = constructSystemPrompt([
      { name: "execute_command", description: "Execute command", inputSchema: { type: "object", properties: {} } },
    ] as any, undefined, true)

    expect(agentPrompt).toContain("whenever you need more context to answer or proceed")
    expect(agentPrompt).toContain("search index.json then conv_*.json as a standard step before asking the user")
    expect(agentPrompt).toContain("use the recovered context to answer or continue when sufficient")
    expect(agentPrompt).toContain("Only ask the user when prior conversations do not contain the needed facts, or when credentials/approval are required")
    expect(agentPrompt).toContain("Always prefer knowledge notes over recalled conversation context when they conflict")
    // The old narrower phrasing should no longer be present in the agent-mode block
    expect(agentPrompt).not.toContain("recover state before asking when the user wants to resume prior work")
  })

  it("preserves local memory guidance when a custom base prompt is active", async () => {
    const { constructSystemPrompt } = await import("./system-prompts")

    const prompt = constructSystemPrompt([
      { name: "execute_command", description: "Execute command", inputSchema: { type: "object", properties: {} } },
    ] as any, undefined, false, undefined, "Custom profile base prompt.")

    expect(prompt).toContain("Custom profile base prompt.")
    expect(prompt).toContain("LOCAL MEMORY & CONFIG")
    expect(prompt).toContain("Durable notes live in configured knowledge roots")
    expect(prompt).toContain("Prior conversations live under the runtime-supplied conversations directory")
    expect(prompt).toContain("search index.json then conv_*.json as a standard step before asking the user")
    expect(prompt).toContain("FILESYSTEM SEARCH ORDER")
    expect(prompt).toContain("Skills, settings, knowledge, tasks, prompts, runtime metadata, and past conversations are files")
  })

  it("can isolate a profile from DotAgents-owned local context", async () => {
    const { constructSystemPrompt } = await import("./system-prompts")

    const prompt = constructSystemPrompt(
      [
        { name: "execute_command", description: "Execute command", inputSchema: { type: "object", properties: {} } },
      ] as any,
      undefined,
      true,
      undefined,
      "Isolated profile prompt.",
      undefined,
      undefined,
      [{ id: "private-note", title: "Private", context: "auto", body: "Do not inject me." } as any],
      undefined,
      "Global .agents: /tmp/private/.agents",
      { includeLocalContext: false },
    )

    expect(prompt).toContain("Isolated profile prompt.")
    expect(prompt).toContain("AGENT MODE")
    expect(prompt).toContain("AGENT FILE & COMMAND EXECUTION")
    expect(prompt).toContain("DOTAGENTS TOOLS: execute_command")
    expect(prompt).not.toContain("LOCAL MEMORY & CONFIG")
    expect(prompt).not.toContain("FILESYSTEM LOCATIONS")
    expect(prompt).not.toContain("WORKING NOTES")
    expect(prompt).not.toContain("Do not inject me")
    expect(prompt).not.toContain("DOTAGENTS_RUNTIME_DIR")
    expect(prompt).not.toContain("past conversations are files")
  })

  it("keeps local memory guidance available outside agent mode", async () => {
    const { constructSystemPrompt } = await import("./system-prompts")

    const prompt = constructSystemPrompt([], undefined, false)

    expect(prompt).toContain("LOCAL MEMORY & CONFIG")
    expect(prompt).toContain("Prior conversations live under the runtime-supplied conversations directory")
  })

  it("teaches the minimal fallback prompt to search prior conversations when more context is needed", async () => {
    const { constructMinimalSystemPrompt } = await import("./system-prompts")

    const promptWithReadMore = constructMinimalSystemPrompt([
      { name: "execute_command", description: "Execute command", inputSchema: { type: "object", properties: {} } },
      { name: "read_more_context", description: "Read compacted context", inputSchema: { type: "object", properties: {} } },
    ], true)

    expect(promptWithReadMore).toContain("Whenever you need more context")
    expect(promptWithReadMore).toContain("continuation, status, debugging, or high-context planning")
    expect(promptWithReadMore).toContain("search the conversation store (index.json then conv_*.json) before asking")
    expect(promptWithReadMore).toContain("use recovered context to answer or continue when sufficient")
    expect(promptWithReadMore).not.toContain("If the user asks to resume or find prior context")

    const promptWithoutReadMore = constructMinimalSystemPrompt([
      { name: "execute_command", description: "Execute command", inputSchema: { type: "object", properties: {} } },
    ], true)

    expect(promptWithoutReadMore).toContain("search the conversation store (index.json then conv_*.json) before asking")
    expect(promptWithoutReadMore).toContain("use recovered context to answer or continue when sufficient")
    expect(promptWithoutReadMore).not.toContain("If the user asks to resume/find prior context")
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

  it("keeps local context disabled in the minimal fallback prompt", async () => {
    const { constructMinimalSystemPrompt } = await import("./system-prompts")

    const prompt = constructMinimalSystemPrompt(
      [{ name: "execute_command", description: "Execute command", inputSchema: { type: "object", properties: {} } }],
      true,
      undefined,
      undefined,
      "Global .agents: /tmp/private/.agents",
      false,
    )

    expect(prompt).toContain("AVAILABLE DOTAGENTS RUNTIME TOOLS")
    expect(prompt).toContain("execute_command")
    expect(prompt).toContain("Use only the provided conversation context for prior state")
    expect(prompt).not.toContain("FILESYSTEM LOCATIONS")
    expect(prompt).not.toContain("DOTAGENTS_RUNTIME_DIR")
    expect(prompt).not.toContain("index.json")
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
    expect(prompt).toContain("- Layered Electron app with workspace-overrides-global note loading.")
    expect(prompt).toContain("- Release Plan: Milestones Ship the staged rollout next week.")
    expect(prompt).not.toContain("[project-architecture]")
    expect(prompt).not.toContain("[release-plan]")
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
