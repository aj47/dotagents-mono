import { readFileSync } from "node:fs"
import { EventEmitter } from "events"
import { beforeEach, describe, expect, it, vi } from "vitest"

const keyboardSource = readFileSync(new URL("./keyboard.ts", import.meta.url), "utf8")

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

class ExitBeforeHandlerChildProcess extends FakeChildProcess {
  override once(eventName: string | symbol, listener: (...args: any[]) => void): this {
    if (eventName === "exit" && this.exitCode === null) {
      this.exitCode = 0
      this.emit("exit", 0, null)
    }

    return super.once(eventName, listener)
  }

  override kill = vi.fn(() => false)
}

class StuckChildProcess extends FakeChildProcess {
  override kill = vi.fn((signal?: NodeJS.Signals) => {
    this.killed = true
    this.signalCode = signal ?? null
    return true
  })
}

class FalseForceKillChildProcess extends FakeChildProcess {
  override kill = vi.fn((signal?: NodeJS.Signals) => {
    this.signalCode = signal ?? null
    if (signal === "SIGKILL") {
      return false
    }

    this.killed = true
    return true
  })
}

describe("keyboard listener lifecycle", () => {
  beforeEach(() => {
    vi.resetModules()
    mockSpawn.mockReset()
    vi.useRealTimers()
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

  it("resolves stop when the child exits during shutdown handler registration", async () => {
    const exitingChild = new ExitBeforeHandlerChildProcess()
    const replacementChild = new FakeChildProcess()
    mockSpawn.mockReturnValueOnce(exitingChild).mockReturnValueOnce(replacementChild)

    const { listenToKeyboardEvents, stopListeningToKeyboardEvents } = await import("./keyboard")

    listenToKeyboardEvents()
    await stopListeningToKeyboardEvents()
    listenToKeyboardEvents()

    expect(exitingChild.kill).not.toHaveBeenCalled()
    expect(mockSpawn).toHaveBeenCalledTimes(2)
  })

  it("does not leave a stale resolved stop promise behind after a replacement listener starts", async () => {
    const exitingChild = new ExitBeforeHandlerChildProcess()
    const replacementChild = new FakeChildProcess()
    const thirdChild = new FakeChildProcess()
    mockSpawn
      .mockReturnValueOnce(exitingChild)
      .mockReturnValueOnce(replacementChild)
      .mockReturnValueOnce(thirdChild)

    const { listenToKeyboardEvents, stopListeningToKeyboardEvents } = await import("./keyboard")

    listenToKeyboardEvents()
    await stopListeningToKeyboardEvents()

    listenToKeyboardEvents()
    await stopListeningToKeyboardEvents()

    listenToKeyboardEvents()

    expect(replacementChild.kill).toHaveBeenCalledWith("SIGTERM")
    expect(mockSpawn).toHaveBeenCalledTimes(3)
  })

  it("resolves stop after the force-kill timeout without allowing a duplicate restart", async () => {
    vi.useFakeTimers()

    const stuckChild = new StuckChildProcess()
    const replacementChild = new FakeChildProcess()
    mockSpawn.mockReturnValueOnce(stuckChild).mockReturnValueOnce(replacementChild)

    const { listenToKeyboardEvents, stopListeningToKeyboardEvents } = await import("./keyboard")

    listenToKeyboardEvents()
    const stopPromise = stopListeningToKeyboardEvents()

    await vi.advanceTimersByTimeAsync(1250)
    await stopPromise
    listenToKeyboardEvents()

    expect(stuckChild.kill).toHaveBeenNthCalledWith(1, "SIGTERM")
    expect(stuckChild.kill).toHaveBeenNthCalledWith(2, "SIGKILL")
    expect(mockSpawn).toHaveBeenCalledTimes(1)

    stuckChild.exitCode = 0
    stuckChild.emit("exit", 0, "SIGKILL")
    listenToKeyboardEvents()

    expect(mockSpawn).toHaveBeenCalledTimes(2)
  })

  it("resolves stop when the force-kill attempt returns false", async () => {
    vi.useFakeTimers()

    const stubbornChild = new FalseForceKillChildProcess()
    const replacementChild = new FakeChildProcess()
    mockSpawn.mockReturnValueOnce(stubbornChild).mockReturnValueOnce(replacementChild)

    const { listenToKeyboardEvents, stopListeningToKeyboardEvents } = await import("./keyboard")

    listenToKeyboardEvents()
    const stopPromise = stopListeningToKeyboardEvents()

    await vi.advanceTimersByTimeAsync(1000)
    await stopPromise
    listenToKeyboardEvents()

    expect(stubbornChild.kill).toHaveBeenNthCalledWith(1, "SIGTERM")
    expect(stubbornChild.kill).toHaveBeenNthCalledWith(2, "SIGKILL")
    expect(mockSpawn).toHaveBeenCalledTimes(1)

    stubbornChild.exitCode = 0
    stubbornChild.emit("exit", 0, null)
    listenToKeyboardEvents()

    expect(mockSpawn).toHaveBeenCalledTimes(2)
  })
})

describe("keyboard Escape handling", () => {
  it("routes visible text-input Escape dismissals through the text-input hide path before snoozing", () => {
    const escapeSection = keyboardSource.slice(
      keyboardSource.indexOf('if (e.data.key === "Escape") {'),
      keyboardSource.indexOf("// Handle other kill switch hotkeys"),
    )

    expect(escapeSection).toContain("} else if (state.isTextInputActive) {")
    expect(escapeSection).toContain("stopTextInputAndHidePanelWindow()")
    expect(escapeSection.indexOf("stopTextInputAndHidePanelWindow()")).toBeLessThan(
      escapeSection.indexOf("snoozeAgentSessionsAndHidePanelWindow()"),
    )
  })
})
