import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  sendSpy: vi.fn(),
  showPanelWindow: vi.fn(),
  resizePanelForAgentMode: vi.fn(),
  isSessionSnoozed: vi.fn(),
  shouldStopSession: vi.fn(() => false),
  getSessionRunId: vi.fn(() => undefined),
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
}))

vi.mock("./state", () => ({
  isPanelAutoShowSuppressed: vi.fn(() => false),
  agentSessionStateManager: { shouldStopSession: mocks.shouldStopSession, getSessionRunId: mocks.getSessionRunId },
}))

vi.mock("./agent-session-tracker", () => ({
  agentSessionTracker: { isSessionSnoozed: mocks.isSessionSnoozed },
}))

vi.mock("./config", () => ({
  configStore: { get: () => ({ floatingPanelAutoShow: true, hidePanelWhenMainFocused: true }) },
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
    mocks.isSessionSnoozed.mockReset()
    mocks.shouldStopSession.mockClear()
    mocks.getSessionRunId.mockClear()
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
})