import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const sources = {
  emitAgentProgress: readFileSync(new URL("./emit-agent-progress.ts", import.meta.url), "utf8"),
  panelPosition: readFileSync(new URL("./panel-position.ts", import.meta.url), "utf8"),
  tray: readFileSync(new URL("./tray.ts", import.meta.url), "utf8"),
  window: readFileSync(new URL("./window.ts", import.meta.url), "utf8"),
}

describe("desktop shell main-process defaults", () => {
  it("uses shared panel visibility defaults in main-process panel behavior", () => {
    expect(sources.emitAgentProgress).toContain("DEFAULT_FLOATING_PANEL_AUTO_SHOW")
    expect(sources.emitAgentProgress).toContain("DEFAULT_HIDE_PANEL_WHEN_MAIN_FOCUSED")
    expect(sources.emitAgentProgress).toContain(
      "config.floatingPanelAutoShow ?? DEFAULT_FLOATING_PANEL_AUTO_SHOW",
    )
    expect(sources.emitAgentProgress).toContain(
      "config.hidePanelWhenMainFocused ?? DEFAULT_HIDE_PANEL_WHEN_MAIN_FOCUSED",
    )
    expect(sources.tray).toContain("configStore.get().floatingPanelAutoShow ?? DEFAULT_FLOATING_PANEL_AUTO_SHOW")
    expect(sources.window).toContain("config.hidePanelWhenMainFocused ?? DEFAULT_HIDE_PANEL_WHEN_MAIN_FOCUSED")
    expect(sources.window).toContain("config.floatingPanelAutoShow ?? DEFAULT_FLOATING_PANEL_AUTO_SHOW")
  })

  it("uses the shared default panel position in main-process positioning", () => {
    expect(sources.panelPosition).toContain("DEFAULT_PANEL_POSITION")
    expect(sources.panelPosition).toContain("config.panelPosition ?? DEFAULT_PANEL_POSITION")
    expect(sources.window).toContain("panelPosition: DEFAULT_PANEL_POSITION")
  })
})
