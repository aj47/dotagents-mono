import { beforeEach, describe, expect, it, vi } from "vitest"
import type { LoopConfig } from "../shared/types"

const mockLoadTasksLayer = vi.fn()
const mockWriteTaskFile = vi.fn()
const mockDeleteTaskFiles = vi.fn()
const mockConfigSave = vi.fn()
const mockResolveWorkspaceAgentsFolder = vi.fn<[], string | null>(() => null)

vi.mock("./config", () => ({
  configStore: {
    get: () => ({ loops: [] }),
    save: (...args: unknown[]) => mockConfigSave(...args),
  },
  globalAgentsFolder: "/tmp/dotagents-loop-service-test/.agents",
  resolveWorkspaceAgentsFolder: () => mockResolveWorkspaceAgentsFolder(),
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
  deleteTaskFiles: (...args: unknown[]) => mockDeleteTaskFiles(...args),
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

async function loadService(options: { globalLoops?: LoopConfig[]; workspaceLoops?: LoopConfig[] } = {}) {
  const { globalLoops = [], workspaceLoops = [] } = options

  vi.resetModules()
  mockLoadTasksLayer.mockReset()
  mockWriteTaskFile.mockReset()
  mockDeleteTaskFiles.mockReset()
  mockConfigSave.mockReset()
  mockResolveWorkspaceAgentsFolder.mockReset()
  mockResolveWorkspaceAgentsFolder.mockReturnValue(workspaceLoops.length > 0 ? "/tmp/workspace/.agents" : null)

  mockLoadTasksLayer.mockImplementation((layer: { agentsDir: string }) => {
    const loops = layer.agentsDir === "/tmp/workspace/.agents" ? workspaceLoops : globalLoops
    return {
      tasks: structuredClone(loops),
      originById: new Map(loops.map(loop => [loop.id, { filePath: `${layer.agentsDir}/tasks/${loop.id}/task.md` }])),
    }
  })
  mockWriteTaskFile.mockImplementation(() => {})
  mockDeleteTaskFiles.mockImplementation(() => {})

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
    const service = await loadService({ globalLoops: [original] })

    mockWriteTaskFile.mockImplementationOnce(() => {
      throw new Error("ENOSPC: no space left on device")
    })

    expect(service.saveLoop(createLoop({ intervalMinutes: 60 }))).toBe(false)
    expect(service.getLoop("daily-summary")).toEqual(original)
    expect(mockConfigSave).not.toHaveBeenCalled()
  })

  it("writes workspace-origin task updates back to the workspace layer", async () => {
    const original = createLoop()
    const service = await loadService({ workspaceLoops: [original] })

    expect(service.saveLoop(createLoop({ intervalMinutes: 60 }))).toBe(true)
    expect(mockWriteTaskFile).toHaveBeenCalledWith(
      expect.objectContaining({ agentsDir: "/tmp/workspace/.agents" }),
      expect.objectContaining({ intervalMinutes: 60 }),
      expect.any(Object),
    )
  })

  it("deletes workspace-origin task files from the workspace layer", async () => {
    const original = createLoop()
    const service = await loadService({ workspaceLoops: [original] })

    expect(service.deleteLoop("daily-summary")).toBe(true)
    expect(mockDeleteTaskFiles).toHaveBeenCalledWith(
      expect.objectContaining({ agentsDir: "/tmp/workspace/.agents" }),
      "daily-summary",
    )
  })

  it("keeps a task in memory when deleting task files fails", async () => {
    const original = createLoop()
    const service = await loadService({ globalLoops: [original] })

    mockDeleteTaskFiles.mockImplementationOnce(() => {
      throw new Error("EROFS: read-only file system")
    })

    expect(service.deleteLoop("daily-summary")).toBe(false)
    expect(service.getLoop("daily-summary")).toEqual(original)
    expect(mockConfigSave).not.toHaveBeenCalled()
  })
})