import { beforeEach, describe, expect, it, vi } from "vitest"
import { EventEmitter } from "events"

const buildFromTemplate = vi.fn((template) => template)
const trayInstances: MockTray[] = []

class MockTray extends EventEmitter {
  setImage = vi.fn()
  setContextMenu = vi.fn()
  popUpContextMenu = vi.fn()
  destroy = vi.fn()

  constructor(_icon: string) {
    super()
    trayInstances.push(this)
  }
}

vi.mock("electron", () => ({
  Menu: { buildFromTemplate },
  Tray: MockTray,
}))

vi.mock("./window", () => ({
  getWindowRendererHandlers: vi.fn(() => ({ finishRecording: { send: vi.fn() } })),
  hideFloatingPanelWindow: vi.fn(),
  resetFloatingPanelPositionAndSize: vi.fn(),
  resizePanelToNormal: vi.fn(),
  showMainWindow: vi.fn(),
  showPanelWindow: vi.fn(),
  showPanelWindowAndStartRecording: vi.fn(),
  stopRecordingAndHidePanelWindow: vi.fn(),
}))

vi.mock("./config", () => ({
  configStore: { get: vi.fn(() => ({ floatingPanelAutoShow: true })), save: vi.fn() },
}))

vi.mock("./state", () => ({ state: { isRecording: false } }))

describe("tray lifecycle", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    trayInstances.length = 0
    const { destroyTray } = await import("./tray")
    destroyTray()
  })

  it("destroys the previous tray before creating a new one", async () => {
    const { initTray } = await import("./tray")

    initTray()
    const firstTray = trayInstances[0]

    initTray()

    expect(firstTray.destroy).toHaveBeenCalledTimes(1)
    expect(trayInstances).toHaveLength(2)
  })

  it("destroyTray removes the active tray and clears future updates", async () => {
    const { initTray, destroyTray, updateTrayIcon } = await import("./tray")

    initTray()
    const activeTray = trayInstances[0]

    destroyTray()
    updateTrayIcon()

    expect(activeTray.setContextMenu).toHaveBeenCalledWith(null)
    expect(activeTray.destroy).toHaveBeenCalledTimes(1)
    expect(activeTray.setImage).not.toHaveBeenCalled()
  })
})