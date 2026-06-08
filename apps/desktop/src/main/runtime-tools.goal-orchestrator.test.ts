import { beforeEach, describe, expect, it, vi } from "vitest"

const mockGetSnapshot = vi.fn()
const mockCreateGoal = vi.fn()
const mockCreateWorkItem = vi.fn()

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
vi.mock("./acp/acp-router-tools", () => ({ executeACPRouterTool: vi.fn(), isACPRouterTool: vi.fn(() => false) }))
vi.mock("./session-user-response-store", () => ({ appendSessionUserResponse: vi.fn() }))
vi.mock("./conversation-service", () => ({ conversationService: {} }))
vi.mock("./context-budget", () => ({ readMoreContext: vi.fn() }))
vi.mock("./emit-agent-progress", () => ({ emitAgentProgress: vi.fn() }))
vi.mock("./acp-session-state", () => ({
  getRootAppSessionForAcpSession: vi.fn(() => undefined),
  setAcpSessionTitleOverride: vi.fn(),
}))
vi.mock("./goal-orchestrator-service", () => ({
  goalOrchestratorService: {
    getSnapshot: mockGetSnapshot,
    createGoal: mockCreateGoal,
    createWorkItem: mockCreateWorkItem,
  },
}))
vi.mock("./loop-service", () => ({ loopService: {} }))

const baseSnapshot = {
  goals: [{ id: "goal_1", title: "Launch Plan", status: "active", createdAt: 1, updatedAt: 1 }],
  workItems: [],
  decisions: [],
  agentRuns: [],
  orchestratorRuns: [],
  activityNotes: [],
  settings: {
    maxGlobalRunningSessions: 1,
    maxRunningSessionsPerGoal: 1,
    maxSessionsPerWakeCycle: 1,
  },
}

describe("runtime-tools goal orchestrator", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mockGetSnapshot.mockReturnValue(baseSnapshot)
    mockCreateGoal.mockImplementation((input) => ({
      id: "goal_new",
      title: input.title,
      status: input.status ?? "active",
      notes: input.notes,
      createdAt: 2,
      updatedAt: 2,
    }))
    mockCreateWorkItem.mockImplementation((input) => ({
      id: "work_new",
      goalId: input.goalId,
      title: input.title,
      status: input.status ?? "ready",
      notes: input.notes,
      createdAt: 3,
      updatedAt: 3,
    }))
  })

  it("exposes goal orchestrator tools to the main agent", async () => {
    const { runtimeTools, isRuntimeTool } = await import("./runtime-tools")
    const names = runtimeTools.map((tool) => tool.name)

    expect(names).toContain("get_goal_orchestrator_snapshot")
    expect(names).toContain("create_goal")
    expect(names).toContain("create_work_item")
    expect(isRuntimeTool("create_goal")).toBe(true)
  })

  it("creates a goal through the runtime tool", async () => {
    const { executeRuntimeTool } = await import("./runtime-tools")
    const result = await executeRuntimeTool("create_goal", {
      title: "Ship orchestrator",
      notes: "Keep it moving",
    })

    expect(mockCreateGoal).toHaveBeenCalledWith({
      title: "Ship orchestrator",
      notes: "Keep it moving",
      status: undefined,
    })
    expect(result?.isError).toBe(false)
    const payload = JSON.parse(String(result?.content[0]?.text))
    expect(payload.goal.id).toBe("goal_new")
  })

  it("creates a work item by resolving the goal title", async () => {
    const { executeRuntimeTool } = await import("./runtime-tools")
    const result = await executeRuntimeTool("create_work_item", {
      goalTitle: "Launch Plan",
      title: "Draft launch checklist",
    })

    expect(mockCreateWorkItem).toHaveBeenCalledWith({
      goalId: "goal_1",
      title: "Draft launch checklist",
      notes: undefined,
      status: undefined,
    })
    expect(result?.isError).toBe(false)
    const payload = JSON.parse(String(result?.content[0]?.text))
    expect(payload.workItem.goalId).toBe("goal_1")
  })
})
