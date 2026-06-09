import { describe, expect, it, vi } from "vitest"

vi.mock("./mcp-service", () => ({
  mcpService: { getAvailableTools: vi.fn(() => []) },
}))
vi.mock("./agent-session-tracker", () => ({
  agentSessionTracker: {
    getActiveSessions: vi.fn(() => []),
    getSession: vi.fn(() => undefined),
  },
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
vi.mock("./emit-agent-progress", () => ({ emitAgentProgress: vi.fn() }))
vi.mock("./always-on-session-service", () => ({
  alwaysOnSessionService: {
    appendLog: vi.fn(),
    askQuestion: vi.fn(),
    getSummaries: vi.fn(() => []),
  },
}))
vi.mock("./loop-service", () => ({
  loopService: {
    getLoops: vi.fn(() => []),
  },
}))
vi.mock("./acp-session-state", () => ({
  getAppSessionForAcpSession: vi.fn(() => undefined),
  getRootAppSessionForAcpSession: vi.fn(() => undefined),
  setAcpSessionTitleOverride: vi.fn(),
}))

describe("runtime-tools filesystem-first skill access", () => {
  it("does not expose load_skill_instructions as a runtime tool", async () => {
    const { runtimeTools, isRuntimeTool, executeRuntimeTool } = await import("./runtime-tools")

    expect(runtimeTools.map((tool) => tool.name)).not.toContain("load_skill_instructions")
    expect(isRuntimeTool("load_skill_instructions")).toBe(false)
    expect(await executeRuntimeTool("load_skill_instructions", { skillId: "any" })).toBeNull()
  })

  it("keeps set_session_title as a direct runtime tool for early UI title updates", async () => {
    const { runtimeTools, isRuntimeTool } = await import("./runtime-tools")
    const names = runtimeTools.map((tool) => tool.name)

    expect(names).toContain("set_session_title")
    expect(isRuntimeTool("set_session_title")).toBe(true)
  })

  it("keeps always-on log and question helpers as direct runtime tools", async () => {
    const { runtimeTools, isRuntimeTool } = await import("./runtime-tools")
    const names = runtimeTools.map((tool) => tool.name)

    expect(names).toContain("log_always_on_attempt")
    expect(names).toContain("ask_always_on_question")
    expect(isRuntimeTool("log_always_on_attempt")).toBe(true)
    expect(isRuntimeTool("ask_always_on_question")).toBe(true)
  })

  it("does not expose legacy session-control or schema-discovery helpers", async () => {
    const { runtimeTools, isRuntimeTool, executeRuntimeTool } = await import("./runtime-tools")
    const names = runtimeTools.map((tool) => tool.name)

    for (const toolName of [
      "list_running_agents",
      "send_agent_message",
      "kill_agent",
      "list_server_tools",
      "get_tool_schema",
    ]) {
      expect(names).not.toContain(toolName)
      expect(isRuntimeTool(toolName)).toBe(false)
      expect(await executeRuntimeTool(toolName, {})).toBeNull()
    }
  })

  it("rejects execute_command.skillId and directs callers to filesystem paths", async () => {
    const { executeRuntimeTool } = await import("./runtime-tools")
    const result = await executeRuntimeTool("execute_command", {
      command: "pwd",
      skillId: "disabled-skill",
    })

    expect(result?.isError).toBe(true)
    const payload = JSON.parse(String(result?.content[0]?.text))
    expect(payload).toEqual(expect.objectContaining({
      success: false,
      error: "execute_command.skillId is no longer supported.",
    }))
    expect(payload.guidance).toContain("SKILL.md path")
  })
})
