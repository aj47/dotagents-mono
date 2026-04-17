import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("./debug", () => ({
  logApp: vi.fn(),
}))

import { taskEventBus } from "./task-event-bus"
import type { TaskEventHandler } from "./task-event-bus"

function handler(
  loopId: string,
  event: TaskEventHandler["event"],
  config: TaskEventHandler["config"],
  fire: ReturnType<typeof vi.fn>,
): TaskEventHandler {
  return { loopId, event, config, fire: fire as unknown as TaskEventHandler["fire"] }
}

describe("TaskEventBus limits", () => {
  beforeEach(() => {
    taskEventBus._debugResetAll()
  })

  it("debounces consecutive fires below minIntervalMs", async () => {
    const fire = vi.fn()
    taskEventBus.setHandlersForLoop("loopA", [
      handler("loopA", "onUserMessage", { minIntervalMs: 5000, excludeTriggered: false }, fire),
    ])
    const base = Date.now()
    taskEventBus.emit("onUserMessage", {
      sessionId: "s1",
      timestamp: base,
      content: "hi",
    })
    taskEventBus.emit("onUserMessage", {
      sessionId: "s1",
      timestamp: base + 100,
      content: "hi again",
    })
    await new Promise((r) => setImmediate(r))
    expect(fire).toHaveBeenCalledTimes(1)
  })

  it("debounce is per-event, not cross-event within the same loop", async () => {
    const fireUser = vi.fn()
    const fireTool = vi.fn()
    taskEventBus.setHandlersForLoop("loopA", [
      handler("loopA", "onUserMessage", { minIntervalMs: 5000, excludeTriggered: false }, fireUser),
      handler("loopA", "onToolCall", { minIntervalMs: 5000, excludeTriggered: false }, fireTool),
    ])
    taskEventBus.emit("onUserMessage", {
      sessionId: "s1",
      timestamp: Date.now(),
      content: "hi",
    })
    taskEventBus.emit("onToolCall", {
      sessionId: "s1",
      timestamp: Date.now(),
      toolName: "t",
    })
    await new Promise((r) => setImmediate(r))
    expect(fireUser).toHaveBeenCalledTimes(1)
    expect(fireTool).toHaveBeenCalledTimes(1)
  })

  it("enforces maxRunsPerSession", async () => {
    const fire = vi.fn()
    taskEventBus.setHandlersForLoop("loopA", [
      handler(
        "loopA",
        "onToolCall",
        { maxRunsPerSession: 2, minIntervalMs: 0, excludeTriggered: false },
        fire,
      ),
    ])
    for (let i = 0; i < 5; i++) {
      taskEventBus.emit("onToolCall", {
        sessionId: "s1",
        timestamp: Date.now() + i,
        toolName: "t",
      })
      await new Promise((r) => setImmediate(r))
    }
    expect(fire).toHaveBeenCalledTimes(2)
  })

  it("resets per-session counter on onSessionEnd", async () => {
    const fire = vi.fn()
    taskEventBus.setHandlersForLoop("loopA", [
      handler(
        "loopA",
        "onToolCall",
        { maxRunsPerSession: 1, minIntervalMs: 0, excludeTriggered: false },
        fire,
      ),
    ])
    taskEventBus.emit("onToolCall", {
      sessionId: "s1",
      timestamp: Date.now(),
      toolName: "t",
    })
    await new Promise((r) => setImmediate(r))
    taskEventBus.emit("onToolCall", {
      sessionId: "s1",
      timestamp: Date.now(),
      toolName: "t",
    })
    await new Promise((r) => setImmediate(r))
    expect(fire).toHaveBeenCalledTimes(1)

    // End session, counter resets.
    taskEventBus.emit("onSessionEnd", {
      sessionId: "s1",
      timestamp: Date.now(),
      status: "completed",
    })

    taskEventBus.emit("onToolCall", {
      sessionId: "s1",
      timestamp: Date.now() + 2000,
      toolName: "t",
    })
    await new Promise((r) => setImmediate(r))
    expect(fire).toHaveBeenCalledTimes(2)
  })

  it("setHandlersForLoop with empty array unsubscribes", async () => {
    const fire = vi.fn()
    taskEventBus.setHandlersForLoop("loopA", [
      handler("loopA", "onUserMessage", { excludeTriggered: false }, fire),
    ])
    taskEventBus.setHandlersForLoop("loopA", [])
    taskEventBus.emit("onUserMessage", {
      sessionId: "s1",
      timestamp: Date.now(),
      content: "x",
    })
    await new Promise((r) => setImmediate(r))
    expect(fire).not.toHaveBeenCalled()
  })
})
