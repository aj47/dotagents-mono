import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("./debug", () => ({
  logApp: vi.fn(),
}))

import { taskEventBus } from "./task-event-bus"
import type { TaskEventHandler } from "./task-event-bus"

function makeHandler(
  loopId: string,
  event: Parameters<typeof taskEventBus.setHandlersForLoop>[1][number]["event"],
  overrides: Partial<TaskEventHandler> = {},
  fire: ReturnType<typeof vi.fn> = vi.fn(),
): TaskEventHandler {
  return {
    loopId,
    event,
    config: undefined,
    fire: fire as unknown as TaskEventHandler["fire"],
    ...overrides,
  }
}

describe("TaskEventBus", () => {
  beforeEach(() => {
    taskEventBus._debugResetAll()
  })

  it("delivers onSessionEnd to subscribed handlers", async () => {
    const fire = vi.fn()
    taskEventBus.setHandlersForLoop("loopA", [makeHandler("loopA", "onSessionEnd", {}, fire)])
    taskEventBus.emit("onSessionEnd", {
      sessionId: "s1",
      timestamp: Date.now(),
      status: "completed",
    })
    await new Promise((r) => setImmediate(r))
    expect(fire).toHaveBeenCalledTimes(1)
  })

  it("blocks self-trigger: task cannot fire on its own spawned session's events", async () => {
    const fire = vi.fn()
    taskEventBus.setHandlersForLoop("loopA", [makeHandler("loopA", "onSessionEnd", {}, fire)])
    taskEventBus.emit("onSessionEnd", {
      sessionId: "s1",
      timestamp: Date.now(),
      status: "completed",
      triggeringLoopId: "loopA", // spawned by this same loop
    })
    await new Promise((r) => setImmediate(r))
    expect(fire).not.toHaveBeenCalled()
  })

  it("enforces maxTriggerDepth (default 1)", async () => {
    const fire = vi.fn()
    taskEventBus.setHandlersForLoop("loopA", [makeHandler("loopA", "onSessionEnd", {}, fire)])
    // depth 2 should be blocked by default maxTriggerDepth of 1
    taskEventBus.emit("onSessionEnd", {
      sessionId: "s1",
      timestamp: Date.now(),
      status: "completed",
      triggerDepth: 2,
      triggeringLoopId: "loopB",
    })
    await new Promise((r) => setImmediate(r))
    expect(fire).not.toHaveBeenCalled()
  })

  it("excludeTriggered default skips sessions spawned from any task", async () => {
    const fire = vi.fn()
    taskEventBus.setHandlersForLoop("loopA", [makeHandler("loopA", "onSessionEnd", {}, fire)])
    taskEventBus.emit("onSessionEnd", {
      sessionId: "s1",
      timestamp: Date.now(),
      status: "completed",
      triggeringLoopId: "loopB", // another task spawned this session
    })
    await new Promise((r) => setImmediate(r))
    expect(fire).not.toHaveBeenCalled()
  })

  it("respects excludeTriggered=false opt-in", async () => {
    const fire = vi.fn()
    taskEventBus.setHandlersForLoop("loopA", [
      makeHandler("loopA", "onSessionEnd", { config: { excludeTriggered: false } }, fire),
    ])
    taskEventBus.emit("onSessionEnd", {
      sessionId: "s1",
      timestamp: Date.now(),
      status: "completed",
      triggeringLoopId: "loopB",
    })
    await new Promise((r) => setImmediate(r))
    expect(fire).toHaveBeenCalledTimes(1)
  })

  it("filters onToolCall by toolName", async () => {
    const fire = vi.fn()
    taskEventBus.setHandlersForLoop("loopA", [
      makeHandler("loopA", "onToolCall", { config: { toolName: "web_search" } }, fire),
    ])
    taskEventBus.emit("onToolCall", {
      sessionId: "s1",
      timestamp: Date.now(),
      toolName: "shell",
    })
    await new Promise((r) => setImmediate(r))
    expect(fire).not.toHaveBeenCalled()

    taskEventBus.emit("onToolCall", {
      sessionId: "s1",
      timestamp: Date.now() + 2000,
      toolName: "web_search",
    })
    await new Promise((r) => setImmediate(r))
    expect(fire).toHaveBeenCalledTimes(1)
  })
})
