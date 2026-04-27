import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const panelSource = readFileSync(new URL("./panel.tsx", import.meta.url), "utf8")
const mainWindowSource = readFileSync(new URL("../../../main/window.ts", import.meta.url), "utf8")
const tipcSource = readFileSync(new URL("../../../main/tipc.ts", import.meta.url), "utf8")
const panelResizeWrapperSource = readFileSync(new URL("../components/panel-resize-wrapper.tsx", import.meta.url), "utf8")
const panelResizeUtilsSource = readFileSync(new URL("../components/panel-resize-utils.ts", import.meta.url), "utf8")

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
    expect(mainWindowSource).toContain("export const LEGACY_WAVEFORM_SIZE_MAX_WIDTH = 420")
    expect(mainWindowSource).toContain("export const LEGACY_WAVEFORM_SIZE_MAX_HEIGHT = 240")
    expect(mainWindowSource).toContain("export const PANEL_SAVED_SIZE_MAX_WIDTH = 3000")
    expect(mainWindowSource).toContain("export const PANEL_SAVED_SIZE_MAX_HEIGHT = 2000")
    expect(tipcSource).toContain("LEGACY_WAVEFORM_SIZE_MAX_WIDTH")
    expect(tipcSource).toContain("LEGACY_WAVEFORM_SIZE_MAX_HEIGHT")
    expect(tipcSource).toContain("PANEL_SAVED_SIZE_MAX_WIDTH")
    expect(tipcSource).toContain("PANEL_SAVED_SIZE_MAX_HEIGHT")
    expect(tipcSource).not.toContain("legacyCustomSize.width <= 420")
    expect(tipcSource).not.toContain("legacyCustomSize.height <= 240")
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
    expect(panelSource).toContain("Number.isFinite(nativePanelSize.width)")
    expect(panelSource).toContain("stableRecordingViewportSize.width - WAVEFORM_HORIZONTAL_PADDING_PX * 2")
    expect(panelSource).toContain('transform: `scale(${zoomCompensationScale})`')
    expect(panelResizeWrapperSource).toContain("viewportScale?: number")
    expect(panelResizeWrapperSource).toContain("fallbackMode?: PanelMode")
    expect(panelResizeWrapperSource).toContain("minWidth: `${minWidth / safeViewportScale}px`")
    expect(panelResizeWrapperSource).toContain("minHeight: `${minHeight / safeViewportScale}px`")
    expect(panelResizeUtilsSource).toContain("export const getNativePanelResizeSize =")
    expect(panelResizeWrapperSource).toContain("const safeViewportScale = useMemo(")
    expect(panelResizeWrapperSource).toContain("[viewportScale],")

    const nativeResizeHelperSection = panelResizeUtilsSource.slice(
      panelResizeUtilsSource.indexOf("export const getNativePanelResizeSize =")
    )
    expect(nativeResizeHelperSection).toContain("Math.round(startSize.width + delta.width * viewportScale)")
    expect(nativeResizeHelperSection).toContain("Math.round(startSize.height + delta.height * viewportScale)")
    expect(nativeResizeHelperSection).not.toContain("safeViewportScale")
    expect(panelResizeWrapperSource).toContain("safeViewportScale,")
    expect(panelResizeWrapperSource).toContain("size.width - startSize.width")
    expect(panelResizeWrapperSource).toContain("size.height - startSize.height")
    expect(panelResizeWrapperSource).toContain("[enableResize, minWidth, minHeight, safeViewportScale]")
    expect(panelResizeWrapperSource).toContain("const handleResizeStart = useCallback((size: PanelSize) => {")
    expect(panelResizeWrapperSource).toContain("resizeStartSizeRef.current = size")
    expect(panelResizeWrapperSource).toContain("setCurrentSize(size)")
    expect(panelResizeWrapperSource).toContain("onResizeStart={handleResizeStart}")
    expect(panelSource).toContain("viewportScale={panelViewportScale}")
    expect(panelSource).toContain('const panelResizeMode = showTextInput ? "textInput"')
    expect(panelSource).toContain("fallbackMode={panelResizeMode}")
  })

  it("updates the native minimum height while waveform preview is visible", () => {
    const previewResizeSection = mainWindowSource.slice(
      mainWindowSource.indexOf("export function resizePanelForWaveformPreview"),
      mainWindowSource.indexOf("/**\n * Set the focusability")
    )

    expect(previewResizeSection).toContain("const targetHeight = showPreview ? WAVEFORM_WITH_PREVIEW_HEIGHT : WAVEFORM_MIN_HEIGHT")
    expect(previewResizeSection).toContain('const minWidth = getPanelMinWidth("waveform")')
    expect(previewResizeSection).toContain("win.setMinimumSize(minWidth, targetHeight)")
  })

  it("ignores non-finite panel sizes from IPC before they reach recording layout math", () => {
    expect(panelSource).toContain("Number.isFinite((value as { width: number }).width)")
    expect(panelSource).toContain("Number.isFinite((value as { height: number }).height)")
    expect(panelSource).toContain("!Number.isFinite(nativePanelSize.width)")
    expect(panelSource).toContain("!Number.isFinite(nativePanelSize.height)")
    expect(panelSource).toContain("!Number.isFinite(cssViewportSize.width)")
    expect(panelSource).toContain("!Number.isFinite(cssViewportSize.height)")
    expect(panelResizeUtilsSource).toContain("Number.isFinite((value as { width: number }).width)")
    expect(mainWindowSource).toContain("if (!isFinitePanelSize(savedSize))")
    expect(mainWindowSource).toContain("Saved size is invalid:")
    expect(mainWindowSource).toContain("savedSize.width > PANEL_SAVED_SIZE_MAX_WIDTH")
    expect(mainWindowSource).toContain("Ignoring invalid saved waveform size, checking legacy fallback")
    expect(mainWindowSource).toContain("isFinitePanelSize(config.panelCustomSize)")
    expect(tipcSource).toContain("const isBoundedPanelSize =")
    expect(tipcSource).toContain("value.width <= PANEL_SAVED_SIZE_MAX_WIDTH")
    expect(tipcSource).toContain("config.panelWaveformSize.width >= minWidth")
    expect(tipcSource).toContain("config.panelWaveformSize.height >= WAVEFORM_MIN_HEIGHT")
    expect(tipcSource).toContain("const initialWaveformSize = savedWaveformSize ??")
    expect(tipcSource).toContain("normalizePanelSize(")
    expect(tipcSource).toContain("Math.min(PANEL_SAVED_SIZE_MAX_WIDTH")
    expect(tipcSource).toContain("Math.round(input.width)")
    expect(tipcSource).toContain("Math.round(input.height)")
    expect(tipcSource).toContain("if (!isFinitePanelSize(input))")
    expect(tipcSource).toContain("throw new Error(\"Invalid panel size\")")
    expect(tipcSource).toContain("isFinitePanelSize(legacyCustomSize)")
  })

  it("runtime-validates mode-aware panel size persistence", () => {
    expect(tipcSource).toContain("const isPanelSizeMode =")
    expect(tipcSource).toContain('value === "normal" || value === "agent" || value === "textInput"')
    expect(tipcSource).toContain("if (!isPanelSizeMode(input.mode))")
    expect(tipcSource).toContain('throw new Error("Invalid panel mode")')
    expect(tipcSource).toContain("const mode = isPanelSizeMode(rawMode) ? rawMode : \"normal\"")
  })

  it("keeps legacy size fallback limited to waveform mode", () => {
    const resizeEndSection = panelResizeWrapperSource.slice(
      panelResizeWrapperSource.indexOf("const handleResizeEnd = useCallback"),
      panelResizeWrapperSource.indexOf("return (")
    )

    expect(resizeEndSection).toContain('if (mode === "normal")')
    expect(resizeEndSection).toContain("let finalSize = requestedFinalSize")
    expect(resizeEndSection).toContain("const mode: PanelMode = isPanelMode(rawMode) ? rawMode : fallbackMode")
    expect(resizeEndSection).toContain("await tipcClient.savePanelCustomSize(finalSize)")
    expect(resizeEndSection).toContain("dedicated buckets and must not clobber the shared legacy size")
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
