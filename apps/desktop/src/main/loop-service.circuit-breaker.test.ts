import { afterEach, describe, expect, it, vi } from "vitest"

const loadTasksLayer = vi.fn()
const writeTaskFile = vi.fn()
const writeAllTaskFiles = vi.fn()
const deleteTaskFiles = vi.fn()
const runAgentLoopSession = vi.fn()
const createConversation = vi.fn()
const startSession = vi.fn()

vi.mock("./agents-files/tasks", () => ({
  loadTasksLayer,
  writeTaskFile,
  writeAllTaskFiles,
  deleteTaskFiles,
}))

vi.mock("./agents-files/modular-config", () => ({
  getAgentsLayerPaths: vi.fn(() => ({ agentsDir: "/tmp/.agents", backupsDir: "/tmp/.agents/.backups" })),
}))

vi.mock("./config", () => ({
  configStore: {
    get: vi.fn(() => ({ loops: [] })),
    save: vi.fn(),
  },
  globalAgentsFolder: "/tmp/.agents",
  resolveWorkspaceAgentsFolder: vi.fn(() => null),
}))

vi.mock("./debug", () => ({
  logApp: vi.fn(),
}))

vi.mock("./conversation-service", () => ({
  conversationService: {
    createConversation,
  },
}))

vi.mock("./agent-session-tracker", () => ({
  agentSessionTracker: {
    startSession,
  },
}))

vi.mock("./agent-profile-service", () => ({
  agentProfileService: {
    getById: vi.fn(() => undefined),
  },
  createSessionSnapshotFromProfile: vi.fn(),
}))

vi.mock("./tipc", () => ({
  runAgentLoopSession,
}))

async function loadLoopService() {
  vi.resetModules()
  const mod = await import("./loop-service")
  return mod.loopService
}

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe("loop-service circuit breaker", () => {
  it("auto-pauses a loop after three consecutive automatic failures", async () => {
    loadTasksLayer.mockReturnValue({
      tasks: [{
        id: "burning-loop",
        name: "Burning Loop",
        prompt: "Trigger the failure path",
        intervalMinutes: 60,
        enabled: true,
        runOnStartup: true,
      }],
      originById: new Map(),
    })
    createConversation.mockResolvedValue({ id: "conv-1" })
    startSession.mockReturnValue("session-1")
    runAgentLoopSession.mockResolvedValue(
      "Failed to create ACP session for agent augustus. Verify the agent command is valid and supports ACP methods like session/new."
    )

    vi.useFakeTimers()
    const loopService = await loadLoopService()

    expect(loopService.startLoop("burning-loop")).toBe(true)
    await vi.runAllTimersAsync()

    expect(loopService.getLoop("burning-loop")).toEqual(expect.objectContaining({
      enabled: false,
      consecutiveFailures: 3,
      lastFailureMessage: "Failed to create ACP session for agent augustus. Verify the agent command is valid and supports ACP methods like session/new.",
      autoPausedAt: expect.any(Number),
    }))
    expect(writeTaskFile).toHaveBeenCalled()
  })

  it("records manual run failures without incrementing the automatic auto-pause streak", async () => {
    loadTasksLayer.mockReturnValue({
      tasks: [{
        id: "burning-loop",
        name: "Burning Loop",
        prompt: "Trigger the failure path",
        intervalMinutes: 60,
        enabled: false,
        consecutiveFailures: 2,
        autoPausedAt: 1774242060000,
      }],
      originById: new Map(),
    })
    createConversation.mockResolvedValue({ id: "conv-1" })
    startSession.mockReturnValue("session-1")
    runAgentLoopSession.mockResolvedValueOnce("I couldn't complete the request after multiple attempts.")

    const loopService = await loadLoopService()

    await loopService.triggerLoop("burning-loop")
    expect(loopService.getLoop("burning-loop")).toEqual(expect.objectContaining({
      enabled: false,
      consecutiveFailures: 2,
      lastFailureMessage: "I couldn't complete the request after multiple attempts.",
      autoPausedAt: 1774242060000,
    }))
  })

  it("drops auto-pause metadata when a user re-enables a loop", async () => {
    loadTasksLayer.mockReturnValue({
      tasks: [{
        id: "burning-loop",
        name: "Burning Loop",
        prompt: "Trigger the failure path",
        intervalMinutes: 60,
        enabled: false,
        consecutiveFailures: 3,
        lastFailureAt: 1774242000000,
        lastFailureMessage: "Task may not be fully complete - reached maximum iteration limit.",
        autoPausedAt: 1774242060000,
      }],
      originById: new Map(),
    })

    const loopService = await loadLoopService()
    const saved = loopService.saveLoop({
      ...loopService.getLoop("burning-loop")!,
      enabled: true,
    })

    expect(saved).toBe(true)
    const loop = loopService.getLoop("burning-loop")
    expect(loop).toEqual(expect.objectContaining({
      enabled: true,
    }))
    expect(loop.consecutiveFailures).toBe(0)
    expect(loop.lastFailureAt).toBeUndefined()
    expect(loop.lastFailureMessage).toBeUndefined()
    expect(loop.autoPausedAt).toBeUndefined()
  })
})
