import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import path from "path"
import { describe, expect, it } from "vitest"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const read = (relativePath: string) =>
  readFileSync(path.resolve(__dirname, relativePath), "utf8")

const windowSource = read("./window.ts")
const rendererHandlersSource = read("./renderer-handlers.ts")
const traySource = read("./tray.ts")
const tipcSource = read("./tipc.ts")
const settingsSource = read("../renderer/src/pages/settings-general.tsx")

describe("floating panel recovery affordances", () => {
  it("adds centralized recovery helpers in the main window layer", () => {
    expect(windowSource).toContain("export function hideFloatingPanelWindow()")
    expect(windowSource).toContain("export function resetFloatingPanelPositionAndSize(showAfterReset = true)")
    expect(windowSource).toContain("function notifyFloatingPanelLayoutStateChanged()")
    expect(windowSource).toContain("notifyFloatingPanelLayoutStateChanged()")
    expect(windowSource).toContain('panelPosition: "top-right"')
    expect(windowSource).toContain('panelCustomSize: undefined')
    expect(windowSource).toContain('panelTextInputSize: undefined')
    expect(windowSource).toContain('panelProgressSize: undefined')
  })

  it("exposes a renderer event so tiled sessions can react to panel visibility and mode changes", () => {
    expect(rendererHandlersSource).toContain("onFloatingPanelLayoutStateChanged: () => void")
    expect(windowSource).toContain("onFloatingPanelLayoutStateChanged.send()")
  })

  it("exposes recovery actions through TIPC and tray controls", () => {
    expect(tipcSource).toContain("resetFloatingPanel: t.procedure.action(async () => {")
    expect(tipcSource).toContain("getFloatingPanelLayoutState: t.procedure.action(async () => {")
    expect(tipcSource).toContain("isVisible: panel.isVisible()")
    expect(tipcSource).toContain("minWidth,")
    expect(tipcSource).toContain("hideFloatingPanelWindow()")
    expect(traySource).toContain('label: "Show Floating Panel"')
    expect(traySource).toContain('label: "Hide Floating Panel"')
    expect(traySource).toContain('label: "Reset Floating Panel Position & Size"')
    expect(traySource).toContain('label: "Auto-Show Floating Panel"')
  })

  it("adds settings recovery actions and clearer off-state guidance", () => {
    expect(settingsSource).toContain("const showFloatingPanelNow = useCallback(async () => {")
    expect(settingsSource).toContain("const resetFloatingPanel = useCallback(async () => {")
    expect(settingsSource).toContain("Auto-show is off. Use the quick actions below or the tray menu")
    expect(settingsSource).toContain('Show Now')
    expect(settingsSource).toContain('Reset Position & Size')
  })
})