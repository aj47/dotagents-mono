import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { emitAgentProgress, setEmitAgentProgressEmitter } from "./emit-agent-progress"
import type { ProgressEmitter } from "./interfaces/progress-emitter"
import type { AgentProgressUpdate } from "@dotagents/shared"

// Mock state module
vi.mock("./state", () => {
  const agentSessionStateManager = {
    shouldStopSession: vi.fn().mockReturnValue(false),
    getSessionRunId: vi.fn().mockReturnValue(undefined),
  }
  return {
    agentSessionStateManager,
    isPanelAutoShowSuppressed: vi.fn().mockReturnValue(false),
  }
})

// Mock debug
vi.mock("./debug", () => ({
  logApp: vi.fn(),
}))

import { agentSessionStateManager } from "./state"

/** Helper to create a partial AgentProgressUpdate for testing */
function makeUpdate(overrides: Partial<AgentProgressUpdate>): AgentProgressUpdate {
  return {
    currentIteration: 1,
    maxIterations: 10,
    isComplete: false,
    ...overrides,
  } as AgentProgressUpdate
}

describe("emitAgentProgress", () => {
  let mockEmitter: ProgressEmitter

  beforeEach(() => {
    vi.useFakeTimers()
    mockEmitter = {
      emitAgentProgress: vi.fn(),
      emitSessionUpdate: vi.fn(),
      emitQueueUpdate: vi.fn(),
      emitEvent: vi.fn(),
    }
    setEmitAgentProgressEmitter(mockEmitter)
    vi.mocked(agentSessionStateManager.shouldStopSession).mockReturnValue(false)
    vi.mocked(agentSessionStateManager.getSessionRunId).mockReturnValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("should send critical updates immediately", async () => {
    const update = makeUpdate({ sessionId: `critical-${Date.now()}`, isComplete: true })

    await emitAgentProgress(update)

    expect(mockEmitter.emitAgentProgress).toHaveBeenCalledTimes(1)
    expect(mockEmitter.emitAgentProgress).toHaveBeenCalledWith(
      expect.objectContaining({ isComplete: true })
    )
  })

  it("should send tool approval updates immediately", async () => {
    const update = makeUpdate({
      sessionId: `tool-approval-${Date.now()}`,
      pendingToolApproval: { toolName: "test", args: {} } as any,
    })

    await emitAgentProgress(update)
    expect(mockEmitter.emitAgentProgress).toHaveBeenCalledTimes(1)
  })

  it("should send first update for a session immediately", async () => {
    const update = makeUpdate({
      sessionId: `first-update-${Date.now()}`,
      steps: [{ status: "running" } as any],
    })

    await emitAgentProgress(update)
    expect(mockEmitter.emitAgentProgress).toHaveBeenCalledTimes(1)
  })

  it("should throttle non-critical updates", async () => {
    const sid = `throttle-${Date.now()}`

    // First update - immediate (first for this session = critical)
    await emitAgentProgress(makeUpdate({ sessionId: sid, steps: [{ status: "running" } as any] }))
    expect(mockEmitter.emitAgentProgress).toHaveBeenCalledTimes(1)

    // Second non-critical update within throttle window
    await emitAgentProgress(makeUpdate({ sessionId: sid, steps: [{ status: "running" } as any] }))
    // Should not be sent immediately (throttled)
    expect(mockEmitter.emitAgentProgress).toHaveBeenCalledTimes(1)

    // Advance timer past throttle interval
    vi.advanceTimersByTime(200)
    expect(mockEmitter.emitAgentProgress).toHaveBeenCalledTimes(2)
  })

  it("should skip updates for stopped sessions", async () => {
    const sid = `stopped-${Date.now()}`
    vi.mocked(agentSessionStateManager.shouldStopSession).mockReturnValue(true)

    await emitAgentProgress(makeUpdate({ sessionId: sid, steps: [{ status: "running" } as any] }))
    expect(mockEmitter.emitAgentProgress).not.toHaveBeenCalled()
  })

  it("should still send completion updates for stopped sessions", async () => {
    const sid = `stopped-complete-${Date.now()}`
    vi.mocked(agentSessionStateManager.shouldStopSession).mockReturnValue(true)

    await emitAgentProgress(makeUpdate({ sessionId: sid, isComplete: true }))
    expect(mockEmitter.emitAgentProgress).toHaveBeenCalledTimes(1)
  })

  it("should handle no emitter without crashing", async () => {
    setEmitAgentProgressEmitter(null as unknown as ProgressEmitter)

    // Should not throw
    await emitAgentProgress(makeUpdate({ sessionId: `no-emitter-${Date.now()}`, isComplete: true }))
  })

  it("should drop stale run ID updates", async () => {
    const sid = `stale-run-${Date.now()}`
    vi.mocked(agentSessionStateManager.getSessionRunId).mockReturnValue(5)

    await emitAgentProgress(makeUpdate({ sessionId: sid, runId: 3, steps: [{ status: "running" } as any] }))
    expect(mockEmitter.emitAgentProgress).not.toHaveBeenCalled()
  })

  it("should send error step updates immediately", async () => {
    const sid = `error-step-${Date.now()}`
    // First send a regular update to establish session state
    await emitAgentProgress(makeUpdate({ sessionId: sid, steps: [{ status: "running" } as any] }))
    vi.mocked(mockEmitter.emitAgentProgress).mockClear()

    await emitAgentProgress(makeUpdate({ sessionId: sid, steps: [{ status: "error" } as any] }))
    expect(mockEmitter.emitAgentProgress).toHaveBeenCalledTimes(1)
  })
})
