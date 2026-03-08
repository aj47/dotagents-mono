import { beforeEach, describe, expect, it, vi } from "vitest"
import type { LoopConfig } from "../shared/types"

const mockLoadTasksLayer = vi.fn()
const mockWriteTaskFile = vi.fn()
const mockConfigSave = vi.fn()

vi.mock("./config", () => ({
  configStore: {
    get: () => ({ loops: [] }),
    save: (...args: unknown[]) => mockConfigSave(...args),
  },
  globalAgentsFolder: "/tmp/dotagents-loop-service-test/.agents",
  resolveWorkspaceAgentsFolder: () => null,
}))

vi.mock("./debug", () => ({ logApp: vi.fn() }))
vi.mock("./conversation-service", () => ({ conversationService: {} }))
vi.mock("./agent-session-tracker", () => ({ agentSessionTracker: {} }))
vi.mock("./agent-profile-service", () => ({ agentProfileService: {}, createSessionSnapshotFromProfile: vi.fn() }))
vi.mock("./agents-files/modular-config", () => ({ getAgentsLayerPaths: vi.fn((agentsDir: string) => ({ agentsDir })) }))
vi.mock("./agents-files/tasks", () => ({
  loadTasksLayer: (...args: unknown[]) => mockLoadTasksLayer(...args),
  writeTaskFile: (...args: unknown[]) => mockWriteTaskFile(...args),
  writeAllTaskFiles: vi.fn(),
  deleteTaskFiles: vi.fn(),
}))

function createLoop(overrides: Partial<LoopConfig> = {}): LoopConfig {
  return {
    id: "daily-summary",
    name: "Daily Summary",
    prompt: "Summarize recent activity",
    intervalMinutes: 15,
    enabled: true,
    runOnStartup: false,
    ...overrides,
  }
}

async function loadService(initialLoops: LoopConfig[] = []) {
  vi.resetModules()
  mockLoadTasksLayer.mockReset()
  mockWriteTaskFile.mockReset()
  mockConfigSave.mockReset()

  mockLoadTasksLayer.mockImplementation(() => ({ tasks: structuredClone(initialLoops) }))
  mockWriteTaskFile.mockImplementation(() => {})

  const { loopService } = await import("./loop-service")
  return loopService
}

describe("loop-service persistence rollback", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("does not keep a new task in memory when writing task.md fails", async () => {
    const service = await loadService()

    mockWriteTaskFile.mockImplementationOnce(() => {
      throw new Error("EROFS: read-only file system")
    })

    expect(service.saveLoop(createLoop())).toBe(false)
    expect(service.getLoop("daily-summary")).toBeUndefined()
    expect(mockConfigSave).not.toHaveBeenCalled()
  })

  it("restores the previous task when updating persistence fails", async () => {
    const original = createLoop()
    const service = await loadService([original])

    mockWriteTaskFile.mockImplementationOnce(() => {
      throw new Error("ENOSPC: no space left on device")
    })

    expect(service.saveLoop(createLoop({ intervalMinutes: 60 }))).toBe(false)
    expect(service.getLoop("daily-summary")).toEqual(original)
    expect(mockConfigSave).not.toHaveBeenCalled()
  })
})