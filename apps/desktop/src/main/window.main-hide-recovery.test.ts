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
const mockGetFocusedWindow = vi.fn()
const mockRendererHandlers = {
  hideTextInput: { send: vi.fn() },
  navigate: { send: vi.fn() },
  onPanelSizeChanged: { send: vi.fn() },
  showTextInput: { send: vi.fn() },
  stopRecording: { send: vi.fn() },
}

let mockConfig = {
  hideDockIcon: false,
  hidePanelWhenMainFocused: true,
}

class MockBrowserWindow extends EventEmitter {
  visible = false
  minimized = false
  focused = false
  width = 900
  height = 670
  loadURL = vi.fn()
  focus = vi.fn(() => {
    this.focused = true
    this.emit("focus")
  })
  restore = vi.fn(() => {
    this.minimized = false
    this.emit("restore")
  })
  show = vi.fn(() => {
    this.visible = true
    this.focused = true
    this.emit("show")
  })
  showInactive = vi.fn(() => {
    this.visible = true
    this.focused = false
    this.emit("show")
  })
  hide = vi.fn(() => {
    this.visible = false
    this.focused = false
    this.emit("hide")
  })
  isVisible = vi.fn(() => this.visible)
  isFocused = vi.fn(() => this.focused)
  isMinimized = vi.fn(() => this.minimized)
  setAlwaysOnTop = vi.fn()
  setClosable = vi.fn()
  setFocusable = vi.fn()
  setMinimumSize = vi.fn()
  setPosition = vi.fn()
  setSize = vi.fn((width: number, height: number) => {
    this.width = width
    this.height = height
  })
  setVisibleOnAllWorkspaces = vi.fn()
  getSize = vi.fn(() => [this.width, this.height])
  isClosable = vi.fn(() => true)
  webContents = Object.assign(new EventEmitter(), {
    id: 1,
    isLoading: vi.fn(() => false),
    setWindowOpenHandler: vi.fn(),
  })
}

vi.mock("electron", () => ({
  BrowserWindow: Object.assign(MockBrowserWindow, {
    getFocusedWindow: mockGetFocusedWindow,
  }),
  app: mockApp,
  screen: {},
  shell: { openExternal: vi.fn() },
}))

vi.mock("@egoist/tipc/main", () => ({
  getRendererHandlers: vi.fn(() => mockRendererHandlers),
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

vi.mock("@dotagents/core", () => ({
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
    mockGetFocusedWindow.mockReturnValue(null)
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

  it("skips main-window hide recovery when the app is deactivating to another app", async () => {
    vi.useFakeTimers()

    try {
      const { createMainWindow } = await import("./window")
      const win = createMainWindow()

      expect(win).toBeDefined()

      mockGetFocusedWindow.mockReturnValue(null)
      win?.emit("blur")
      win?.emit("hide")

      await vi.runAllTimersAsync()

      expect(mockEnsureAppSwitcherPresence).not.toHaveBeenCalled()
      expect(mockApp.show).not.toHaveBeenCalled()
      expect(win?.show).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it("does not restore the floating panel when the app is deactivating", async () => {
    vi.useFakeTimers()

    try {
      const { WINDOWS, createMainWindow } = await import("./window")
      const win = createMainWindow()
      const panel = new MockBrowserWindow()
      panel.visible = true
      WINDOWS.set("panel", panel as any)

      expect(win).toBeDefined()

      win?.emit("focus")
      expect(panel.hide).toHaveBeenCalledTimes(1)
      expect(panel.isVisible()).toBe(false)

      mockGetFocusedWindow.mockReturnValue(null)
      win?.emit("blur")
      await vi.runAllTimersAsync()

      expect(panel.showInactive).not.toHaveBeenCalled()
      expect(panel.isVisible()).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it("restores the floating panel when the app remains active", async () => {
    vi.useFakeTimers()

    try {
      const { WINDOWS, createMainWindow } = await import("./window")
      const win = createMainWindow()
      const panel = new MockBrowserWindow()
      panel.visible = true
      WINDOWS.set("panel", panel as any)

      expect(win).toBeDefined()

      win?.emit("focus")
      expect(panel.hide).toHaveBeenCalledTimes(1)
      expect(panel.isVisible()).toBe(false)

      mockGetFocusedWindow.mockReturnValue(panel)
      win?.emit("blur")
      await vi.runAllTimersAsync()

      expect(panel.showInactive).toHaveBeenCalledTimes(1)
      expect(panel.setVisibleOnAllWorkspaces).toHaveBeenCalled()
      expect(panel.setAlwaysOnTop).toHaveBeenCalled()
      expect(panel.isVisible()).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it("preserves a visible main window when opening text input from another app", async () => {
    vi.useFakeTimers()

    try {
      const keyboard = await import("./keyboard")
      vi.mocked(keyboard.getFocusedAppInfo).mockResolvedValue("Other App")

      const { createMainWindow, createPanelWindow, showPanelWindowAndShowTextInput } = await import("./window")
      const main = createMainWindow() as MockBrowserWindow | undefined
      const panel = createPanelWindow() as MockBrowserWindow | undefined

      expect(main).toBeDefined()
      expect(panel).toBeDefined()

      if (!main || !panel) return

      main.visible = true
      main.focused = false
      mockGetFocusedWindow.mockReturnValue(null)

      await showPanelWindowAndShowTextInput()
      await vi.runAllTimersAsync()

      // Main window must remain visible across the text-input open flow so the
      // user's prior window state is preserved when the prompt is submitted.
      expect(main.hide).not.toHaveBeenCalled()
      expect(main.isVisible()).toBe(true)
      expect(mockApp.show).not.toHaveBeenCalled()
      expect(panel.showInactive).toHaveBeenCalledTimes(1)
      expect(mockRendererHandlers.showTextInput.send).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  it("does not hide a hidden main window when opening text input from another app", async () => {
    vi.useFakeTimers()

    try {
      const keyboard = await import("./keyboard")
      vi.mocked(keyboard.getFocusedAppInfo).mockResolvedValue("Other App")

      const { createMainWindow, createPanelWindow, showPanelWindowAndShowTextInput } = await import("./window")
      const main = createMainWindow() as MockBrowserWindow | undefined
      const panel = createPanelWindow() as MockBrowserWindow | undefined

      expect(main).toBeDefined()
      expect(panel).toBeDefined()

      if (!main || !panel) return

      main.visible = false
      main.focused = false
      mockGetFocusedWindow.mockReturnValue(null)

      await showPanelWindowAndShowTextInput()
      await vi.runAllTimersAsync()

      expect(main.hide).not.toHaveBeenCalled()
      expect(main.show).not.toHaveBeenCalled()
      expect(main.isVisible()).toBe(false)
      expect(panel.showInactive).toHaveBeenCalledTimes(1)
      expect(mockRendererHandlers.showTextInput.send).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })
})