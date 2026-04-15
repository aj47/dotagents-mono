import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  const watchCallbacks: Array<{
    dir: string
    cb: (eventType: string, filename: string | null) => void
  }> = []
  const closeSpy = vi.fn()
  const makeWatcher = () => {
    const w = {
      on: vi.fn(() => w),
      close: closeSpy,
    }
    return w
  }

  return {
    watchCallbacks,
    watchMock: vi.fn(
      (dir: string, optionsOrListener: unknown, maybeListener?: unknown) => {
        const listener =
          typeof optionsOrListener === "function"
            ? optionsOrListener
            : maybeListener
        if (typeof listener === "function") {
          watchCallbacks.push({
            dir,
            cb: listener as (eventType: string, filename: string | null) => void,
          })
        }
        return makeWatcher()
      },
    ),
    mkdirSync: vi.fn(),
    existsSync: vi.fn(() => true),
    readdirSync: vi.fn(() => [
      { name: "main-agent", isDirectory: () => true },
    ]),
    configReload: vi.fn(),
    profileReload: vi.fn(),
    promptsReload: vi.fn(),
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

vi.mock("./config", () => ({
  configStore: { reload: mocks.configReload },
  globalAgentsFolder: "/mock/.agents",
  resolveWorkspaceAgentsFolder: vi.fn(() => null),
}))

vi.mock("./agent-profile-service", () => ({
  agentProfileService: {
    reload: mocks.profileReload,
    reloadPromptsFromLayer: mocks.promptsReload,
  },
}))

vi.mock("./debug", () => ({ logApp: vi.fn() }))

const originalPlatform = process.platform

function setPlatform(p: NodeJS.Platform) {
  Object.defineProperty(process, "platform", { value: p, configurable: true })
}

function findCallback(dir: string) {
  const entry = mocks.watchCallbacks.find((w) => w.dir === dir)
  if (!entry) throw new Error(`No watcher registered for ${dir}`)
  return entry.cb
}

describe("AgentsFolderWatcher (Linux per-subdir filename resolution)", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.useFakeTimers()
    mocks.watchCallbacks.length = 0
    mocks.watchMock.mockClear()
    mocks.mkdirSync.mockClear()
    mocks.readdirSync.mockClear()
    mocks.configReload.mockClear()
    mocks.profileReload.mockClear()
    mocks.promptsReload.mockClear()
    mocks.closeSpy.mockClear()
    setPlatform("linux")
  })

  afterEach(async () => {
    const mod = await import("./agents-folder-watcher")
    mod.stopAgentsFolderWatcher()
    vi.useRealTimers()
    setPlatform(originalPlatform)
  })

  it("reloads config when `ui.json` fires on the `layouts/` subdir watcher", async () => {
    const mod = await import("./agents-folder-watcher")
    mod.startAgentsFolderWatcher()

    findCallback("/mock/.agents/layouts")("change", "ui.json")
    await vi.advanceTimersByTimeAsync(300)

    expect(mocks.configReload).toHaveBeenCalledTimes(1)
  })

  it("reloads profiles when `agent.md` fires on an `agents/<id>/` subdir watcher", async () => {
    const mod = await import("./agents-folder-watcher")
    mod.startAgentsFolderWatcher()

    findCallback("/mock/.agents/agents/main-agent")("change", "agent.md")
    await vi.advanceTimersByTimeAsync(300)

    expect(mocks.profileReload).toHaveBeenCalledTimes(1)
  })

  it("still reloads prompts when `system-prompt.md` fires on the root watcher", async () => {
    const mod = await import("./agents-folder-watcher")
    mod.startAgentsFolderWatcher()

    findCallback("/mock/.agents")("change", "system-prompt.md")
    await vi.advanceTimersByTimeAsync(300)

    expect(mocks.promptsReload).toHaveBeenCalledTimes(1)
    expect(mocks.profileReload).not.toHaveBeenCalled()
  })

  it("does not flush stale pendingReloads across stop/restart", async () => {
    const mod = await import("./agents-folder-watcher")
    mod.startAgentsFolderWatcher()

    // Queue a reload (config) but stop before the debounce fires.
    findCallback("/mock/.agents/layouts")("change", "ui.json")
    mod.stopAgentsFolderWatcher()

    // Restart and deliver an unrelated filename that classifyChange ignores.
    mod.startAgentsFolderWatcher()
    findCallback("/mock/.agents")("change", "README-not-watched.txt")
    await vi.advanceTimersByTimeAsync(300)

    expect(mocks.configReload).not.toHaveBeenCalled()
  })
})
