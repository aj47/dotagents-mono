import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  appendLog: vi.fn(),
  askQuestion: vi.fn(),
  getRecentLogEntries: vi.fn(),
  getSession: vi.fn(),
  getSessionRunId: vi.fn(),
  getSummaries: vi.fn(),
}))

vi.mock("./mcp-service", () => ({
  mcpService: { getAvailableTools: vi.fn(() => []) },
}))
vi.mock("./agent-session-tracker", () => ({
  agentSessionTracker: {
    getActiveSessions: vi.fn(() => []),
    getSession: mocks.getSession,
  },
}))
vi.mock("./state", () => ({
  agentSessionStateManager: { getSessionRunId: mocks.getSessionRunId },
  toolApprovalManager: {},
}))
vi.mock("./emergency-stop", () => ({ emergencyStopAll: vi.fn() }))
vi.mock("./acp/acp-router-tools", () => ({ executeACPRouterTool: vi.fn(), isACPRouterTool: vi.fn(() => false) }))
vi.mock("./message-queue-service", () => ({ messageQueueService: {} }))
vi.mock("./session-user-response-store", () => ({ appendSessionUserResponse: vi.fn() }))
vi.mock("./conversation-service", () => ({ conversationService: { loadConversation: vi.fn() } }))
vi.mock("./context-budget", () => ({ readMoreContext: vi.fn() }))
vi.mock("./emit-agent-progress", () => ({ emitAgentProgress: vi.fn() }))
vi.mock("./always-on-session-service", () => ({
  alwaysOnSessionService: {
    appendLog: mocks.appendLog,
    askQuestion: mocks.askQuestion,
    getRecentLogEntries: mocks.getRecentLogEntries,
    getSummaries: mocks.getSummaries,
  },
}))
vi.mock("./loop-service", () => ({
  loopService: {
    getLoops: vi.fn(() => []),
    getLoopStatuses: vi.fn(() => []),
  },
}))
vi.mock("./acp-session-state", () => ({
  getAppSessionForAcpSession: vi.fn(() => undefined),
  getRootAppSessionForAcpSession: vi.fn(() => undefined),
  setAcpSessionTitleOverride: vi.fn(),
}))

function makeSummary(overrides: Record<string, unknown> = {}) {
  return {
    id: "always-1",
    loopId: "loop-1",
    name: "Always-on",
    status: "running",
    enabled: true,
    isRunning: true,
    createdAt: 1,
    updatedAt: 2,
    currentSessionId: "session-1",
    conversationId: "conv-1",
    logPath: "/tmp/attempts.jsonl",
    logCount: 3,
    pendingQuestionCount: 0,
    answeredQuestionCount: 0,
    questions: [],
    ...overrides,
  }
}

describe("runtime-tools always-on helpers", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mocks.getSession.mockReturnValue({ id: "session-1", conversationId: "conv-1" })
    mocks.getSessionRunId.mockReturnValue(4)
    mocks.getSummaries.mockReturnValue([makeSummary()])
    mocks.getRecentLogEntries.mockReturnValue([])
  })

  it("returns repeat-attempt and question guidance for blocker logs", async () => {
    const entry = {
      id: "entry-new",
      alwaysOnSessionId: "always-1",
      loopId: "loop-1",
      runtimeSessionId: "session-1",
      conversationId: "conv-1",
      runId: 4,
      kind: "blocker",
      title: "Inspect artifacts",
      timestamp: 10,
    }
    mocks.appendLog.mockReturnValue(entry)
    mocks.getRecentLogEntries.mockReturnValue([
      { ...entry, id: "entry-old-1", timestamp: 1 },
      { ...entry, id: "entry-old-2", timestamp: 2 },
      entry,
    ])

    const { executeRuntimeTool } = await import("./runtime-tools")
    const result = await executeRuntimeTool("log_always_on_attempt", {
      kind: "blocker",
      title: "Inspect artifacts",
    }, "session-1")

    const payload = JSON.parse(String(result?.content[0]?.text))
    expect(payload).toEqual(expect.objectContaining({
      success: true,
      pendingQuestionCount: 0,
      recentSimilarCount: 2,
      sessionStatus: "running",
    }))
    expect(payload.guidance.join("\n")).toContain("same log title")
    expect(payload.guidance.join("\n")).toContain("ask_always_on_question")
  })

  it("returns queued-question state after asking an always-on question", async () => {
    mocks.askQuestion.mockReturnValue({
      id: "question-1",
      alwaysOnSessionId: "always-1",
      loopId: "loop-1",
      runtimeSessionId: "session-1",
      conversationId: "conv-1",
      prompt: "Pick a direction",
      choices: [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
      ],
      allowCustom: true,
      status: "pending",
      createdAt: 10,
    })
    mocks.getSummaries.mockReturnValue([makeSummary({ pendingQuestionCount: 1 })])

    const { executeRuntimeTool } = await import("./runtime-tools")
    const result = await executeRuntimeTool("ask_always_on_question", {
      prompt: "Pick a direction",
      choices: [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
      ],
    }, "session-1")

    const payload = JSON.parse(String(result?.content[0]?.text))
    expect(payload).toEqual(expect.objectContaining({
      success: true,
      questionId: "question-1",
      pendingQuestionCount: 1,
      sessionStatus: "running",
    }))
    expect(payload.message).toContain("Continue other useful work")
  })
})
