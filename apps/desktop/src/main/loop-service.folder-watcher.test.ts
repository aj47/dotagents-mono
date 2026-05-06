import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  const watchCallbacks: Array<(eventType: string, filename: string | null) => void> = []
  const closeSpy = vi.fn()
  const watcher = {
    on: vi.fn(() => watcher),
    close: closeSpy,
  }

  return {
    watchCallbacks,
    watchMock: vi.fn((_: string, optionsOrListener: unknown, maybeListener?: unknown) => {
      const listener = typeof optionsOrListener === "function"
        ? optionsOrListener
        : maybeListener
      if (typeof listener === "function") {
        watchCallbacks.push(listener as (eventType: string, filename: string | null) => void)
      }
      return watcher
    }),
    mkdirSync: vi.fn(),
    existsSync: vi.fn(() => true),
    readdirSync: vi.fn(() => []),
    sendSpy: vi.fn(),
    closeSpy,
  }
})

vi.mock("fs", async () => {
  const actual = await vi.importActual<typeof import("fs")>("fs")
  return {
    ...actual,
    default: {
      ...actual,
      watch: mocks.watchMock,
      mkdirSync: mocks.mkdirSync,
      existsSync: mocks.existsSync,
      readdirSync: mocks.readdirSync,
    },
    watch: mocks.watchMock,
    mkdirSync: mocks.mkdirSync,
    existsSync: mocks.existsSync,
    readdirSync: mocks.readdirSync,
  }
})

vi.mock("@egoist/tipc/main", () => ({
  getRendererHandlers: vi.fn(() => ({ loopsFolderChanged: { send: mocks.sendSpy } })),
}))

vi.mock("./window", () => ({
  WINDOWS: {
    get: (id: string) => (id === "main" || id === "panel" ? { webContents: { id } } : null),
  },
}))

vi.mock("./config", () => ({
  configStore: { get: vi.fn(() => ({ loops: [] })) },
  globalAgentsFolder: "/mock/.agents",
  resolveWorkspaceAgentsFolder: vi.fn(() => null),
}))

vi.mock("./agents-files/modular-config", () => ({
  getAgentsLayerPaths: vi.fn((root: string) => ({ root })),
}))

vi.mock("@dotagents/core", () => ({
  getTasksDir: vi.fn((layer: { root: string }) => `${layer.root}/tasks`),
  loadTasksLayer: vi.fn(() => ({ tasks: [], originById: new Map() })),
  writeTaskFile: vi.fn(),
  writeAllTaskFiles: vi.fn(),
  deleteTaskFiles: vi.fn(),
}))

vi.mock("./debug", () => ({ logApp: vi.fn() }))
vi.mock("./conversation-service", () => ({ conversationService: {} }))
vi.mock("./agent-session-tracker", () => ({ agentSessionTracker: {} }))
vi.mock("./agent-profile-service", () => ({
  agentProfileService: { getById: vi.fn() },
  createSessionSnapshotFromProfile: vi.fn(),
}))

describe("repeat-task folder watcher", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.useFakeTimers()
    mocks.watchCallbacks.length = 0
    mocks.watchMock.mockClear()
    mocks.mkdirSync.mockClear()
    mocks.readdirSync.mockClear()
    mocks.sendSpy.mockClear()
    mocks.closeSpy.mockClear()
  })

  afterEach(async () => {
    const mod = await import("./loop-service")
    mod.stopTasksFolderWatcher()
    vi.useRealTimers()
  })

  it("starts watching the canonical tasks directory", async () => {
    const mod = await import("./loop-service")

    mod.startTasksFolderWatcher()

    expect(mocks.mkdirSync).toHaveBeenCalledWith("/mock/.agents/tasks", { recursive: true })
    expect(mocks.watchMock).toHaveBeenCalledTimes(1)
    expect(mocks.watchCallbacks).toHaveLength(1)
  })

  it("reloads loops and notifies renderers after a task file changes", async () => {
    const mod = await import("./loop-service")
    const stopAllSpy = vi.spyOn(mod.loopService, "stopAllLoops")
    const reloadSpy = vi.spyOn(mod.loopService, "reload")
    const resumeSpy = vi.spyOn(mod.loopService, "resumeScheduling")
    const startAllSpy = vi.spyOn(mod.loopService, "startAllLoops")

    mod.startTasksFolderWatcher()
    mocks.watchCallbacks[0]("rename", "langfuse-severe-issue-reporter/task.md")
    await vi.advanceTimersByTimeAsync(500)

    expect(stopAllSpy).toHaveBeenCalledTimes(1)
    expect(reloadSpy).toHaveBeenCalledTimes(1)
    expect(resumeSpy).toHaveBeenCalledTimes(1)
    expect(startAllSpy).toHaveBeenCalledTimes(1)
    expect(mocks.sendSpy).toHaveBeenCalledTimes(2)
  })
})
