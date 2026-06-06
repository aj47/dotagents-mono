import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  sendSpy: vi.fn(),
  showPanelWindow: vi.fn(),
  resizePanelForAgentMode: vi.fn(),
  closeAgentModeAndHidePanelWindow: vi.fn(),
  isSessionSnoozed: vi.fn(),
  getSession: vi.fn(),
  shouldStopSession: vi.fn(() => false),
  getSessionRunId: vi.fn(() => undefined),
  appState: { isRecording: false, isTextInputActive: false, isAgentModeActive: false },
  config: { floatingPanelAutoShow: true, floatingPanelAgentProgressEnabled: true, hidePanelWhenMainFocused: true },
  mainWindow: { isVisible: vi.fn(() => true), isFocused: vi.fn(() => false), webContents: { id: "main" } },
  panelWindow: { isVisible: vi.fn(() => false), webContents: { id: "panel" } },
}))

vi.mock("@egoist/tipc/main", () => ({
  getRendererHandlers: vi.fn(() => ({ agentProgressUpdate: { send: mocks.sendSpy } })),
}))

vi.mock("./window", () => ({
  WINDOWS: { get: (id: string) => (id === "main" ? mocks.mainWindow : id === "panel" ? mocks.panelWindow : null) },
  showPanelWindow: mocks.showPanelWindow,
  resizePanelForAgentMode: mocks.resizePanelForAgentMode,
  closeAgentModeAndHidePanelWindow: mocks.closeAgentModeAndHidePanelWindow,
}))

vi.mock("./state", () => ({
  isPanelAutoShowSuppressed: vi.fn(() => false),
  agentSessionStateManager: { shouldStopSession: mocks.shouldStopSession, getSessionRunId: mocks.getSessionRunId },
  state: mocks.appState,
}))

vi.mock("./agent-session-tracker", () => ({
  agentSessionTracker: { isSessionSnoozed: mocks.isSessionSnoozed, getSession: mocks.getSession },
}))

vi.mock("./config", () => ({
  configStore: { get: () => mocks.config },
}))

vi.mock("@dotagents/shared", () => ({
  sanitizeAgentProgressUpdateForDisplay: (update: unknown) => update,
}))

import { emitAgentProgress } from "./emit-agent-progress"

describe("emitAgentProgress snoozed propagation", () => {
  beforeEach(() => {
    mocks.sendSpy.mockClear()
    mocks.showPanelWindow.mockClear()
    mocks.resizePanelForAgentMode.mockClear()
    mocks.closeAgentModeAndHidePanelWindow.mockClear()
    mocks.isSessionSnoozed.mockReset()
    mocks.getSession.mockReset()
    mocks.shouldStopSession.mockClear()
    mocks.getSessionRunId.mockClear()
    mocks.mainWindow.isVisible.mockReturnValue(true)
    mocks.mainWindow.isFocused.mockReturnValue(false)
    mocks.panelWindow.isVisible.mockReturnValue(false)
    mocks.appState.isRecording = false
    mocks.appState.isTextInputActive = false
    mocks.appState.isAgentModeActive = false
    mocks.config.floatingPanelAutoShow = true
    mocks.config.floatingPanelAgentProgressEnabled = true
    mocks.config.hidePanelWhenMainFocused = true
  })

  it("backfills isSnoozed from the session tracker when callers omit it", async () => {
    mocks.isSessionSnoozed.mockReturnValue(true)

    await emitAgentProgress({ sessionId: "session-snoozed-1", currentIteration: 0, maxIterations: 1, steps: [], isComplete: false })

    expect(mocks.sendSpy).toHaveBeenCalledWith(expect.objectContaining({ sessionId: "session-snoozed-1", isSnoozed: true }))
    expect(mocks.showPanelWindow).not.toHaveBeenCalled()
    expect(mocks.resizePanelForAgentMode).not.toHaveBeenCalled()
  })

  it("preserves an explicit isSnoozed value from the caller", async () => {
    mocks.isSessionSnoozed.mockReturnValue(true)

    await emitAgentProgress({ sessionId: "session-snoozed-2", currentIteration: 0, maxIterations: 1, steps: [], isComplete: false, isSnoozed: false })

    expect(mocks.sendSpy).toHaveBeenCalledWith(expect.objectContaining({ sessionId: "session-snoozed-2", isSnoozed: false }))
    expect(mocks.showPanelWindow).not.toHaveBeenCalled()
    expect(mocks.resizePanelForAgentMode).not.toHaveBeenCalled()
  })

  it("auto-shows without pinning the panel beside the main window", async () => {
    mocks.isSessionSnoozed.mockReturnValue(false)

    await emitAgentProgress({ sessionId: "session-auto-show", currentIteration: 0, maxIterations: 1, steps: [], isComplete: false })

    expect(mocks.resizePanelForAgentMode).toHaveBeenCalledTimes(1)
    expect(mocks.showPanelWindow).toHaveBeenCalledWith({ markOpenedWithMain: false })
  })

  it("keeps unsnoozed sessions from auto-showing the panel when launch state suppresses it", async () => {
    mocks.isSessionSnoozed.mockReturnValue(false)
    mocks.getSession.mockReturnValue({ suppressPanelAutoShow: true })

    await emitAgentProgress({ sessionId: "session-tile-visible", currentIteration: 0, maxIterations: 1, steps: [], isComplete: false })

    expect(mocks.sendSpy).toHaveBeenCalledWith(expect.objectContaining({ sessionId: "session-tile-visible", isSnoozed: false }))
    expect(mocks.resizePanelForAgentMode).not.toHaveBeenCalled()
    expect(mocks.showPanelWindow).not.toHaveBeenCalled()
  })

  it("keeps agent progress out of the panel when panel progress is disabled", async () => {
    mocks.config.floatingPanelAgentProgressEnabled = false
    mocks.panelWindow.isVisible.mockReturnValue(true)
    mocks.isSessionSnoozed.mockReturnValue(false)

    await emitAgentProgress({ sessionId: "session-panel-disabled", currentIteration: 0, maxIterations: 1, steps: [], isComplete: false })

    expect(mocks.sendSpy).toHaveBeenCalledTimes(1)
    expect(mocks.sendSpy).toHaveBeenCalledWith(expect.objectContaining({ sessionId: "session-panel-disabled" }))
    expect(mocks.resizePanelForAgentMode).not.toHaveBeenCalled()
    expect(mocks.showPanelWindow).not.toHaveBeenCalled()
    expect(mocks.closeAgentModeAndHidePanelWindow).toHaveBeenCalledTimes(1)
    // Must preserve shouldStopAgent so a trailing update can't undo an emergency stop.
    expect(mocks.closeAgentModeAndHidePanelWindow).toHaveBeenCalledWith({ preserveAgentStopState: true })
  })

  it("does not clear the hidden panel when panel progress is disabled", async () => {
    mocks.config.floatingPanelAgentProgressEnabled = false
    mocks.appState.isAgentModeActive = true
    mocks.isSessionSnoozed.mockReturnValue(false)

    await emitAgentProgress({ sessionId: "session-panel-disabled-hidden", currentIteration: 0, maxIterations: 1, steps: [], isComplete: false })

    expect(mocks.sendSpy).toHaveBeenCalledTimes(1)
    expect(mocks.resizePanelForAgentMode).not.toHaveBeenCalled()
    expect(mocks.showPanelWindow).not.toHaveBeenCalled()
    expect(mocks.closeAgentModeAndHidePanelWindow).not.toHaveBeenCalled()
  })

  it("does not close an active waveform recording when panel progress is disabled", async () => {
    mocks.config.floatingPanelAgentProgressEnabled = false
    mocks.appState.isRecording = true
    mocks.isSessionSnoozed.mockReturnValue(false)

    await emitAgentProgress({ sessionId: "session-panel-disabled-recording", currentIteration: 0, maxIterations: 1, steps: [], isComplete: false })

    expect(mocks.sendSpy).toHaveBeenCalledTimes(1)
    expect(mocks.resizePanelForAgentMode).not.toHaveBeenCalled()
    expect(mocks.showPanelWindow).not.toHaveBeenCalled()
    expect(mocks.closeAgentModeAndHidePanelWindow).not.toHaveBeenCalled()
  })

  it("sends terminal delegation updates immediately instead of leaving them behind the throttle", async () => {
    mocks.isSessionSnoozed.mockReturnValue(false)

    await emitAgentProgress({
      sessionId: "session-terminal-delegation",
      runId: 1,
      currentIteration: 0,
      maxIterations: 1,
      isComplete: false,
      steps: [{
        id: "delegation-1",
        type: "completion",
        title: "Sub-agent",
        status: "completed",
        timestamp: 1,
        delegation: {
          runId: "delegated-run-1",
          agentName: "internal",
          task: "Nested work",
          status: "completed",
          startTime: 1,
          endTime: 2,
        },
      }],
    })

    expect(mocks.sendSpy).toHaveBeenCalledWith(expect.objectContaining({
      sessionId: "session-terminal-delegation",
      steps: [expect.objectContaining({ status: "completed" })],
    }))
  })

  it("does not treat already-terminal delegation steps as critical on later updates", async () => {
    vi.useFakeTimers()
    mocks.isSessionSnoozed.mockReturnValue(false)

    const terminalStep = {
      id: "delegation-repeat-1",
      type: "completion" as const,
      title: "Sub-agent",
      status: "completed" as const,
      timestamp: 1,
      delegation: {
        runId: "delegated-repeat-1",
        agentName: "internal",
        task: "Nested work",
        status: "completed" as const,
        startTime: 1,
        endTime: 2,
      },
    }

    await emitAgentProgress({
      sessionId: "session-terminal-repeat",
      runId: 1,
      currentIteration: 0,
      maxIterations: 1,
      isComplete: false,
      steps: [terminalStep],
    })

    const firstSendCount = mocks.sendSpy.mock.calls.length

    await emitAgentProgress({
      sessionId: "session-terminal-repeat",
      runId: 1,
      currentIteration: 0,
      maxIterations: 1,
      isComplete: false,
      steps: [terminalStep],
    })

    // Second update is no longer "critical", so it should be throttled.
    expect(mocks.sendSpy.mock.calls.length).toBe(firstSendCount)

    vi.advanceTimersByTime(250)
    expect(mocks.sendSpy.mock.calls.length).toBeGreaterThan(firstSendCount)
    vi.useRealTimers()
  })

  it("sends the first run-scoped session update immediately", async () => {
    vi.useFakeTimers()
    mocks.isSessionSnoozed.mockReturnValue(false)

    await emitAgentProgress({
      sessionId: "session-first-run-update",
      runId: 42,
      currentIteration: 0,
      maxIterations: 1,
      isComplete: false,
      steps: [],
    })

    const firstSendCount = mocks.sendSpy.mock.calls.length
    expect(firstSendCount).toBeGreaterThan(0)

    await emitAgentProgress({
      sessionId: "session-first-run-update",
      runId: 42,
      currentIteration: 0,
      maxIterations: 1,
      isComplete: false,
      steps: [],
    })

    // Follow-up update should be throttled because only the first update is critical.
    expect(mocks.sendSpy.mock.calls.length).toBe(firstSendCount)

    vi.advanceTimersByTime(250)
    expect(mocks.sendSpy.mock.calls.length).toBeGreaterThan(firstSendCount)
    vi.useRealTimers()
  })

  it("sends the first run-scoped update immediately after prior unscoped updates", async () => {
    vi.useFakeTimers()
    mocks.isSessionSnoozed.mockReturnValue(false)

    await emitAgentProgress({
      sessionId: "session-first-run-after-unscoped",
      currentIteration: 0,
      maxIterations: 1,
      isComplete: false,
      steps: [],
    })

    const unscopedSendCount = mocks.sendSpy.mock.calls.length
    expect(unscopedSendCount).toBeGreaterThan(0)

    await emitAgentProgress({
      sessionId: "session-first-run-after-unscoped",
      runId: 99,
      currentIteration: 0,
      maxIterations: 1,
      isComplete: false,
      steps: [],
    })

    const firstRunScopedSendCount = mocks.sendSpy.mock.calls.length
    // The first run-scoped update should bypass throttling even with existing unscoped state.
    expect(firstRunScopedSendCount).toBeGreaterThan(unscopedSendCount)

    await emitAgentProgress({
      sessionId: "session-first-run-after-unscoped",
      runId: 99,
      currentIteration: 0,
      maxIterations: 1,
      isComplete: false,
      steps: [],
    })

    // Follow-up run-scoped updates should be throttled.
    expect(mocks.sendSpy.mock.calls.length).toBe(firstRunScopedSendCount)
    vi.advanceTimersByTime(250)
    expect(mocks.sendSpy.mock.calls.length).toBeGreaterThan(firstRunScopedSendCount)
    vi.useRealTimers()
  })

  it("does not repeatedly bypass throttling for terminal delegations without stable identity", async () => {
    vi.useFakeTimers()
    mocks.isSessionSnoozed.mockReturnValue(false)

    await emitAgentProgress({
      sessionId: "session-unstable-terminal",
      runId: 7,
      currentIteration: 0,
      maxIterations: 1,
      isComplete: false,
      steps: [{
        type: "completion",
        title: "Sub-agent A",
        status: "completed",
        delegation: {
          agentName: "internal",
          task: "Nested work",
          status: "completed",
        } as any,
      } as any],
    })

    const firstSendCount = mocks.sendSpy.mock.calls.length

    await emitAgentProgress({
      sessionId: "session-unstable-terminal",
      runId: 7,
      currentIteration: 0,
      maxIterations: 1,
      isComplete: false,
      steps: [{
        type: "completion",
        title: "Sub-agent B",
        status: "completed",
        delegation: {
          agentName: "internal",
          task: "Nested work",
          status: "completed",
        } as any,
      } as any],
    })

    expect(mocks.sendSpy.mock.calls.length).toBe(firstSendCount)
    vi.advanceTimersByTime(250)
    expect(mocks.sendSpy.mock.calls.length).toBeGreaterThan(firstSendCount)
    vi.useRealTimers()
  })
})
