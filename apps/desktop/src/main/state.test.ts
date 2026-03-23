import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

describe("agentSessionStateManager", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("stopSession aborts and unregisters session controllers and cancels pending approvals", async () => {
    const { agentSessionStateManager, state, toolApprovalManager } = await import("./state")

    agentSessionStateManager.createSession("session-stop")
    const controller = new AbortController()
    agentSessionStateManager.registerAbortController("session-stop", controller)
    const { promise } = toolApprovalManager.requestApproval("session-stop", "test-tool", { ok: true })

    expect(state.llmAbortControllers.has(controller)).toBe(true)
    expect(toolApprovalManager.getPendingApprovalCount()).toBe(1)

    agentSessionStateManager.stopSession("session-stop")

    expect(controller.signal.aborted).toBe(true)
    expect(state.llmAbortControllers.has(controller)).toBe(false)
    expect(agentSessionStateManager.getSession("session-stop")?.abortControllers.size).toBe(0)
    await expect(promise).resolves.toBe(false)
    expect(toolApprovalManager.getPendingApprovalCount()).toBe(0)
  })

  it("cleanupSession aborts and unregisters controllers, cancels approvals, and preserves run id", async () => {
    const { agentSessionStateManager, state, toolApprovalManager } = await import("./state")

    const runId = agentSessionStateManager.startSessionRun("session-cleanup")
    const controller = new AbortController()
    agentSessionStateManager.registerAbortController("session-cleanup", controller)
    const { promise } = toolApprovalManager.requestApproval("session-cleanup", "test-tool", { ok: true })

    agentSessionStateManager.cleanupSession("session-cleanup")

    expect(controller.signal.aborted).toBe(true)
    expect(state.llmAbortControllers.has(controller)).toBe(false)
    expect(agentSessionStateManager.getSession("session-cleanup")).toBeUndefined()
    expect(agentSessionStateManager.getSessionRunId("session-cleanup")).toBe(runId)
    await expect(promise).resolves.toBe(false)
    expect(toolApprovalManager.getPendingApprovalCount()).toBe(0)
  })

  it("stops timed sessions automatically and records the timeout reason", async () => {
    vi.useFakeTimers()

    const { agentSessionStateManager, state } = await import("./state")

    const runId = agentSessionStateManager.startSessionRun("session-timeout", undefined, {
      maxDurationMs: 1_000,
    })
    const controller = new AbortController()
    agentSessionStateManager.registerAbortController("session-timeout", controller)

    vi.advanceTimersByTime(1_000)

    expect(controller.signal.aborted).toBe(true)
    expect(state.llmAbortControllers.has(controller)).toBe(false)
    expect(agentSessionStateManager.shouldStopSession("session-timeout")).toBe(true)
    expect(agentSessionStateManager.getSessionStopReason("session-timeout")).toBe("timeout")
    expect(agentSessionStateManager.getSessionRunId("session-timeout")).toBe(runId)
  })
})
