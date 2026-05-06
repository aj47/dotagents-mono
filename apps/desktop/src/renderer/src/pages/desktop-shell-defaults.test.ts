import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const settingsGeneralSource = readFileSync(new URL("./settings-general.tsx", import.meta.url), "utf8")
const panelSource = readFileSync(new URL("./panel.tsx", import.meta.url), "utf8")

describe("desktop shell renderer defaults", () => {
  it("uses shared defaults in general settings", () => {
    expect(settingsGeneralSource).toContain("DEFAULT_HIDE_DOCK_ICON")
    expect(settingsGeneralSource).toContain("configQuery.data.hideDockIcon ?? DEFAULT_HIDE_DOCK_ICON")
    expect(settingsGeneralSource).toContain("DEFAULT_LAUNCH_AT_LOGIN")
    expect(settingsGeneralSource).toContain("configQuery.data.launchAtLogin ?? DEFAULT_LAUNCH_AT_LOGIN")
    expect(settingsGeneralSource).toContain("DEFAULT_PANEL_POSITION")
    expect(settingsGeneralSource).toContain("configQuery.data?.panelPosition ?? DEFAULT_PANEL_POSITION")
    expect(settingsGeneralSource).toContain("DEFAULT_PANEL_DRAG_ENABLED")
    expect(settingsGeneralSource).toContain("configQuery.data?.panelDragEnabled ?? DEFAULT_PANEL_DRAG_ENABLED")
    expect(settingsGeneralSource).toContain("DEFAULT_FLOATING_PANEL_AUTO_SHOW")
    expect(settingsGeneralSource).toContain("configQuery.data?.floatingPanelAutoShow ?? DEFAULT_FLOATING_PANEL_AUTO_SHOW")
    expect(settingsGeneralSource).toContain("DEFAULT_HIDE_PANEL_WHEN_MAIN_FOCUSED")
    expect(settingsGeneralSource).toContain(
      "configQuery.data?.hidePanelWhenMainFocused ?? DEFAULT_HIDE_PANEL_WHEN_MAIN_FOCUSED",
    )
  })

  it("uses the shared panel drag default in the panel renderer", () => {
    expect(panelSource).toContain("DEFAULT_PANEL_DRAG_ENABLED")
    expect(panelSource).toContain("(configQuery.data as any)?.panelDragEnabled ?? DEFAULT_PANEL_DRAG_ENABLED")
  })
})
