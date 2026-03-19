import { EventEmitter } from "events"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mockSpawn = vi.fn()

vi.mock("child_process", () => ({
  spawn: (...args: unknown[]) => mockSpawn(...args),
}))

vi.mock("electron", () => ({ systemPreferences: {} }))
vi.mock("./window", () => ({
  WINDOWS: new Map(),
  emergencyStopAgentMode: vi.fn(),
  getWindowRendererHandlers: vi.fn(() => undefined),
  showMainWindow: vi.fn(),
  showPanelWindowAndShowTextInput: vi.fn(),
  showPanelWindowAndStartMcpRecording: vi.fn(),
  showPanelWindowAndStartRecording: vi.fn(),
  stopRecordingAndHidePanelWindow: vi.fn(),
  stopTextInputAndHidePanelWindow: vi.fn(),
}))
vi.mock("./floating-panel-session-state", () => ({
  snoozeAgentSessionsAndHidePanelWindow: vi.fn(),
}))
vi.mock("./config", () => ({ configStore: { get: vi.fn(() => ({})) } }))
vi.mock("./state", () => ({
  state: {
    isAgentModeActive: false,
    isRecording: false,
    isRecordingFromButtonClick: false,
    isRecordingMcpMode: false,
    isTextInputActive: false,
    isToggleRecordingActive: false,
  },
  agentProcessManager: { registerProcess: vi.fn() },
}))
vi.mock("./conversation-service", () => ({
  conversationService: { getMostRecentConversation: vi.fn() },
}))
vi.mock("../shared/key-utils", () => ({
  getEffectiveShortcut: vi.fn(() => undefined),
  matchesKeyCombo: vi.fn(() => false),
}))
vi.mock("./debug", () => ({ isDebugKeybinds: vi.fn(() => false), logKeybinds: vi.fn() }))

class FakeChildProcess extends EventEmitter {
  stdout = new EventEmitter()
  stderr = new EventEmitter()
  exitCode: number | null = null
  signalCode: NodeJS.Signals | null = null
  killed = false
  kill = vi.fn((signal?: NodeJS.Signals) => {
    this.killed = true
    queueMicrotask(() => {
      this.signalCode = signal ?? null
      this.emit("exit", null, signal ?? null)
    })
    return true
  })
}

describe("keyboard listener lifecycle", () => {
  beforeEach(() => {
    vi.resetModules()
    mockSpawn.mockReset()
  })

  it("does not spawn duplicate keyboard listeners while one is active", async () => {
    const child = new FakeChildProcess()
    mockSpawn.mockReturnValue(child)

    const { listenToKeyboardEvents } = await import("./keyboard")

    listenToKeyboardEvents()
    listenToKeyboardEvents()

    expect(mockSpawn).toHaveBeenCalledTimes(1)
  })

  it("stops the active keyboard listener and allows a clean restart", async () => {
    const firstChild = new FakeChildProcess()
    const secondChild = new FakeChildProcess()
    mockSpawn.mockReturnValueOnce(firstChild).mockReturnValueOnce(secondChild)

    const { listenToKeyboardEvents, stopListeningToKeyboardEvents } = await import("./keyboard")

    listenToKeyboardEvents()
    await stopListeningToKeyboardEvents()
    listenToKeyboardEvents()

    expect(firstChild.kill).toHaveBeenCalledWith("SIGTERM")
    expect(mockSpawn).toHaveBeenCalledTimes(2)
  })
})