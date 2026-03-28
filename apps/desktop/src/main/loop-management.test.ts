import { describe, expect, it, vi, type Mock } from "vitest"
vi.mock("./agent-profile-service", () => ({
  agentProfileService: {
    getById: vi.fn(() => undefined),
  },
}))

import {
  deleteManagedLoop,
  getManagedLoopSummaries,
  resolveManagedLoopSelection,
  saveManagedLoop,
  toggleManagedLoopEnabled,
  triggerManagedLoop,
  type LoopRuntimeStore,
} from "./loop-management"
import type { LoopConfig } from "../shared/types"

function createLoopStore(
  loops: LoopConfig[],
  options: {
    saveSucceeds?: boolean
    deleteSucceeds?: boolean
    triggerSucceeds?: boolean
    statuses?: Array<{
      id: string
      isRunning?: boolean
      lastRunAt?: number
      nextRunAt?: number
    }>
  } = {},
): LoopRuntimeStore & {
  startLoop: Mock<[string], boolean>
  stopLoop: Mock<[string], boolean>
} {
  const storeLoops = loops
  const statuses = options.statuses ?? []

  const getLoop = (loopId: string) => storeLoops.find((loop) => loop.id === loopId)
  const getLoopStatus = (loopId: string) =>
    statuses.find((status) => status.id === loopId)

  return {
    getLoops: () => storeLoops,
    getLoop,
    getLoopStatuses: () => statuses,
    getLoopStatus,
    saveLoop: vi.fn((loop: LoopConfig) => {
      if (options.saveSucceeds === false) {
        return false
      }

      const existingIndex = storeLoops.findIndex((existing) => existing.id === loop.id)
      if (existingIndex >= 0) {
        storeLoops[existingIndex] = loop
      } else {
        storeLoops.push(loop)
      }
      return true
    }),
    deleteLoop: vi.fn((loopId: string) => {
      if (options.deleteSucceeds === false) {
        return false
      }

      const existingIndex = storeLoops.findIndex((loop) => loop.id === loopId)
      if (existingIndex === -1) {
        return false
      }

      storeLoops.splice(existingIndex, 1)
      return true
    }),
    startLoop: vi.fn<[string], boolean>(() => true),
    stopLoop: vi.fn<[string], boolean>(() => true),
    triggerLoop: vi.fn(async () => options.triggerSucceeds !== false),
  }
}

describe("loop management", () => {
  it("builds loop summaries with runtime status fields in one helper", () => {
    const loopStore = createLoopStore(
      [
        {
          id: "loop-1",
          name: "Daily summary",
          prompt: "Summarize activity",
          intervalMinutes: 60,
          enabled: true,
          lastRunAt: 100,
        },
        {
          id: "loop-2",
          name: "Inbox sweep",
          prompt: "Check inbox",
          intervalMinutes: 15,
          enabled: false,
        },
      ],
      {
        statuses: [
          { id: "loop-1", isRunning: true, lastRunAt: 200, nextRunAt: 300 },
        ],
      },
    )

    expect(getManagedLoopSummaries(loopStore)).toEqual([
      {
        id: "loop-1",
        name: "Daily summary",
        prompt: "Summarize activity",
        intervalMinutes: 60,
        enabled: true,
        profileName: undefined,
        lastRunAt: 200,
        isRunning: true,
        nextRunAt: 300,
      },
      {
        id: "loop-2",
        name: "Inbox sweep",
        prompt: "Check inbox",
        intervalMinutes: 15,
        enabled: false,
        profileName: undefined,
        lastRunAt: undefined,
        isRunning: false,
        nextRunAt: undefined,
      },
    ])
  })

  it("resolves loop selections by exact name or unique id/name prefix", () => {
    const loops = [
      { id: "loop-alpha", name: "Daily Summary" },
      { id: "loop-beta", name: "Inbox Sweep" },
      { id: "loop-gamma", name: "Inbox Drafts" },
    ]

    expect(resolveManagedLoopSelection(loops, "Daily Summary")).toEqual({
      selectedLoop: loops[0],
    })
    expect(resolveManagedLoopSelection(loops, "loop-be")).toEqual({
      selectedLoop: loops[1],
    })
    expect(resolveManagedLoopSelection(loops, "inbox")).toEqual({
      ambiguousLoops: [loops[1], loops[2]],
    })
  })

  it("restarts enabled loops when a shared save requests it", () => {
    const loopStore = createLoopStore([
      {
        id: "loop-1",
        name: "Daily summary",
        prompt: "Summarize activity",
        intervalMinutes: 60,
        enabled: true,
      },
    ])

    const result = saveManagedLoop(
      loopStore,
      {
        id: "loop-1",
        name: "Daily summary",
        prompt: "Summarize activity again",
        intervalMinutes: 30,
        enabled: true,
      },
      { restartIfEnabled: true },
    )

    expect(result.success).toBe(true)
    expect(loopStore.stopLoop).toHaveBeenCalledWith("loop-1")
    expect(loopStore.startLoop).toHaveBeenCalledWith("loop-1")
  })

  it("toggles loop enablement through one helper", () => {
    const loopStore = createLoopStore([
      {
        id: "loop-1",
        name: "Daily summary",
        prompt: "Summarize activity",
        intervalMinutes: 60,
        enabled: true,
      },
    ])

    const result = toggleManagedLoopEnabled(loopStore, "loop-1")

    expect(result).toMatchObject({
      success: true,
      loop: {
        id: "loop-1",
        enabled: false,
      },
    })
    expect(loopStore.stopLoop).toHaveBeenCalledWith("loop-1")
    expect(loopStore.startLoop).not.toHaveBeenCalled()
  })

  it("reports already-running loop triggers without masking the conflict", async () => {
    const loopStore = createLoopStore(
      [
        {
          id: "loop-1",
          name: "Daily summary",
          prompt: "Summarize activity",
          intervalMinutes: 60,
          enabled: true,
        },
      ],
      { triggerSucceeds: false },
    )

    await expect(triggerManagedLoop(loopStore, "loop-1")).resolves.toEqual({
      success: false,
      error: "already_running",
      loop: {
        id: "loop-1",
        name: "Daily summary",
        prompt: "Summarize activity",
        intervalMinutes: 60,
        enabled: true,
      },
    })
  })

  it("deletes loops through the shared helper", () => {
    const loopStore = createLoopStore([
      {
        id: "loop-1",
        name: "Daily summary",
        prompt: "Summarize activity",
        intervalMinutes: 60,
        enabled: true,
      },
    ])

    expect(deleteManagedLoop(loopStore, "loop-1")).toEqual({
      success: true,
      loop: {
        id: "loop-1",
        name: "Daily summary",
        prompt: "Summarize activity",
        intervalMinutes: 60,
        enabled: true,
      },
    })
  })
})
