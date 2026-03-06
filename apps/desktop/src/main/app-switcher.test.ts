import { beforeEach, describe, expect, it, vi } from "vitest"

const appMock = {
  dock: {
    isVisible: vi.fn(() => false),
    show: vi.fn(),
  },
  show: vi.fn(),
  setActivationPolicy: vi.fn(),
}

let mockConfig = { hideDockIcon: false }

vi.mock("electron", () => ({ app: appMock }))
vi.mock("./config", () => ({ configStore: { get: () => mockConfig } }))
vi.mock("./debug", () => ({ logApp: vi.fn() }))

describe("ensureAppSwitcherPresence", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockConfig = { hideDockIcon: false }
    process.env.IS_MAC = true
  })

  it("restores regular activation policy when dock icon is enabled", async () => {
    const { ensureAppSwitcherPresence } = await import("./app-switcher")

    ensureAppSwitcherPresence("test")

    expect(appMock.setActivationPolicy).toHaveBeenCalledWith("regular")
    expect(appMock.dock.show).toHaveBeenCalled()
  })

  it("respects the hideDockIcon preference", async () => {
    mockConfig = { hideDockIcon: true }
    const { ensureAppSwitcherPresence } = await import("./app-switcher")

    ensureAppSwitcherPresence("test")

    expect(appMock.setActivationPolicy).not.toHaveBeenCalled()
    expect(appMock.dock.show).not.toHaveBeenCalled()
  })

  it("shows and focuses the main window when activating the app", async () => {
    const { showAndFocusMainWindow } = await import("./app-switcher")
    const win = {
      isMinimized: vi.fn(() => true),
      restore: vi.fn(),
      show: vi.fn(),
      focus: vi.fn(),
    }

    showAndFocusMainWindow(win, "test")

    expect(appMock.setActivationPolicy).toHaveBeenCalledWith("regular")
    expect(appMock.dock.show).toHaveBeenCalled()
    expect(appMock.show).toHaveBeenCalled()
    expect(win.restore).toHaveBeenCalled()
    expect(win.show).toHaveBeenCalled()
    expect(win.focus).toHaveBeenCalled()
  })

  it("focuses the main window even when it is not minimized", async () => {
    const { showAndFocusMainWindow } = await import("./app-switcher")
    const win = {
      isMinimized: vi.fn(() => false),
      restore: vi.fn(),
      show: vi.fn(),
      focus: vi.fn(),
    }

    showAndFocusMainWindow(win, "test")

    expect(win.restore).not.toHaveBeenCalled()
    expect(win.show).toHaveBeenCalled()
    expect(win.focus).toHaveBeenCalled()
  })
})