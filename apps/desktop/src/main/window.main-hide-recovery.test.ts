import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { EventEmitter } from "events"

const mockApp = {
  dock: {
    hide: vi.fn(),
    isVisible: vi.fn(() => true),
    show: vi.fn(),
  },
  isHidden: vi.fn(() => false),
  setActivationPolicy: vi.fn(),
  show: vi.fn(),
}

const mockEnsureAppSwitcherPresence = vi.fn()

let mockConfig = {
  hideDockIcon: false,
  hidePanelWhenMainFocused: true,
}

class MockBrowserWindow extends EventEmitter {
  visible = false
  minimized = false
  loadURL = vi.fn()
  focus = vi.fn(() => this.emit("focus"))
  restore = vi.fn(() => {
    this.minimized = false
    this.emit("restore")
  })
  show = vi.fn(() => {
    this.visible = true
    this.emit("show")
  })
  hide = vi.fn(() => {
    this.visible = false
    this.emit("hide")
  })
  isVisible = vi.fn(() => this.visible)
  isMinimized = vi.fn(() => this.minimized)
  setClosable = vi.fn()
  isClosable = vi.fn(() => true)
  webContents = Object.assign(new EventEmitter(), {
    id: 1,
    isLoading: vi.fn(() => false),
    setWindowOpenHandler: vi.fn(),
  })
}

vi.mock("electron", () => ({
  BrowserWindow: MockBrowserWindow,
  app: mockApp,
  screen: {},
  shell: { openExternal: vi.fn() },
}))

vi.mock("@egoist/tipc/main", () => ({
  getRendererHandlers: vi.fn(() => ({ navigate: { send: vi.fn() } })),
}))

vi.mock("./debug", () => ({
  logApp: vi.fn(),
  logUI: vi.fn(),
}))

vi.mock("./app-switcher", () => ({
  ensureAppSwitcherPresence: mockEnsureAppSwitcherPresence,
  showAndFocusMainWindow: vi.fn(),
}))

vi.mock("./config", () => ({
  configStore: { get: () => mockConfig },
}))

vi.mock("./keyboard", () => ({
  getFocusedAppInfo: vi.fn(),
}))

vi.mock("./state", () => ({
  agentProcessManager: {},
  isHeadlessMode: false,
  state: {},
  suppressPanelAutoShow: vi.fn(),
}))

vi.mock("./panel-position", () => ({
  calculatePanelPosition: vi.fn(() => ({ x: 0, y: 0 })),
}))

vi.mock("./console-logger", () => ({
  setupConsoleLogger: vi.fn(),
}))

vi.mock("./emergency-stop", () => ({
  emergencyStopAll: vi.fn(),
}))

describe("main window hide recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    mockConfig = {
      hideDockIcon: false,
      hidePanelWhenMainFocused: true,
    }
    process.env.IS_MAC = true
  })

  afterEach(async () => {
    const { WINDOWS } = await import("./window")
    WINDOWS.clear()
    process.env.IS_MAC = false
  })

  it("recovers the main window after an unexpected documented hide event on macOS", async () => {
    vi.useFakeTimers()

    try {
      const { createMainWindow } = await import("./window")
      const win = createMainWindow()

      expect(win).toBeDefined()
      win?.emit("hide")

      await vi.runAllTimersAsync()

      expect(mockEnsureAppSwitcherPresence).toHaveBeenCalledWith("main.hide.recover")
      expect(mockApp.show).toHaveBeenCalledTimes(1)
      expect(win?.show).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it("skips main-window hide recovery when hideDockIcon is enabled", async () => {
    vi.useFakeTimers()
    mockConfig = {
      hideDockIcon: true,
      hidePanelWhenMainFocused: true,
    }

    try {
      const { createMainWindow } = await import("./window")
      const win = createMainWindow()

      expect(win).toBeDefined()
      win?.emit("hide")

      await vi.runAllTimersAsync()

      expect(mockEnsureAppSwitcherPresence).not.toHaveBeenCalled()
      expect(mockApp.show).not.toHaveBeenCalled()
      expect(win?.show).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })
})