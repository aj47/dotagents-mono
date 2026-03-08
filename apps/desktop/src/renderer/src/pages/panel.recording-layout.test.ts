import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const panelSource = readFileSync(new URL("./panel.tsx", import.meta.url), "utf8")
const mainWindowSource = readFileSync(new URL("../../../main/window.ts", import.meta.url), "utf8")
const tipcSource = readFileSync(new URL("../../../main/tipc.ts", import.meta.url), "utf8")
const configSource = readFileSync(new URL("../../../main/config.ts", import.meta.url), "utf8")

describe("panel recording layout", () => {
  it("wraps the recording footer controls for narrow widths and zoomed text", () => {
    expect(panelSource).toContain(
      'className="mt-1 flex max-w-[calc(100%-2rem)] flex-wrap items-center justify-center gap-2 px-4 text-center"'
    )
    expect(panelSource).toContain(
      'className="min-w-0 text-center text-xs leading-relaxed text-muted-foreground"'
    )
  })

  it("caps recording badges to the available viewport width", () => {
    expect(panelSource).toContain('max-w-[calc(100%-2rem)] items-center gap-1 rounded')
    expect(panelSource).toContain('className="min-w-0 truncate font-medium"')
  })

  it("keeps a wider compact-width floor for the floating recording panel", () => {
    expect(panelSource).toContain("const WAVEFORM_PANEL_CONTENT_MIN_WIDTH_PX = 360")
    expect(panelSource).toContain("WAVEFORM_PANEL_CONTENT_MIN_WIDTH_PX")
    expect(mainWindowSource).toContain("const WAVEFORM_PANEL_CONTENT_MIN_WIDTH = 360")
    expect(mainWindowSource).toContain(
      "return Math.max(waveformWidth, WAVEFORM_PANEL_CONTENT_MIN_WIDTH)"
    )
  })

  it("gives text input its own safer min width, height, and persisted size bucket", () => {
    expect(panelSource).toContain("const TEXT_INPUT_MIN_WIDTH_PX = 380")
    expect(panelSource).toContain("const TEXT_INPUT_MIN_HEIGHT = 180")
    expect(panelSource).toContain("const minWidth = showTextInput ? TEXT_INPUT_MIN_WIDTH_PX : MIN_WAVEFORM_WIDTH")
    expect(mainWindowSource).toContain("export const TEXT_INPUT_MIN_WIDTH = textInputPanelWindowSize.width")
    expect(mainWindowSource).toContain('return getSavedPanelSize("textInput")')
    expect(tipcSource).toContain("updatedConfig.panelTextInputSize = { width, height }")
    expect(configSource).toContain("panelCustomSize: undefined")
    expect(configSource).toContain("panelTextInputSize: undefined")
  })

  it("resets stale text-input mode when the panel is hidden or stopped", () => {
    expect(panelSource).toContain('lastRequestedModeRef.current = "textInput"')
    expect(panelSource).toContain('lastRequestedModeRef.current = "normal"')
    expect(mainWindowSource).toContain('export const stopTextInputAndHidePanelWindow = () => {')
    expect(mainWindowSource).toContain('export const closeAgentModeAndHidePanelWindow = () => {')
    expect(mainWindowSource).toContain('export function hideFloatingPanelWindow()')
    expect(mainWindowSource).toContain('setPanelMode("normal")')
    expect(tipcSource).toContain('state.isTextInputActive = false')
    expect(tipcSource).toContain('hideFloatingPanelWindow()')
  })

  it("shows explicit pending and fallback content instead of a blank shell", () => {
    expect(panelSource).toContain("const isVoiceSubmissionPending =")
    expect(panelSource).toContain("const hasRenderableProgressOverlay =")
    expect(panelSource).toContain("Processing your recording...")
    expect(panelSource).toContain("Ready when you are")
    expect(panelSource).toContain(
      "Use your voice shortcut or open text input to start a new session."
    )
    expect(panelSource).toContain("!isVoiceSubmissionPending")
    expect(panelSource).toContain("showsAgentOverlay: hasRenderableProgressOverlay")
  })
})