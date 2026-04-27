import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const panelSource = readFileSync(new URL("./panel.tsx", import.meta.url), "utf8")
const mainWindowSource = readFileSync(new URL("../../../main/window.ts", import.meta.url), "utf8")
const tipcSource = readFileSync(new URL("../../../main/tipc.ts", import.meta.url), "utf8")
const panelResizeWrapperSource = readFileSync(new URL("../components/panel-resize-wrapper.tsx", import.meta.url), "utf8")

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

  it("keeps a compact default footprint for the floating recording panel", () => {
    expect(panelSource).toContain("const DEFAULT_VISUALIZER_BAR_COUNT = 52")
    expect(panelSource).toContain("const WAVEFORM_PANEL_CONTENT_MIN_WIDTH_PX = 280")
    expect(panelSource).toContain("const WAVEFORM_MIN_HEIGHT = 120")
    expect(panelSource).toContain("const WAVEFORM_WITH_PREVIEW_HEIGHT = 148")
    expect(panelSource).toContain("WAVEFORM_PANEL_CONTENT_MIN_WIDTH_PX")
    expect(mainWindowSource).toContain("const VISUALIZER_BUFFER_LENGTH = 52")
    expect(mainWindowSource).toContain("const WAVEFORM_PANEL_CONTENT_MIN_WIDTH = 280")
    expect(mainWindowSource).toContain("export const WAVEFORM_MIN_HEIGHT = 120")
    expect(mainWindowSource).toContain("export const WAVEFORM_WITH_PREVIEW_HEIGHT = 148")
    expect(mainWindowSource).toContain(
      "return Math.max(waveformWidth, WAVEFORM_PANEL_CONTENT_MIN_WIDTH)"
    )
    expect(panelResizeWrapperSource).toContain("const WAVEFORM_MIN_HEIGHT = 120")
  })

  it("restores waveform panel sizing independently from progress panel sizing", () => {
    const resizeWaveformSection = mainWindowSource.slice(
      mainWindowSource.indexOf("export function resizePanelForWaveform()"),
      mainWindowSource.indexOf("export function resizePanelForWaveformPreview")
    )

    expect(mainWindowSource).toContain("const getWaveformPanelSize =")
    expect(mainWindowSource).toContain('const savedSize = getSavedPanelSize("waveform")')
    expect(mainWindowSource).toContain("config.panelWaveformSize")
    expect(mainWindowSource).toContain("Ignoring oversized legacy waveform size")
    expect(tipcSource).toContain("updatedConfig.panelWaveformSize = { width, height }")
    const legacyCustomSizeSection = tipcSource.slice(
      tipcSource.indexOf("savePanelCustomSize: t.procedure"),
      tipcSource.indexOf("// Save panel size with mode-specific persistence")
    )
    expect(legacyCustomSizeSection).toContain("panelCustomSize: { width, height }")
    expect(legacyCustomSizeSection).not.toContain("panelWaveformSize")
    expect(resizeWaveformSection).toContain("getWaveformPanelSize()")
    expect(resizeWaveformSection).not.toContain("Math.max(currentWidth")
  })

  it("keeps completed progress panels in progress sizing instead of waveform sizing", () => {
    const modeSwitchSection = panelSource.slice(
      panelSource.indexOf('let targetMode: "agent" | "normal" | null = null'),
      panelSource.indexOf("// Note: We don't need to hide text input")
    )

    expect(modeSwitchSection).toContain("if (anyActiveNonSnoozed)")
    expect(modeSwitchSection).toContain("} else if (anyVisibleSessions && !recording) {")
    expect(modeSwitchSection).toContain('targetMode = "agent"')
    expect(modeSwitchSection).toContain("recording,")
    expect(panelSource).toContain("anyVisibleSessions && !recording ? PROGRESS_MIN_HEIGHT : waveformHeight")
  })

  it("keeps recording waveform layout stable under browser zoom", () => {
    expect(panelSource).toContain("function RecordingWaveformPanel")
    expect(panelSource).toContain("getPanelViewportScale(nativePanelSize, cssViewportSize)")
    expect(panelSource).toContain("stableRecordingViewportSize.width - WAVEFORM_HORIZONTAL_PADDING_PX * 2")
    expect(panelSource).toContain('transform: `scale(${zoomCompensationScale})`')
    expect(panelResizeWrapperSource).toContain("viewportScale?: number")
    expect(panelResizeWrapperSource).toContain("minWidth: `${minWidth / safeViewportScale}px`")
    expect(panelResizeWrapperSource).toContain("minHeight: `${minHeight / safeViewportScale}px`")
    expect(panelResizeWrapperSource).toContain("const newWidth = Math.max(minWidth, startSize.width + delta.width)")
    expect(panelResizeWrapperSource).toContain("const newHeight = Math.max(minHeight, startSize.height + delta.height)")
    expect(panelResizeWrapperSource).not.toContain("delta.width * safeViewportScale")
    expect(panelResizeWrapperSource).not.toContain("delta.height * safeViewportScale")
  })

  it("gives text input its own safer min width, height, and persisted size bucket", () => {
    expect(panelSource).toContain("const TEXT_INPUT_MIN_WIDTH_PX = 380")
    expect(panelSource).toContain("const TEXT_INPUT_MIN_HEIGHT = 180")
    expect(panelSource).toContain("const minWidth = showTextInput ? TEXT_INPUT_MIN_WIDTH_PX : MIN_WAVEFORM_WIDTH")
    expect(mainWindowSource).toContain("export const TEXT_INPUT_MIN_WIDTH = textInputPanelWindowSize.width")
    expect(mainWindowSource).toContain('return getSavedPanelSize("textInput")')
    expect(tipcSource).toContain("updatedConfig.panelTextInputSize = { width, height }")
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

  it("re-focuses the floating panel window before focusing hotkey-opened text input", () => {
    const showTextInputSection = panelSource.slice(
      panelSource.indexOf("const unlisten = rendererHandlers.showTextInput.listen((data) => {"),
      panelSource.indexOf("return unlisten", panelSource.indexOf("const unlisten = rendererHandlers.showTextInput.listen((data) => {")),
    )
    const mainProcessTextInputSection = mainWindowSource.slice(
      mainWindowSource.indexOf("export async function showPanelWindowAndShowTextInput("),
      mainWindowSource.indexOf("export function makePanelWindowClosable()")
    )

    expect(showTextInputSection).toContain(
      'await tipcClient.setPanelFocusable({ focusable: true, andFocus: true })'
    )
    expect(showTextInputSection).toContain("textInputPanelRef.current?.focus()")
    // Text-input open must preserve main window visibility. Neither the
    // shouldHideVisibleMainBeforeTextInputOpen guard nor the helper call should
    // exist in the main-process flow anymore.
    expect(mainProcessTextInputSection).not.toContain("const shouldHideVisibleMainBeforeTextInputOpen =")
    expect(mainProcessTextInputSection).not.toContain("hideMainWindowForTextInputPanelOpen()")
    expect(mainWindowSource).not.toContain("function hideMainWindowForTextInputPanelOpen")
    expect(mainProcessTextInputSection).toContain("setPanelFocusable(true)")
    expect(mainProcessTextInputSection).not.toContain("setPanelFocusable(true, true)")
    expect(mainWindowSource).toContain('logApp(`[showPanelWindow] Showing panel with showInactive() for ${mode} mode`)')
  })

  it("lets text-input cancel defer state cleanup to the main-process hide path", () => {
    const cancelSection = panelSource.slice(
      panelSource.indexOf("onCancel={() => {"),
      panelSource.indexOf("isProcessing={", panelSource.indexOf("onCancel={() => {")),
    )

    expect(cancelSection).toContain("tipcClient.hidePanelWindow({})")
    expect(cancelSection).not.toContain("tipcClient.clearTextInputState({})")
  })

  it("lets MCP text submits create fresh conversations in the main process", () => {
    const handleTextSubmitSection = panelSource.slice(
      panelSource.indexOf("const handleTextSubmit = async (text: string) => {"),
      panelSource.indexOf("// MCP handlers"),
    )

    expect(handleTextSubmitSection).toContain("mcpTextInputMutation.mutate({")
    expect(handleTextSubmitSection).not.toContain('await startNewConversation(text, "user")')
  })

  it("avoids precreating stub conversations before MCP recordings", () => {
    const mcpRecordingSection = panelSource.slice(
      panelSource.indexOf("const mcpTranscribeMutation = useMutation({"),
      panelSource.indexOf("const textInputMutation = useMutation({"),
    )

    expect(mcpRecordingSection).toContain("await tipcClient.createMcpRecording({")
    expect(mcpRecordingSection).not.toContain('await startNewConversation(transcript, "user")')
  })

  it("preserves the active conversation when the emergency stop handler fires", () => {
    const emergencyStopSection = panelSource.slice(
      panelSource.indexOf("const unlisten = rendererHandlers.emergencyStopAgent.listen(() => {"),
      panelSource.indexOf("return unlisten", panelSource.indexOf("const unlisten = rendererHandlers.emergencyStopAgent.listen(() => {")),
    )

    expect(emergencyStopSection).toContain('ttsManager.stopAll("panel-emergency-stop")')
    expect(emergencyStopSection).not.toContain("endConversation()")
  })
})
