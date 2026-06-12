import { beforeEach, describe, expect, it, vi } from "vitest"

let mockLoops: any[] = []
const mockGetLoops = vi.fn()
const mockGetLoop = vi.fn()
const mockGetLoopStatus = vi.fn()
const mockGetLoopStatuses = vi.fn()
const mockSaveLoop = vi.fn()
const mockStopLoop = vi.fn()
const mockStartLoop = vi.fn()
const mockTriggerLoop = vi.fn()

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
vi.mock("./goal-orchestrator-service", () => ({ goalOrchestratorService: {} }))
vi.mock("./loop-service", () => ({
  loopService: {
    getLoops: mockGetLoops,
    getLoop: mockGetLoop,
    getLoopStatus: mockGetLoopStatus,
    getLoopStatuses: mockGetLoopStatuses,
    saveLoop: mockSaveLoop,
    stopLoop: mockStopLoop,
    startLoop: mockStartLoop,
    triggerLoop: mockTriggerLoop,
  },
}))

describe("runtime-tools repeat tasks", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mockLoops = []
    mockGetLoops.mockImplementation(() => mockLoops)
    mockGetLoop.mockImplementation((loopId: string) => mockLoops.find((loop) => loop.id === loopId))
    mockGetLoopStatus.mockImplementation((loopId: string) => ({
      id: loopId,
      enabled: true,
      isRunning: false,
      intervalMinutes: 60,
    }))
    mockGetLoopStatuses.mockReturnValue([])
    mockSaveLoop.mockImplementation((loop) => {
      const index = mockLoops.findIndex((item) => item.id === loop.id)
      if (index >= 0) {
        mockLoops[index] = loop
      } else {
        mockLoops.push(loop)
      }
      return true
    })
    mockStopLoop.mockReturnValue(false)
    mockStartLoop.mockReturnValue(true)
    mockTriggerLoop.mockResolvedValue({ loopId: "loop_1", sessionId: "session_1", conversationId: "conv_1" })
  })

  it("exposes repeat task tools to the main agent", async () => {
    const { runtimeTools, isRuntimeTool } = await import("./runtime-tools")
    const names = runtimeTools.map((tool) => tool.name)

    expect(names).toContain("get_repeat_tasks")
    expect(names).toContain("create_repeat_task")
    expect(names).toContain("update_repeat_task")
    expect(names).toContain("run_repeat_task")
    expect(isRuntimeTool("create_repeat_task")).toBe(true)
  })

  it("creates a weekly goal-orchestrator repeat task without requiring a normal prompt", async () => {
    const { executeRuntimeTool } = await import("./runtime-tools")
    const result = await executeRuntimeTool("create_repeat_task", {
      name: "Weekly content plan orchestrator wake",
      goalOrchestrator: true,
      schedule: { type: "weekly", times: ["18:00"], daysOfWeek: ["Sunday"] },
      maxIterations: 3,
    })

    expect(result?.isError).toBe(false)
    expect(mockSaveLoop).toHaveBeenCalledWith(expect.objectContaining({
      name: "Weekly content plan orchestrator wake",
      prompt: "Run goal orchestrator",
      enabled: true,
      goalOrchestrator: true,
      maxIterations: 3,
      schedule: { type: "weekly", times: ["18:00"], daysOfWeek: [0] },
    }))
    expect(mockStartLoop).toHaveBeenCalled()
  })

  it("updates a repeat task by exact spoken name", async () => {
    mockLoops = [{
      id: "loop_1",
      name: "Weekly content plan orchestrator wake",
      prompt: "Run goal orchestrator",
      intervalMinutes: 60,
      enabled: true,
      goalOrchestrator: true,
      schedule: { type: "weekly", times: ["18:00"], daysOfWeek: [0] },
      maxIterations: 3,
    }]

    const { executeRuntimeTool } = await import("./runtime-tools")
    const result = await executeRuntimeTool("update_repeat_task", {
      repeatTaskName: "Weekly content plan orchestrator wake",
      enabled: false,
      schedule: null,
      maxIterations: null,
    })

    expect(result?.isError).toBe(false)
    expect(mockSaveLoop).toHaveBeenCalledWith(expect.objectContaining({
      id: "loop_1",
      enabled: false,
    }))
    const saved = mockSaveLoop.mock.calls[0][0]
    expect(saved.schedule).toBeUndefined()
    expect(saved.maxIterations).toBeUndefined()
    expect(mockStopLoop).toHaveBeenCalledWith("loop_1")
    expect(mockStartLoop).not.toHaveBeenCalled()
  })

  it("runs a repeat task by exact spoken name", async () => {
    mockLoops = [{
      id: "loop_1",
      name: "Weekly content plan orchestrator wake",
      prompt: "Run goal orchestrator",
      intervalMinutes: 60,
      enabled: true,
      goalOrchestrator: true,
    }]

    const { executeRuntimeTool } = await import("./runtime-tools")
    const result = await executeRuntimeTool(
      "run_repeat_task",
      { repeatTaskName: "Weekly content plan orchestrator wake" },
      "session_current",
    )

    expect(result?.isError).toBe(false)
    expect(mockTriggerLoop).toHaveBeenCalledWith("loop_1", { clientSessionId: "session_current" })
  })
})
