import { readFileSync } from "fs"
import { fileURLToPath } from "url"
import path from "path"
import { describe, expect, it } from "vitest"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const read = (relativePath: string) =>
  readFileSync(path.resolve(__dirname, relativePath), "utf8")

const windowSource = read("./window.ts")
const traySource = read("./tray.ts")
const tipcSource = read("./tipc.ts")
const rendererHandlersSource = read("./renderer-handlers.ts")
const settingsSource = read("../renderer/src/pages/settings-general.tsx")

describe("floating panel recovery affordances", () => {
  it("adds centralized recovery helpers in the main window layer", () => {
    expect(windowSource).toContain("export function hideFloatingPanelWindow()")
    expect(windowSource).toContain("export function resetFloatingPanelPositionAndSize(showAfterReset = true)")
    expect(windowSource).toContain("export function resetPanelSizeForCurrentMode()")
    expect(windowSource).toContain("const defaultSize = getDefaultPanelSizeForMode(mode)")
    expect(windowSource).toContain("updatedConfig.panelProgressSize = defaultSize")
    expect(windowSource).toContain("updatedConfig.panelTextInputSize = defaultSize")
    expect(windowSource).toContain("updatedConfig.panelCustomSize = defaultSize")
    expect(windowSource).toContain('panelPosition: "top-right"')
    expect(windowSource).toContain('panelCustomSize: undefined')
    expect(windowSource).toContain('panelTextInputSize: undefined')
    expect(windowSource).toContain('panelProgressSize: undefined')
  })

  it("exposes recovery actions through TIPC and tray controls", () => {
    expect(tipcSource).toContain("resetFloatingPanel: t.procedure.action(async () => {")
    expect(tipcSource).toContain("resetPanelSizeForCurrentMode: t.procedure.action(async () => {")
    expect(tipcSource).toContain("getPanelVisibility: t.procedure.action(async () => {")
    expect(tipcSource).toContain("return panel?.isVisible() ?? false")
    expect(tipcSource).toContain("hideFloatingPanelWindow()")
    expect(traySource).toContain('label: "Show Floating Panel"')
    expect(traySource).toContain('label: "Hide Floating Panel"')
    expect(traySource).toContain('label: "Reset Floating Panel Position & Size"')
    expect(traySource).toContain('label: "Auto-Show Floating Panel"')
  })

  it("broadcasts panel size and visibility changes so tiled-session hints stay in sync", () => {
    expect(rendererHandlersSource).toContain(
      "onPanelVisibilityChanged: (data: { visible: boolean }) => void",
    )
    expect(windowSource).toContain(
      "getRendererHandlers<RendererHandlers>(main.webContents).onPanelSizeChanged.send({ width, height })",
    )
    expect(windowSource).toContain(
      "getRendererHandlers<RendererHandlers>(main.webContents).onPanelVisibilityChanged.send({ visible })",
    )
    expect(windowSource).toContain("notifyPanelVisibilityChanged(false)")
    expect(windowSource).toContain("notifyPanelVisibilityChanged(true)")
  })

  it("adds settings recovery actions and clearer off-state guidance", () => {
    expect(settingsSource).toContain("const showFloatingPanelNow = useCallback(async () => {")
    expect(settingsSource).toContain("const resetFloatingPanel = useCallback(async () => {")
    expect(settingsSource).toContain("Auto-show is off. Use the quick actions below or the tray menu")
    expect(settingsSource).toContain('Show Now')
    expect(settingsSource).toContain('Reset Position & Size')
  })
})